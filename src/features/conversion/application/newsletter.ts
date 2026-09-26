import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { getEmail, type EmailPort } from "@/server/email";
import { env } from "@/server/env";
import { hashIpForToday } from "@/server/security/ip-hash";
import { verifyFormToken } from "@/server/security/form-token";
import { consumeRateLimit, windowedKey } from "@/server/security/rate-limit";
import {
  createNewsletterConfirmToken,
  createNewsletterUnsubscribeToken,
  verifyToken,
} from "@/server/security/signed-token";
import { eq } from "drizzle-orm";
import { newsletterSubscribers } from "@/db/schema";
import {
  confirmSubscriber,
  findRecentDuplicateSubscriber,
  findSubscriberByConfirmTokenHash,
  findSubscriberByEmail,
  insertSubscriber,
  unsubscribeSubscriber,
} from "../infrastructure/newsletter-repository";
import { canTransitionSubscriber, type SubscriberStatus } from "../domain/lead";
import { LEAD_CONSENT_VERSION, normalizeEmail } from "../domain/lead";

/**
 * Newsletter double-opt-in (docs/03, parte 23):
 * 1. Cadastro cria PENDING + token de confirmação (hash no banco, token no e-mail)
 * 2. E-mail traz link para `/newsletter/confirmacao?token=...` — a página pede um clique (POST):
 *    um GET nunca muda estado, senão o antivírus/pré-visualizador de e-mail que "abre" o link
 *    confirmaria a inscrição no lugar da pessoa
 * 3. Confirmação marca ACTIVE + confirmedAt
 * 4. Descadastro por token assinado (`/newsletter/descadastro?token=...`, também por POST)
 *
 * O token de confirmação é ASSINADO (HMAC, com validade) e só o hash dele fica no banco.
 */

const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const CONFIRM_TOKEN_TTL_MS = 48 * 60 * 60 * 1000; // 48 horas
const MIN_SUBMIT_MS = 2_500;
const MAX_SUBMIT_MS = 60 * 60 * 1000; // 1h
const DEDUPE_WINDOW_MS = 5 * 60 * 1000; // 5 min

const RATE_LIMITS = {
  ip: { windowMs: 60 * 60 * 1000, limit: 5 }, // 5/hora por IP
  email: { windowMs: 24 * 60 * 60 * 1000, limit: 3 }, // 3/dia por e-mail
};

const TOKEN_PURPOSE_CONFIRM = "newsletter:confirm";
const TOKEN_PURPOSE_UNSUBSCRIBE = "newsletter:unsubscribe";

/** `email` é injetável para testes; em produção vem de `getEmail()`. */
type Deps = { db: Database; email?: EmailPort };

// Entrada BRUTA do formulário público
export type SubscribeNewsletterInput = {
  email: string;
  name?: string;
  consent: boolean;
  honeypot: string;
  formToken: string;
  ip: string | null;
  source?: string;
};

export async function subscribeNewsletter(
  { db, email: emailPort }: Deps,
  input: SubscribeNewsletterInput,
): Promise<{ ok: true }> {
  // Honeypot
  if (input.honeypot.trim() !== "") {
    return { ok: true };
  }

  // Token de tempo mínimo
  if (!verifyFormToken(input.formToken, { minAgeMs: MIN_SUBMIT_MS, maxAgeMs: MAX_SUBMIT_MS })) {
    throw new AppError(
      "VALIDATION",
      "Não foi possível confirmar o envio. Recarregue a página e tente de novo.",
    );
  }

  // Validação Zod
  if (!input.consent) {
    throw new AppError("VALIDATION", "É preciso aceitar para se inscrever.", {
      fieldErrors: { consent: ["É preciso aceitar para se inscrever."] },
    });
  }
  const email = normalizeEmail(input.email);
  if (!EMAIL_FORMAT.test(email)) {
    throw new AppError("VALIDATION", "E-mail inválido.", {
      fieldErrors: { email: ["E-mail inválido."] },
    });
  }
  if (email.length > 254) {
    throw new AppError("VALIDATION", "E-mail muito longo.", {
      fieldErrors: { email: ["E-mail muito longo."] },
    });
  }
  if (input.name && input.name.trim().length > 120) {
    throw new AppError("VALIDATION", "Nome muito longo.", {
      fieldErrors: { name: ["Nome muito longo."] },
    });
  }

  // Rate limit
  const ipHash = input.ip ? hashIpForToday(input.ip) : null;
  if (ipHash) {
    const ipCount = await consumeRateLimit(
      db,
      windowedKey("newsletter:ip", ipHash, RATE_LIMITS.ip.windowMs),
    );
    if (ipCount > RATE_LIMITS.ip.limit) {
      throw new AppError("RATE_LIMITED", "Muitas tentativas. Tente de novo mais tarde.", {
        retryAfterSeconds: Math.ceil(RATE_LIMITS.ip.windowMs / 1000),
      });
    }
  }
  const emailCount = await consumeRateLimit(
    db,
    windowedKey("newsletter:email", email, RATE_LIMITS.email.windowMs),
  );
  if (emailCount > RATE_LIMITS.email.limit) {
    throw new AppError("RATE_LIMITED", "Muitas tentativas. Tente de novo mais tarde.", {
      retryAfterSeconds: Math.ceil(RATE_LIMITS.email.windowMs / 1000),
    });
  }

  // Duplicado recente
  if (await findRecentDuplicateSubscriber(db, email, DEDUPE_WINDOW_MS)) {
    return { ok: true };
  }

  // Verifica assinante existente
  const existing = await findSubscriberByEmail(db, email);
  if (existing) {
    // Se já está ACTIVE, finge sucesso (idempotente)
    if (existing.status === "ACTIVE") return { ok: true };

    // Se está PENDING e token não expirou, não reenvia
    if (
      existing.status === "PENDING" &&
      existing.confirmExpiresAt &&
      existing.confirmExpiresAt > new Date()
    ) {
      return { ok: true };
    }

    // Se está UNSUBSCRIBED ou BOUNCED, precisa reativar (volta a PENDING com novo token)
    if (existing.status === "UNSUBSCRIBED" || existing.status === "BOUNCED") {
      // A reativação exige novo consentimento explícito (o formulário já enviou consent=true)
      // Aqui apenas prosseguimos para gerar novo token
    }
  }

  // Gera token de confirmação
  const confirmToken = await createNewsletterConfirmToken(email);
  const confirmTokenHash = await hashToken(confirmToken);
  const confirmExpiresAt = new Date(Date.now() + CONFIRM_TOKEN_TTL_MS);

  await db.transaction(async (tx) => {
    if (existing) {
      // Atualiza existente: novo token, mesma linha
      await tx
        .update(newsletterSubscribers)
        .set({
          status: "PENDING",
          name: input.name?.trim() || null,
          consentAt: new Date(),
          consentVersion: LEAD_CONSENT_VERSION,
          confirmTokenHash,
          confirmExpiresAt,
          source: input.source || null,
        })
        .where(eq(newsletterSubscribers.id, existing.id));
      await recordAudit(tx, {
        action: "newsletter.token_regenerated",
        entityType: "newsletter_subscriber",
        entityId: existing.id,
      });
    } else {
      // Novo assinante
      await insertSubscriber(tx, {
        email,
        name: input.name?.trim() || null,
        consentAt: new Date(),
        consentVersion: LEAD_CONSENT_VERSION,
        confirmTokenHash,
        confirmExpiresAt,
        source: input.source || null,
      });
      await recordAudit(tx, {
        action: "newsletter.subscribed_pending",
        entityType: "newsletter_subscriber",
        entityId: "new",
      });
    }
  });

  // Envia e-mail de confirmação (best effort; falha deixa o assinante em PENDING para retry posterior)
  try {
    const confirmUrl = `${env().SITE_URL}/newsletter/confirmacao?token=${encodeURIComponent(confirmToken)}`;
    await (emailPort ?? getEmail()).send({
      to: email,
      subject: "Confirme sua inscrição na newsletter DM Empresarial",
      text: `Olá,\n\nClique no link abaixo para confirmar sua inscrição:\n${confirmUrl}\n\nO link expira em 48 horas.\n\nSe não foi você, ignore este e-mail.`,
    });
  } catch {
    // Falha de e-mail não desfaz a inscrição; fica em PENDING para retry
  }

  return { ok: true };
}

/** Confirma assinatura via token (chamada pela rota /api/newsletter/confirm). */
export async function confirmNewsletter({ db }: Deps, token: string): Promise<{ ok: true }> {
  const payload = await verifyToken(token, TOKEN_PURPOSE_CONFIRM);
  if (!payload) {
    throw new AppError("VALIDATION", "Token inválido ou expirado.");
  }

  const subscriber = await findSubscriberByConfirmTokenHash(db, await hashToken(token));
  if (!subscriber) {
    throw new AppError("NOT_FOUND", "Inscrição não encontrada.");
  }
  if (subscriber.confirmExpiresAt && subscriber.confirmExpiresAt < new Date()) {
    throw new AppError("VALIDATION", "Token expirado. Inscreva-se novamente.");
  }
  if (subscriber.status !== "PENDING") {
    throw new AppError("DOMAIN_RULE", "Esta inscrição não pode ser confirmada no estado atual.");
  }

  await db.transaction(async (tx) => {
    await confirmSubscriber(tx, subscriber.id);
    await recordAudit(tx, {
      action: "newsletter.confirmed",
      entityType: "newsletter_subscriber",
      entityId: subscriber.id,
    });
  });

  return { ok: true };
}

/** Descadastro via token (chamada pela rota /api/newsletter/unsubscribe). */
export async function unsubscribeNewsletter({ db }: Deps, token: string): Promise<{ ok: true }> {
  const payload = await verifyToken(token, TOKEN_PURPOSE_UNSUBSCRIBE);
  if (!payload) {
    throw new AppError("VALIDATION", "Token inválido ou expirado.");
  }

  const subscriber = await findSubscriberByEmail(db, payload.email as string);
  if (!subscriber) {
    throw new AppError("NOT_FOUND", "Inscrição não encontrada.");
  }
  if (!canTransitionSubscriber(subscriber.status as SubscriberStatus, "UNSUBSCRIBED")) {
    throw new AppError("DOMAIN_RULE", "Esta inscrição não pode ser descadastrada no estado atual.");
  }

  await db.transaction(async (tx) => {
    await unsubscribeSubscriber(tx, subscriber.id);
    await recordAudit(tx, {
      action: "newsletter.unsubscribed",
      entityType: "newsletter_subscriber",
      entityId: subscriber.id,
    });
  });

  return { ok: true };
}

/** Link de descadastro para o rodapé de toda edição enviada (e para o List-Unsubscribe). */
export async function newsletterUnsubscribeUrl(email: string): Promise<string> {
  const token = await createNewsletterUnsubscribeToken(normalizeEmail(email));
  return `${env().SITE_URL}/newsletter/descadastro?token=${encodeURIComponent(token)}`;
}

// Hash do token (SHA-256 hex) — nunca guarda token em claro
async function hashToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

import { getDb } from "@/db/client";

export const subscribeNewsletterForRoute = (input: SubscribeNewsletterInput) =>
  subscribeNewsletter({ db: getDb() }, input);
export const confirmNewsletterForRoute = (token: string) =>
  confirmNewsletter({ db: getDb() }, token);
export const unsubscribeNewsletterForRoute = (token: string) =>
  unsubscribeNewsletter({ db: getDb() }, token);
