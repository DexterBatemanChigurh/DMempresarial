import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import {
  categories,
  postCategories,
  postSolutions,
  postTags,
  media,
  posts,
  specialists,
} from "@/db/schema";
import type { PostStatus } from "../domain/post-status";

/** Artigo carregado para uma transição de estado, já com o que as regras de publicação exigem. */
export type PostForTransition = {
  post: typeof posts.$inferSelect;
  primaryCategoryId: string | null;
  coverAltText: string | null;
};

/** Carrega o artigo TRAVANDO a linha (FOR UPDATE): duas transições simultâneas são serializadas. */
export async function loadPostForTransition(
  tx: Transaction,
  id: string,
): Promise<PostForTransition | null> {
  const [post] = await tx.select().from(posts).where(eq(posts.id, id)).limit(1).for("update");
  if (!post) return null;

  const [primary] = await tx
    .select({ categoryId: postCategories.categoryId })
    .from(postCategories)
    .where(and(eq(postCategories.postId, id), eq(postCategories.isPrimary, true)))
    .limit(1);

  let coverAltText: string | null = null;
  if (post.coverMediaId) {
    const [cover] = await tx
      .select({ altText: media.altText })
      .from(media)
      .where(eq(media.id, post.coverMediaId))
      .limit(1);
    coverAltText = cover?.altText ?? null;
  }
  return { post, primaryCategoryId: primary?.categoryId ?? null, coverAltText };
}

/**
 * IDs de artigos agendados vencidos, já travados (`FOR UPDATE SKIP LOCKED`): uma execução
 * concorrente do cron simplesmente pula linhas que outra já está processando, em vez de esperar
 * ou duplicar a publicação (docs/03, incremento 5).
 */
export async function findDueScheduledPostIds(
  tx: Transaction,
  now: Date,
  limit = 100,
): Promise<string[]> {
  const rows = await tx
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.status, "SCHEDULED"), sql`${posts.scheduledFor} <= ${now}`))
    .orderBy(posts.scheduledFor)
    .limit(limit)
    .for("update", { skipLocked: true });
  return rows.map((r) => r.id);
}

// ---------------------------------------------------------------------------------------------
// Leitura ADMINISTRATIVA: qualquer status, colunas internas incluídas. Sempre atrás de
// `requireAdminSession` + `assertCan` na camada `application` — nada aqui decide permissão.
// ---------------------------------------------------------------------------------------------

/** Chave de storage e texto alternativo da mídia de capa (para montar a URL e a pré-visualização
 * no formulário de edição). */
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

export type PostAssociations = {
  categoryIds: string[];
  primaryCategoryId: string | null;
  tagIds: string[];
  solutionIds: string[];
  primarySolutionId: string | null;
};

export async function loadPostAssociations(
  executor: Executor,
  postId: string,
): Promise<PostAssociations> {
  const [categoryRows, tagRows, solutionRows] = await Promise.all([
    executor
      .select({ categoryId: postCategories.categoryId, isPrimary: postCategories.isPrimary })
      .from(postCategories)
      .where(eq(postCategories.postId, postId)),
    executor.select({ tagId: postTags.tagId }).from(postTags).where(eq(postTags.postId, postId)),
    executor
      .select({ solutionId: postSolutions.solutionId, isPrimary: postSolutions.isPrimary })
      .from(postSolutions)
      .where(eq(postSolutions.postId, postId)),
  ]);
  return {
    categoryIds: categoryRows.map((r) => r.categoryId),
    primaryCategoryId: categoryRows.find((r) => r.isPrimary)?.categoryId ?? null,
    tagIds: tagRows.map((r) => r.tagId),
    solutionIds: solutionRows.map((r) => r.solutionId),
    primarySolutionId: solutionRows.find((r) => r.isPrimary)?.solutionId ?? null,
  };
}

export type PostForEdit = { post: typeof posts.$inferSelect } & PostAssociations;

/** Carrega um artigo por completo para a tela de edição (sem travar linha: não é uma transação
 * de escrita). A autorização (dono/status) é responsabilidade de quem chama. */
export async function findPostForEdit(executor: Executor, id: string): Promise<PostForEdit | null> {
  const [post] = await executor.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) return null;
  const associations = await loadPostAssociations(executor, id);
  return { post, ...associations };
}

export type PostSummaryForAdmin = {
  id: string;
  slug: string;
  title: string;
  status: PostStatus;
  authorName: string;
  updatedAt: Date;
  version: number;
};

/** Lista para a tela `/admin/artigos`. `ownerId` restringe a AUTHOR aos próprios artigos. */
export async function listPostsForAdmin(
  executor: Executor,
  options: { page?: number; pageSize?: number; ownerId?: string; status?: PostStatus } = {},
): Promise<Page<PostSummaryForAdmin>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, options.pageSize ?? 20);
  const filters = [
    options.ownerId ? eq(posts.createdBy, options.ownerId) : undefined,
    options.status ? eq(posts.status, options.status) : undefined,
  ].filter((f) => f !== undefined);
  const where = filters.length > 0 ? and(...filters) : undefined;

  const [totalRow] = await executor.select({ n: count() }).from(posts).where(where);
  const rows = await executor
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      status: posts.status,
      authorName: specialists.name,
      updatedAt: posts.updatedAt,
      version: posts.version,
    })
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .where(where)
    .orderBy(desc(posts.updatedAt), desc(posts.id))
    .limit(pageSize)
    .offset(offset);
  return { items: rows, total: totalRow?.n ?? 0, page, pageSize };
}

// ---------------------------------------------------------------------------------------------
// Leitura PÚBLICA. Toda consulta abaixo filtra `status = 'PUBLISHED'` NA PRÓPRIA CONSULTA: um
// rascunho, artigo em revisão, agendado ou arquivado nunca sai daqui, nem por slug direto.
// Os DTOs trazem só colunas públicas (sem body_text, search_vector, criadores, versão).
// ---------------------------------------------------------------------------------------------

export type PublicPostSummary = {
  slug: string;
  title: string;
  subtitle: string | null;
  excerpt: string | null;
  publishedAt: Date;
  readingMinutes: number;
  authorName: string;
  primaryCategorySlug: string | null;
};

export type PublicPost = PublicPostSummary & {
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
  coverMediaId: string | null;
  primaryCategorySlug: string | null;
};

const isPublished = eq(posts.status, "PUBLISHED");

const summaryColumns = {
  slug: posts.slug,
  title: posts.title,
  subtitle: posts.subtitle,
  excerpt: posts.excerpt,
  publishedAt: posts.publishedAt,
  readingMinutes: posts.readingMinutes,
  authorName: specialists.name,
  primaryCategorySlug: categories.slug,
};

/** `where` para a categoria PRIMÁRIA, junto ao mesmo par de `leftJoin` usado nas consultas
 * abaixo (`postCategories`→`categories`, filtrando `is_primary`). */
const primaryCategoryJoin = and(
  eq(postCategories.postId, posts.id),
  eq(postCategories.isPrimary, true),
);

type SummaryRow = Omit<PublicPostSummary, "publishedAt"> & { publishedAt: Date | null };

function toSummary(row: SummaryRow): PublicPostSummary {
  // `published_at` é obrigatório em PUBLISHED (CHECK no banco); o fallback nunca deveria ocorrer.
  return { ...row, publishedAt: row.publishedAt ?? new Date(0) };
}

export async function findPublishedPostBySlug(
  executor: Executor,
  slug: string,
): Promise<PublicPost | null> {
  const [row] = await executor
    .select({
      ...summaryColumns,
      body: posts.body,
      seoTitle: posts.seoTitle,
      seoDescription: posts.seoDescription,
      updatedAt: posts.updatedAt,
      coverMediaId: posts.coverMediaId,
      primaryCategorySlug: categories.slug,
    })
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .leftJoin(
      postCategories,
      and(eq(postCategories.postId, posts.id), eq(postCategories.isPrimary, true)),
    )
    .leftJoin(categories, eq(categories.id, postCategories.categoryId))
    .where(and(isPublished, eq(posts.slug, slug)))
    .limit(1);
  return row
    ? {
        ...toSummary(row),
        body: row.body,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        updatedAt: row.updatedAt,
        coverMediaId: row.coverMediaId,
        primaryCategorySlug: row.primaryCategorySlug,
      }
    : null;
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

/** Tamanho de página com teto: parâmetro do cliente nunca decide quanto é lido do banco. */
export function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 50) : 12;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export async function listPublishedPosts(
  executor: Executor,
  options: { page?: number; pageSize?: number; categorySlug?: string } = {},
): Promise<Page<PublicPostSummary>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, options.pageSize ?? 12);
  // Filtra pela categoria PRIMÁRIA (mesma que a consulta expõe como `primaryCategorySlug`):
  // uma página de categoria não deveria misturar posts em que ela é só secundária.
  const where = options.categorySlug
    ? and(isPublished, eq(categories.slug, options.categorySlug))
    : isPublished;

  const [totalRow] = await executor
    .select({ n: count() })
    .from(posts)
    .leftJoin(postCategories, primaryCategoryJoin)
    .leftJoin(categories, eq(categories.id, postCategories.categoryId))
    .where(where);
  const rows = await executor
    .select(summaryColumns)
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .leftJoin(postCategories, primaryCategoryJoin)
    .leftJoin(categories, eq(categories.id, postCategories.categoryId))
    .where(where)
    // Ordem estável: sem o desempate por id, itens com a mesma data se repetem ou somem entre páginas.
    .orderBy(desc(posts.publishedAt), desc(posts.id))
    .limit(pageSize)
    .offset(offset);
  return { items: rows.map(toSummary), total: totalRow?.n ?? 0, page, pageSize };
}

/** Busca de texto (sem acento, em português). Só artigos publicados. */
export async function searchPublishedPosts(
  executor: Executor,
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<Page<PublicPostSummary>> {
  const term = query.trim().slice(0, 100);
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, options.pageSize ?? 12);
  if (term === "") return { items: [], total: 0, page, pageSize };

  const tsquery = sql`websearch_to_tsquery('portuguese', public.f_unaccent(${term}))`;
  const matches = and(isPublished, sql`${posts.searchVector} @@ ${tsquery}`);
  const [totalRow] = await executor.select({ n: count() }).from(posts).where(matches);
  const rows = await executor
    .select(summaryColumns)
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .leftJoin(postCategories, primaryCategoryJoin)
    .leftJoin(categories, eq(categories.id, postCategories.categoryId))
    .where(matches)
    .orderBy(
      sql`ts_rank_cd(${posts.searchVector}, ${tsquery}) DESC`,
      desc(posts.publishedAt),
      desc(posts.id),
    )
    .limit(pageSize)
    .offset(offset);
  return { items: rows.map(toSummary), total: totalRow?.n ?? 0, page, pageSize };
}

/** Slugs e datas dos artigos públicos (sitemap). */
export async function listPublishedPostSlugs(
  executor: Executor,
): Promise<{ slug: string; updatedAt: Date }[]> {
  return executor
    .select({ slug: posts.slug, updatedAt: posts.updatedAt })
    .from(posts)
    .where(isPublished)
    .orderBy(desc(posts.publishedAt));
}
