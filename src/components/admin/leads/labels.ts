export const LEAD_STATUS_LABEL = {
  NEW: "Novo",
  CONTACTED: "Contatado",
  QUALIFIED: "Qualificado",
  DISCARDED: "Descartado",
  SPAM: "Spam",
} as const;

export const LEAD_TRANSITION_LABEL = {
  NEW: "Não é spam (voltar para novo)",
  CONTACTED: "Marcar como contatado",
  QUALIFIED: "Marcar como qualificado",
  DISCARDED: "Descartar",
  SPAM: "Marcar como spam",
} as const;

export const SUBSCRIBER_STATUS_LABEL = {
  PENDING: "Aguardando confirmação",
  ACTIVE: "Ativo",
  UNSUBSCRIBED: "Cancelou",
  BOUNCED: "E-mail devolvido",
} as const;
