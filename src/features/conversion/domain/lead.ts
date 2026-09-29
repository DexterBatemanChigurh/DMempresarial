import { z } from "zod";

/**
 * Regras puras de leads e assinantes (docs/03, partes 22 e 23). O pipeline (validação, anti-spam,
 * rate limit, e-mail) é da fase de leads; aqui ficam a normalização e os estados válidos.
 */

/** Versão do texto de consentimento aceito (LGPD) — muda se o texto mudar; registrada em cada lead. */
export const LEAD_CONSENT_VERSION = "2026-09-23";

const EMAIL_FORMAT = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Obrigatórios: nome, e-mail, WhatsApp, mensagem, consentimento (docs/01 §14, D3; WhatsApp
 * obrigatório desde 29/09/2026, pedido do usuário). O resto é opcional —
 * "mínimo necessário" (docs/03 §22). Sem `interesse`/atribuição: são explicitamente opcionais no
 * blueprint e a atribuição fica atrás de uma flag "desligada até decisão jurídica" — nem começa.
 */
export const leadFormSchema = z.object({
  name: z.string().trim().min(1, "Informe seu nome.").max(120),
  email: z.string().trim().toLowerCase().regex(EMAIL_FORMAT, "Informe um e-mail válido.").max(254),
  message: z
    .string()
    .trim()
    .min(1, "Conte brevemente sobre o que gostaria de conversar.")
    .max(5000),
  phone: z
    .string()
    .trim()
    .max(30)
    .refine((v) => v.replace(/\D/g, "").length >= 10, "Informe seu WhatsApp com DDD."),
  company: z.string().trim().max(120).optional(),
  jobTitle: z.string().trim().max(120).optional(),
  segment: z.string().trim().max(80).optional(),
  website: z.string().trim().max(300).optional(),
  consent: z.literal(true, { message: "É preciso aceitar para enviar." }),
});
export type LeadFormInput = z.infer<typeof leadFormSchema>;

/** E-mail comparado sem espaços e em minúsculas (o banco também é insensível a caixa). */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "DISCARDED", "SPAM"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_TRANSITIONS: Readonly<Record<LeadStatus, readonly LeadStatus[]>> = {
  NEW: ["CONTACTED", "DISCARDED", "SPAM"],
  CONTACTED: ["QUALIFIED", "DISCARDED"],
  QUALIFIED: ["DISCARDED"],
  // Um falso positivo de spam pode ser resgatado; descartado é definitivo.
  SPAM: ["NEW"],
  DISCARDED: [],
};

export function canTransitionLead(from: LeadStatus, to: LeadStatus): boolean {
  return LEAD_TRANSITIONS[from].includes(to);
}
