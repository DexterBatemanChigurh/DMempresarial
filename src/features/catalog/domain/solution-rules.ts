import { isEmptyRichText } from "@/lib/rich-text";
import { isReservedSlug, isValidSlug } from "@/lib/slug";

/**
 * Publicar uma solução exige Hero (título + resumo), Contexto e Abordagem reais (Blueprint 1,
 * seção 08). Os demais blocos (situações, etapas, objetivos, especialistas, artigos) aparecem
 * quando preenchidos: "dado ausente = seção ausente". Nada aqui inventa conteúdo.
 */
export type SolutionBlockerCode =
  | "TITLE_MISSING"
  | "SLUG_INVALID"
  | "SLUG_RESERVED"
  | "SUMMARY_MISSING"
  | "CONTEXT_MISSING"
  | "APPROACH_MISSING";

export type SolutionBlocker = { code: SolutionBlockerCode; message: string };

export type SolutionForPublish = {
  title: string;
  slug: string;
  summary: string;
  context: unknown;
  approach: unknown;
};

export function solutionPublishBlockers(solution: SolutionForPublish): SolutionBlocker[] {
  const blockers: SolutionBlocker[] = [];
  const add = (code: SolutionBlockerCode, message: string) => blockers.push({ code, message });

  if (solution.title.trim() === "") add("TITLE_MISSING", "Falta o título.");
  if (!isValidSlug(solution.slug)) add("SLUG_INVALID", "O endereço (slug) é inválido.");
  else if (isReservedSlug(solution.slug)) add("SLUG_RESERVED", "Este endereço (slug) é reservado.");
  if (solution.summary.trim() === "") {
    add("SUMMARY_MISSING", "Falta o resumo (uma frase que começa pelo problema).");
  }
  if (isEmptyRichText(solution.context)) add("CONTEXT_MISSING", "Falta o contexto.");
  if (isEmptyRichText(solution.approach)) add("APPROACH_MISSING", "Falta a abordagem.");
  return blockers;
}
