import "server-only";
import { and, asc, count, desc, eq } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import { media, posts, specialistCategories, specialistSolutions, specialists } from "@/db/schema";

/**
 * Leitura PÚBLICA de especialistas: só `PUBLISHED` e só da equipe (`TEAM`). Autor convidado
 * nunca tem página pública. Nada de `user_id`, versão ou criadores. A foto é exposta como
 * `photoStorageKey` (chave `yyyy/mm/<uuid>.webp`) para a UI montar `/media/<key>` — mesma
 * convenção do adaptador de storage local (`publicUrl`).
 */
const listed = and(eq(specialists.status, "PUBLISHED"), eq(specialists.kind, "TEAM"));

export type PublicSpecialist = {
  slug: string;
  name: string;
  roleTitle: string | null;
  summary: string | null;
  photoMediaId: string | null;
  photoStorageKey: string | null;
};

export async function listPublishedSpecialists(executor: Executor): Promise<PublicSpecialist[]> {
  const rows = await executor
    .select({
      slug: specialists.slug,
      name: specialists.name,
      roleTitle: specialists.roleTitle,
      summary: specialists.summary,
      photoMediaId: specialists.photoMediaId,
      photoStorageKey: media.storageKey,
    })
    .from(specialists)
    .leftJoin(media, eq(media.id, specialists.photoMediaId))
    .where(listed)
    .orderBy(asc(specialists.position), asc(specialists.name));
  return rows;
}

export type SpecialistOption = {
  id: string;
  name: string;
  slug: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  kind: "TEAM" | "GUEST";
};

/** Para o seletor de autor do artigo: TODOS os especialistas, qualquer status (um artigo pode
 * ter como autor um especialista ainda não publicado; a checagem de publicação é do artigo). */
export async function listSpecialistsForAdmin(executor: Executor): Promise<SpecialistOption[]> {
  return executor
    .select({
      id: specialists.id,
      name: specialists.name,
      slug: specialists.slug,
      status: specialists.status,
      kind: specialists.kind,
    })
    .from(specialists)
    .orderBy(asc(specialists.name));
}

export async function findPublishedSpecialistBySlug(executor: Executor, slug: string) {
  const [row] = await executor
    .select({
      slug: specialists.slug,
      name: specialists.name,
      roleTitle: specialists.roleTitle,
      summary: specialists.summary,
      bio: specialists.bio,
      photoMediaId: specialists.photoMediaId,
      photoStorageKey: media.storageKey,
      seoTitle: specialists.seoTitle,
      seoDescription: specialists.seoDescription,
    })
    .from(specialists)
    .leftJoin(media, eq(media.id, specialists.photoMediaId))
    .where(and(listed, eq(specialists.slug, slug)))
    .limit(1);
  return row ?? null;
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

export type SpecialistSummaryForAdmin = {
  id: string;
  slug: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  kind: "TEAM" | "GUEST";
  updatedAt: Date;
};

export async function listSpecialistsForAdminPaged(
  executor: Executor,
  options: { page?: number } = {},
): Promise<Page<SpecialistSummaryForAdmin>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, 20);
  const [totalRow] = await executor.select({ n: count() }).from(specialists);
  const rows = await executor
    .select({
      id: specialists.id,
      slug: specialists.slug,
      name: specialists.name,
      status: specialists.status,
      kind: specialists.kind,
      updatedAt: specialists.updatedAt,
    })
    .from(specialists)
    .orderBy(desc(specialists.updatedAt), desc(specialists.id))
    .limit(pageSize)
    .offset(offset);
  return { items: rows, total: totalRow?.n ?? 0, page, pageSize };
}

export type SpecialistAssociations = { solutionIds: string[]; categoryIds: string[] };

export async function loadSpecialistAssociations(
  executor: Executor,
  specialistId: string,
): Promise<SpecialistAssociations> {
  const [solutionRows, categoryRows] = await Promise.all([
    executor
      .select({ solutionId: specialistSolutions.solutionId })
      .from(specialistSolutions)
      .where(eq(specialistSolutions.specialistId, specialistId))
      .orderBy(asc(specialistSolutions.position)),
    executor
      .select({ categoryId: specialistCategories.categoryId })
      .from(specialistCategories)
      .where(eq(specialistCategories.specialistId, specialistId)),
  ]);
  return {
    solutionIds: solutionRows.map((r) => r.solutionId),
    categoryIds: categoryRows.map((r) => r.categoryId),
  };
}

export type SpecialistForEdit = {
  specialist: typeof specialists.$inferSelect;
} & SpecialistAssociations;

/** Carrega um especialista por completo para a tela de edição (sem travar linha: não é uma
 * transação de escrita). A autorização é responsabilidade de quem chama. */
export async function findSpecialistForEdit(
  executor: Executor,
  id: string,
): Promise<SpecialistForEdit | null> {
  const [specialist] = await executor
    .select()
    .from(specialists)
    .where(eq(specialists.id, id))
    .limit(1);
  if (!specialist) return null;
  const associations = await loadSpecialistAssociations(executor, id);
  return { specialist, ...associations };
}

/** Só `posts.author_id` bloqueia de verdade (`ON DELETE RESTRICT`); as junções de solução/área
 * são `CASCADE` e não impedem a exclusão. */
export async function isSpecialistReferenced(executor: Executor, id: string): Promise<boolean> {
  const [row] = await executor
    .select({ postId: posts.id })
    .from(posts)
    .where(eq(posts.authorId, id))
    .limit(1);
  return Boolean(row);
}

/** Grava as associações (soluções em que atua, áreas de atuação): apaga tudo e reinsere. */
export async function replaceSpecialistAssociations(
  tx: Transaction,
  specialistId: string,
  input: { solutionIds: string[]; categoryIds: string[] },
): Promise<void> {
  await tx.delete(specialistSolutions).where(eq(specialistSolutions.specialistId, specialistId));
  await tx.delete(specialistCategories).where(eq(specialistCategories.specialistId, specialistId));

  const solutionIds = [...new Set(input.solutionIds)];
  const categoryIds = [...new Set(input.categoryIds)];

  if (solutionIds.length > 0) {
    await tx
      .insert(specialistSolutions)
      .values(solutionIds.map((solutionId, position) => ({ specialistId, solutionId, position })));
  }
  if (categoryIds.length > 0) {
    await tx
      .insert(specialistCategories)
      .values(categoryIds.map((categoryId) => ({ specialistId, categoryId })));
  }
}

/** Chave de storage e texto alternativo da foto (para montar a URL na tela de edição). */
export async function loadMediaInfo(
  executor: Executor,
  mediaId: string,
): Promise<{ storageKey: string; altText: string | null } | null> {
  const [row] = await executor
    .select({ storageKey: media.storageKey, altText: media.altText })
    .from(media)
    .where(eq(media.id, mediaId))
    .limit(1);
  return row ?? null;
}
