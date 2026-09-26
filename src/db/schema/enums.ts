import { pgEnum } from "drizzle-orm/pg-core";

/** Estados de artigo (docs/03, parte 9). Só `PUBLISHED` é visível ao público. */
export const postStatus = pgEnum("post_status", [
  "DRAFT",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
]);

/** Soluções, especialistas e páginas não têm revisão nem agendamento no MVP. */
export const publishStatus = pgEnum("publish_status", ["DRAFT", "PUBLISHED", "ARCHIVED"]);

/** Formatos editoriais (docs/01, seção 12). Opcionais: ajudam quem escreve, não limitam. */
export const postFormat = pgEnum("post_format", [
  "ANALISE",
  "LEITURA_DE_MERCADO",
  "CONCEITO_APLICADO",
  "CASO",
  "OPINIAO",
  "REGIONAL",
]);

export const solutionType = pgEnum("solution_type", ["CONSULTORIA", "SERVICO"]);
export const solutionItemKind = pgEnum("solution_item_kind", ["SITUATION", "STEP", "GOAL"]);
export const specialistKind = pgEnum("specialist_kind", ["TEAM", "GUEST"]);
export const pageTemplate = pgEnum("page_template", ["HOME", "ABOUT", "CONTACT", "LEGAL"]);
export const mediaStatus = pgEnum("media_status", ["PENDING", "READY"]);
export const leadStatus = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "DISCARDED",
  "SPAM",
]);
export const subscriberStatus = pgEnum("subscriber_status", [
  "PENDING",
  "ACTIVE",
  "UNSUBSCRIBED",
  "BOUNCED",
]);
export const redirectOrigin = pgEnum("redirect_origin", ["AUTO", "MANUAL"]);

/** Origem de um depoimento: avaliação pública no Google ou enviado à DM com autorização. */
export const testimonialSource = pgEnum("testimonial_source", ["GOOGLE", "MANUAL"]);
