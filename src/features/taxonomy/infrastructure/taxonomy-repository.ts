import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import { categories, postCategories, postTags, posts, tags } from "@/db/schema";

/**
 * Leitura administrativa de categorias e tags: sem filtro de status (elas não têm um — são
 * sempre visíveis), usada para os seletores do formulário de artigo.
 */
export type CategoryOption = { id: string; slug: string; name: string };
export type TagOption = { id: string; slug: string; name: string };

/**
 * Leitura pública de categorias: ordenadas por posição, com contagem de artigos publicados.
 * Usada no índice do blog e na sidebar de categorias.
 */
export type PublicCategory = {
  id: string;
  slug: string;
  name: string;
  postCount: number;
};

export async function listPublishedCategories(executor: Executor): Promise<PublicCategory[]> {
  const rows = await executor
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
    })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));

  const postCounts = await executor
    .select({ categoryId: postCategories.categoryId, n: count() })
    .from(postCategories)
    .innerJoin(posts, eq(posts.id, postCategories.postId))
    .where(eq(posts.status, "PUBLISHED"))
    .groupBy(postCategories.categoryId);
  const countById = new Map(postCounts.map((r) => [r.categoryId, r.n]));

  return rows.map((row) => ({
    ...row,
    postCount: countById.get(row.id) ?? 0,
  }));
}

export async function listCategories(executor: Executor): Promise<CategoryOption[]> {
  return executor
    .select({ id: categories.id, slug: categories.slug, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));
}

export async function listTags(executor: Executor): Promise<TagOption[]> {
  return executor
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name));
}

// ---------------------------------------------------------------------------------------------
// Tela `/admin/categorias`: cada linha com quantos artigos/especialistas a usam, para a UI
// decidir se mostra "excluir" ou só "mesclar" (docs/03, parte 7.3: bloqueada se em uso).
// ---------------------------------------------------------------------------------------------

export type CategoryForAdmin = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  postCount: number;
};

export async function listCategoriesForAdmin(executor: Executor): Promise<CategoryForAdmin[]> {
  const rows = await executor
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      description: categories.description,
      position: categories.position,
    })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.name));

  const postCounts = await executor
    .select({ categoryId: postCategories.categoryId, n: count() })
    .from(postCategories)
    .groupBy(postCategories.categoryId);
  const postCountById = new Map(postCounts.map((r) => [r.categoryId, r.n]));

  return rows.map((row) => ({ ...row, postCount: postCountById.get(row.id) ?? 0 }));
}

export async function isCategoryReferenced(executor: Executor, id: string): Promise<boolean> {
  const [inPost] = await executor
    .select({ postId: postCategories.postId })
    .from(postCategories)
    .where(eq(postCategories.categoryId, id))
    .limit(1);
  return Boolean(inPost);
}

export type TagForAdmin = { id: string; slug: string; name: string; postCount: number };

export async function listTagsForAdmin(executor: Executor): Promise<TagForAdmin[]> {
  const rows = await executor
    .select({ id: tags.id, slug: tags.slug, name: tags.name })
    .from(tags)
    .orderBy(asc(tags.name));
  const counts = await executor
    .select({ tagId: postTags.tagId, n: count() })
    .from(postTags)
    .groupBy(postTags.tagId);
  const countById = new Map(counts.map((r) => [r.tagId, r.n]));
  return rows.map((row) => ({ ...row, postCount: countById.get(row.id) ?? 0 }));
}

export async function isTagReferenced(executor: Executor, id: string): Promise<boolean> {
  const [row] = await executor
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, id))
    .limit(1);
  return Boolean(row);
}

/**
 * Move todo uso de `fromId` para `toId` e apaga `fromId` (docs/03, parte 7.3: "mesclar move
 * artigos e apaga a vazia"). Escala pequena (categorias/tags não são criadas em massa): resolve
 * artigo por artigo em vez de um único UPDATE em lote, para nunca violar o índice único parcial
 * de categoria principal (no máximo uma por artigo) mesmo momentaneamente.
 */
export async function mergeCategories(
  tx: Transaction,
  fromId: string,
  toId: string,
): Promise<void> {
  const fromRows = await tx
    .select({ postId: postCategories.postId, isPrimary: postCategories.isPrimary })
    .from(postCategories)
    .where(eq(postCategories.categoryId, fromId));

  for (const row of fromRows) {
    const [existingTo] = await tx
      .select({ isPrimary: postCategories.isPrimary })
      .from(postCategories)
      .where(and(eq(postCategories.postId, row.postId), eq(postCategories.categoryId, toId)));

    if (!existingTo) {
      await tx
        .update(postCategories)
        .set({ categoryId: toId })
        .where(and(eq(postCategories.postId, row.postId), eq(postCategories.categoryId, fromId)));
      continue;
    }
    if (row.isPrimary && !existingTo.isPrimary) {
      // Zera a origem antes de marcar o destino: nunca duas linhas "principal" ao mesmo tempo
      // (o índice único parcial `post_categories_one_primary_uq` é verificado por instrução).
      await tx
        .update(postCategories)
        .set({ isPrimary: false })
        .where(and(eq(postCategories.postId, row.postId), eq(postCategories.categoryId, fromId)));
      await tx
        .update(postCategories)
        .set({ isPrimary: true })
        .where(and(eq(postCategories.postId, row.postId), eq(postCategories.categoryId, toId)));
    }
    await tx
      .delete(postCategories)
      .where(and(eq(postCategories.postId, row.postId), eq(postCategories.categoryId, fromId)));
  }

  await tx.delete(categories).where(eq(categories.id, fromId));
}

/** Mesma ideia que `mergeCategories`, mas para tags (sem conceito de "principal"). */
export async function mergeTags(tx: Transaction, fromId: string, toId: string): Promise<void> {
  const fromRows = await tx
    .select({ postId: postTags.postId })
    .from(postTags)
    .where(eq(postTags.tagId, fromId));
  for (const row of fromRows) {
    const [existingTo] = await tx
      .select({ postId: postTags.postId })
      .from(postTags)
      .where(and(eq(postTags.postId, row.postId), eq(postTags.tagId, toId)));
    if (!existingTo) {
      await tx
        .update(postTags)
        .set({ tagId: toId })
        .where(and(eq(postTags.postId, row.postId), eq(postTags.tagId, fromId)));
    } else {
      await tx
        .delete(postTags)
        .where(and(eq(postTags.postId, row.postId), eq(postTags.tagId, fromId)));
    }
  }
  await tx.delete(tags).where(eq(tags.id, fromId));
}
