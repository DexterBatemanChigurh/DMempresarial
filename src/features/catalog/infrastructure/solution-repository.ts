import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { solutionItems, solutions } from "@/db/schema";

/**
 * Leitura PÚBLICA de soluções: só `PUBLISHED`, filtrado na própria consulta. DTOs sem colunas
 * internas (versão, criadores, datas de arquivo).
 */
export type PublicSolutionSummary = {
  slug: string;
  type: "CONSULTORIA" | "SERVICO";
  title: string;
  summary: string;
  isFeatured: boolean;
};

const published = eq(solutions.status, "PUBLISHED");

export async function listPublishedSolutions(executor: Executor): Promise<PublicSolutionSummary[]> {
  return executor
    .select({
      slug: solutions.slug,
      type: solutions.type,
      title: solutions.title,
      summary: solutions.summary,
      isFeatured: solutions.isFeatured,
    })
    .from(solutions)
    .where(published)
    .orderBy(asc(solutions.position), asc(solutions.title));
}

export type SolutionOption = {
  id: string;
  title: string;
  slug: string;
  type: "CONSULTORIA" | "SERVICO";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

/** Para o seletor de solução relacionada do artigo: TODAS as soluções, qualquer status. */
export async function listSolutionsForAdmin(executor: Executor): Promise<SolutionOption[]> {
  return executor
    .select({
      id: solutions.id,
      title: solutions.title,
      slug: solutions.slug,
      type: solutions.type,
      status: solutions.status,
    })
    .from(solutions)
    .orderBy(asc(solutions.title));
}

export async function findPublishedSolutionBySlug(executor: Executor, slug: string) {
  const [solution] = await executor
    .select({
      id: solutions.id,
      slug: solutions.slug,
      type: solutions.type,
      title: solutions.title,
      summary: solutions.summary,
      context: solutions.context,
      approach: solutions.approach,
      seoTitle: solutions.seoTitle,
      seoDescription: solutions.seoDescription,
    })
    .from(solutions)
    .where(and(published, eq(solutions.slug, slug)))
    .limit(1);
  if (!solution) return null;

  const items = await executor
    .select({
      kind: solutionItems.kind,
      position: solutionItems.position,
      title: solutionItems.title,
      body: solutionItems.body,
    })
    .from(solutionItems)
    .where(eq(solutionItems.solutionId, solution.id))
    .orderBy(asc(solutionItems.kind), asc(solutionItems.position));

  const { id: _id, ...publicFields } = solution;
  return { ...publicFields, items };
}
