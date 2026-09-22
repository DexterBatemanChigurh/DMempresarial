import { isEmptyRichText } from "@/lib/rich-text";
import { isReservedSlug, isValidSlug } from "@/lib/slug";
import { ESSENTIAL_RICH_FIELD, type PageTemplate } from "./page-schemas";

/**
 * Publicar uma página institucional exige o bloco essencial do template real (docs/01, seções
 * 07/10/14; D4 — publicar só com conteúdo real). Puro: recebe os dados já carregados.
 */
export type PageBlockerCode =
  "TITLE_MISSING" | "KEY_INVALID" | "KEY_RESERVED" | "ESSENTIAL_MISSING";
export type PageBlocker = { code: PageBlockerCode; message: string };

export type PageForPublish = {
  title: string;
  key: string;
  template: PageTemplate;
  data: Record<string, unknown>;
};

export function pagePublishBlockers(page: PageForPublish): PageBlocker[] {
  const blockers: PageBlocker[] = [];
  const add = (code: PageBlockerCode, message: string) => blockers.push({ code, message });

  if (page.title.trim() === "") add("TITLE_MISSING", "Falta o título.");
  // `key` usa o mesmo formato de slug (minúsculas, números, hífen); reaproveita a validação.
  if (!isValidSlug(page.key)) add("KEY_INVALID", "O identificador da página é inválido.");
  else if (isReservedSlug(page.key))
    add("KEY_RESERVED", "Este identificador é reservado pelo site.");

  const essentialField = ESSENTIAL_RICH_FIELD[page.template];
  if (isEmptyRichText(page.data[essentialField])) {
    add("ESSENTIAL_MISSING", "Falta o texto principal desta página.");
  }
  return blockers;
}

/** As páginas legais ficam sempre publicadas depois de publicadas uma vez: nenhuma tela de
 * "substituto" existe no MVP, então arquivar fica bloqueado por completo, não só condicionado
 * (docs/03, parte 7.3: "proibido arquivar privacy/terms sem substituto"). */
export const ALWAYS_PUBLISHED_KEYS: ReadonlySet<string> = new Set(["privacy", "terms"]);

export function isArchiveBlocked(key: string): boolean {
  return ALWAYS_PUBLISHED_KEYS.has(key);
}
