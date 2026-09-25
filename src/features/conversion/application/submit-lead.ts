import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { getPublicSettings } from "@/features/settings/application/settings-crud";
import { getEmail } from "@/server/email";
import { hashIpForToday } from "@/server/security/ip-hash";
import { verifyFormToken } from "@/server/security/form-token";
import { consumeRateLimit, windowedKey } from "@/server/security/rate-limit";
import {
  countLinks,
  findRecentDuplicateLead,
  insertLead,
  markLeadAsSpam,
  markLeadNotified,
} from "../infrastructure/lead-repository";
import { LEAD_CONSENT_VERSION, leadFormSchema, type LeadFormInput } from "../domain/lead";

/**
 * Pipeline de lead (docs/03, parte 22): honeypot + token de tempo mínimo → rate limit (ip_hash e
 * e-mail) → Zod + normalização → dedupe → transação (lead + auditoria) → resposta → depois da
 * resposta, e-mail de notificação (melhor esforço; falha não desfaz o lead, só deixa
 * `notified_at` nulo para uma tentativa futura — reenvio por cron ainda não implementado).
 */
type Deps = { db: Database };

const MIN_SUBMIT_MS = 2_500; // ninguém preenche nome+e-mail+mensagem em menos de 2,5s
const MAX_SUBMIT_MS = 60 * 60 * 1000; // 1h: depois disso, formulário "velho", pede recarregar
const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 min
const LINK_SPAM_THRESHOLD = 3;

const RATE_LIMITS = {
  ip: { windowMs: 15 * 60 * 1000, limit: 5 },
  email: { windowMs: 60 * 60 * 1000, limit: 3 },
};

// Entrada BRUTA (não validada ainda) — `consent` é `boolean`, não o `true` literal de
// `LeadFormInput`: só depois do `leadFormSchema.safeParse` é que vira o tipo validado.
export type SubmitLeadInput = Omit<LeadFormInput, "consent"> & {
  consent: boolean;
  /** Campo isca: nunca preenchido por gente, só por bot. Não é uma coluna real. */
  honeypot: string;
  formToken: string;
  ip: string | null;
};

export async function submitLead({ db }: Deps, input: SubmitLeadInput): Promise<{ ok: true }> {
  // Honeypot: finge sucesso (não entrega ao bot que foi detectado) e não grava nada.
  if (input.honeypot.trim() !== "") {
    return { ok: true };
  }

  if (!verifyFormToken(input.formToken, { minAgeMs: MIN_SUBMIT_MS, maxAgeMs: MAX_SUBMIT_MS })) {
    throw new AppError(
      "VALIDATION",
      "Não foi possível confirmar o envio. Recarregue a página e tente de novo.",
    );
  }

  const parsed = leadFormSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      (fieldErrors[key] ??= []).push(issue.message);
    }
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
  }
  const data = parsed.data;

  const ipHash = input.ip ? hashIpForToday(input.ip) : null;
  if (ipHash) {
    const ipCount = await consumeRateLimit(
      db,
      windowedKey("lead:ip", ipHash, RATE_LIMITS.ip.windowMs),
    );
    if (ipCount > RATE_LIMITS.ip.limit) {
      throw new AppError("RATE_LIMITED", "Muitas tentativas. Tente de novo mais tarde.", {
        retryAfterSeconds: Math.ceil(RATE_LIMITS.ip.windowMs / 1000),
      });
    }
  }
  const emailCount = await consumeRateLimit(
    db,
    windowedKey("lead:email", data.email, RATE_LIMITS.email.windowMs),
  );
  if (emailCount > RATE_LIMITS.email.limit) {
    throw new AppError("RATE_LIMITED", "Muitas tentativas. Tente de novo mais tarde.", {
      retryAfterSeconds: Math.ceil(RATE_LIMITS.email.windowMs / 1000),
    });
  }

  // Duplicado (clique duplo, reenvio): finge sucesso, não grava de novo.
  if (await findRecentDuplicateLead(db, data.email, data.message, DEDUPE_WINDOW_MS)) {
    return { ok: true };
  }

  const isLikelySpam = countLinks(data.message) >= LINK_SPAM_THRESHOLD;

  const lead = await db.transaction(async (tx) => {
    const created = await insertLead(tx, {
      name: data.name,
      email: data.email,
      message: data.message,
      phone: data.phone || null,
      company: data.company || null,
      jobTitle: data.jobTitle || null,
      segment: data.segment || null,
      website: data.website || null,
      consentAt: new Date(),
      consentVersion: LEAD_CONSENT_VERSION,
      ipHash,
    });
    if (isLikelySpam) await markLeadAsSpam(tx, created.id);
    await recordAudit(tx, {
      action: isLikelySpam ? "lead.created_as_spam" : "lead.created",
      entityType: "lead",
      entityId: created.id,
      // Nunca o conteúdo do lead (nome/e-mail/mensagem são dados pessoais) — só que aconteceu.
    });
    return created;
  });

  // Lead marcado como spam (heurística) nunca notifica (docs/03 §22). Sem e-mail interno
  // configurado em Configurações, não há para quem notificar — fica para quando houver.
  const settings = await getPublicSettings({ db });
  if (!isLikelySpam && settings?.email) {
    try {
      await getEmail().send({
        to: settings.email,
        subject: `Novo contato pelo site: ${data.name}`,
        text: `Nome: ${data.name}\nE-mail: ${data.email}\nMensagem:\n${data.message}`,
      });
      await db.transaction((tx) => markLeadNotified(tx, lead.id));
    } catch {
      // Falha de e-mail não desfaz o lead: fica sem `notified_at`, para uma tentativa futura.
    }
  }

  return { ok: true };
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const submitLeadForRoute = (input: SubmitLeadInput) => submitLead({ db: getDb() }, input);
