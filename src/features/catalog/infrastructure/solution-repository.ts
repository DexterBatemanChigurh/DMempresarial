import "server-only";
import { and, asc, count, desc, eq } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import { postSolutions, solutionItems, solutions } from "@/db/schema";

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

// ---------------------------------------------------------------------------------------------
// Leitura e escrita ADMINISTRATIVAS: qualquer status. Sempre atrás de `requireAdminSession` +
// `assertCan` na camada `application` — nada aqui decide permissão.
// ---------------------------------------------------------------------------------------------

function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 50) : 20;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type SolutionSummaryForAdmin = {
  id: string;
  slug: string;
  title: string;
  type: "CONSULTORIA" | "SERVICO";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
};

export async function listSolutionsForAdminPaged(
  executor: Executor,
  options: { page?: number } = {},
): Promise<Page<SolutionSummaryForAdmin>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, 20);
  const [totalRow] = await executor.select({ n: count() }).from(solutions);
  const rows = await executor
    .select({
      id: solutions.id,
      slug: solutions.slug,
      title: solutions.title,
      type: solutions.type,
      status: solutions.status,
      updatedAt: solutions.updatedAt,
    })
    .from(solutions)
    .orderBy(desc(solutions.updatedAt), desc(solutions.id))
    .limit(pageSize)
    .offset(offset);
  return { items: rows, total: totalRow?.n ?? 0, page, pageSize };
}

export type SolutionItemInput = {
  kind: "SITUATION" | "STEP" | "GOAL";
  title: string;
  body: string | null;
};

export type SolutionForEdit = {
  solution: typeof solutions.$inferSelect;
  items: SolutionItemInput[];
};

/** Carrega uma solução por completo para a tela de edição (sem travar linha: não é uma
 * transação de escrita). A autorização é responsabilidade de quem chama. */
export async function findSolutionForEdit(
  executor: Executor,
  id: string,
): Promise<SolutionForEdit | null> {
  const [solution] = await executor.select().from(solutions).where(eq(solutions.id, id)).limit(1);
  if (!solution) return null;
  const items = await executor
    .select({ kind: solutionItems.kind, title: solutionItems.title, body: solutionItems.body })
    .from(solutionItems)
    .where(eq(solutionItems.solutionId, id))
    .orderBy(asc(solutionItems.kind), asc(solutionItems.position));
  return { solution, items };
}

/** Só `post_solutions` bloqueia de verdade (`ON DELETE RESTRICT`); `specialist_solutions` é
 * `CASCADE` e não impede a exclusão. */
export async function isSolutionReferenced(executor: Executor, id: string): Promise<boolean> {
  const [row] = await executor
    .select({ postId: postSolutions.postId })
    .from(postSolutions)
    .where(eq(postSolutions.solutionId, id))
    .limit(1);
  return Boolean(row);
}

/** Grava os itens (situações, etapas, objetivos): apaga tudo e reinsere na ordem recebida. */
export async function replaceSolutionItems(
  tx: Transaction,
  solutionId: string,
  items: SolutionItemInput[],
): Promise<void> {
  await tx.delete(solutionItems).where(eq(solutionItems.solutionId, solutionId));
  if (items.length === 0) return;

  const positionByKind = new Map<string, number>();
  const rows = items.map((item) => {
    const position = positionByKind.get(item.kind) ?? 0;
    positionByKind.set(item.kind, position + 1);
    return { solutionId, kind: item.kind, position, title: item.title, body: item.body };
  });
  await tx.insert(solutionItems).values(rows);
}
