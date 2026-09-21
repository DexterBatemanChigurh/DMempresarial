/**
 * Máquina de estados de artigo (docs/03, parte 9). Puro: decide SE a transição existe. QUEM pode
 * fazê-la é da camada de aplicação (`can(...)`), e os pré-requisitos de publicação estão em
 * `publish-rules.ts`. Qualquer transição fora desta tabela é recusada pelo servidor.
 */
export const POST_STATUSES = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
export type PostStatus = (typeof POST_STATUSES)[number];

export const POST_TRANSITIONS: Readonly<Record<PostStatus, readonly PostStatus[]>> = {
  DRAFT: ["REVIEW", "SCHEDULED", "PUBLISHED"],
  REVIEW: ["DRAFT", "SCHEDULED", "PUBLISHED"],
  SCHEDULED: ["DRAFT", "PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};

export function canTransition(from: PostStatus, to: PostStatus): boolean {
  return POST_TRANSITIONS[from].includes(to);
}

/** Só `PUBLISHED` aparece para o público (páginas, busca, sitemap, JSON-LD). */
export function isPubliclyVisible(status: PostStatus): boolean {
  return status === "PUBLISHED";
}

/** Estados que exigem os pré-requisitos de publicação (o conteúdo vai, ou irá, a público). */
export function requiresPublishChecks(to: PostStatus): boolean {
  return to === "PUBLISHED" || to === "SCHEDULED";
}
