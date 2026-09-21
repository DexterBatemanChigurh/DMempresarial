/**
 * Regras puras de leads e assinantes (docs/03, partes 22 e 23). O pipeline (validação, anti-spam,
 * rate limit, e-mail) é da fase de leads; aqui ficam a normalização e os estados válidos.
 */

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

export const SUBSCRIBER_STATUSES = ["PENDING", "ACTIVE", "UNSUBSCRIBED", "BOUNCED"] as const;
export type SubscriberStatus = (typeof SUBSCRIBER_STATUSES)[number];

export const SUBSCRIBER_TRANSITIONS: Readonly<
  Record<SubscriberStatus, readonly SubscriberStatus[]>
> = {
  PENDING: ["ACTIVE", "UNSUBSCRIBED"],
  ACTIVE: ["UNSUBSCRIBED", "BOUNCED"],
  // Voltar exige um NOVO aceite: volta a PENDING, nunca direto a ACTIVE.
  UNSUBSCRIBED: ["PENDING"],
  BOUNCED: ["PENDING"],
};

export function canTransitionSubscriber(from: SubscriberStatus, to: SubscriberStatus): boolean {
  return SUBSCRIBER_TRANSITIONS[from].includes(to);
}
