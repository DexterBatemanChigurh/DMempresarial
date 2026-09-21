/**
 * Slugs (docs/03, parte 6, invariante 1): minúsculas ASCII com hífen, até 80 caracteres.
 * Puro e isomórfico. O banco reforça o mesmo formato com um CHECK.
 */
export const MAX_SLUG_LENGTH = 80;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/** Caminhos que já têm significado no site: nenhum conteúdo pode ocupá-los. */
export const RESERVED_SLUGS: ReadonlySet<string> = new Set([
  "admin",
  "api",
  "blog",
  "busca",
  "cases",
  "categoria",
  "contato",
  "design-system",
  "eventos",
  "login",
  "logout",
  "materiais",
  "newsletter",
  "obrigado",
  "politica-de-privacidade",
  "robots",
  "sitemap",
  "sobre",
  "solucoes",
  "servicos",
  "tag",
  "termos-de-uso",
]);

/** Gera um slug a partir de um título em português ("Gestão & Finanças" → "gestao-financas"). */
export function slugify(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // remove acentos
    .toLowerCase()
    .replace(/&/g, " e ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base.slice(0, MAX_SLUG_LENGTH).replace(/-+$/g, "");
}

export function isValidSlug(slug: string): boolean {
  return slug.length > 0 && slug.length <= MAX_SLUG_LENGTH && SLUG_PATTERN.test(slug);
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
