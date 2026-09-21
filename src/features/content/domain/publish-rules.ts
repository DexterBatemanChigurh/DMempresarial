import { isEmptyRichText } from "@/lib/rich-text";
import { isReservedSlug, isValidSlug } from "@/lib/slug";

/**
 * Pré-requisitos para publicar ou agendar um artigo (Blueprint 1, seção 13). Devolve TODOS os
 * impedimentos de uma vez, com mensagens que dizem o que falta, para o editor corrigir de uma
 * só vez. Puro: recebe os dados já carregados pelo servidor.
 */
export type PublishBlocker = { code: PublishBlockerCode; message: string };

export type PublishBlockerCode =
  | "TITLE_MISSING"
  | "SLUG_INVALID"
  | "SLUG_RESERVED"
  | "AUTHOR_MISSING"
  | "PRIMARY_CATEGORY_MISSING"
  | "BODY_EMPTY"
  | "COVER_ALT_MISSING"
  | "SCHEDULE_DATE_MISSING"
  | "SCHEDULE_IN_PAST";

export type PostForPublish = {
  title: string;
  slug: string;
  authorId: string | null;
  primaryCategoryId: string | null;
  body: unknown;
  coverMediaId: string | null;
  coverAltText: string | null;
};

export function postPublishBlockers(
  post: PostForPublish,
  options: { scheduledFor?: Date | null; now?: Date; scheduling?: boolean } = {},
): PublishBlocker[] {
  const blockers: PublishBlocker[] = [];
  const add = (code: PublishBlockerCode, message: string) => blockers.push({ code, message });

  if (post.title.trim() === "") add("TITLE_MISSING", "Falta o título.");
  if (!isValidSlug(post.slug)) add("SLUG_INVALID", "O endereço (slug) é inválido.");
  else if (isReservedSlug(post.slug)) add("SLUG_RESERVED", "Este endereço (slug) é reservado.");
  if (!post.authorId) add("AUTHOR_MISSING", "Falta o autor.");
  if (!post.primaryCategoryId) add("PRIMARY_CATEGORY_MISSING", "Escolha a categoria principal.");
  if (isEmptyRichText(post.body)) add("BODY_EMPTY", "O texto do artigo está vazio.");
  // Imagem de capa sem descrição inviabiliza a leitura por leitor de tela (docs/02, seção 26).
  if (post.coverMediaId && (post.coverAltText ?? "").trim() === "") {
    add("COVER_ALT_MISSING", "Falta o texto alternativo da imagem de capa.");
  }

  if (options.scheduling) {
    const now = options.now ?? new Date();
    if (!options.scheduledFor) add("SCHEDULE_DATE_MISSING", "Escolha a data de publicação.");
    else if (options.scheduledFor.getTime() <= now.getTime()) {
      add("SCHEDULE_IN_PAST", "A data de publicação precisa estar no futuro.");
    }
  }
  return blockers;
}
