import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import { media, postCategories, posts, specialists } from "@/db/schema";

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
};

export type PublicPost = PublicPostSummary & {
  body: unknown;
  seoTitle: string | null;
  seoDescription: string | null;
  updatedAt: Date;
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
};

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
    })
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .where(and(isPublished, eq(posts.slug, slug)))
    .limit(1);
  return row
    ? {
        ...toSummary(row),
        body: row.body,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        updatedAt: row.updatedAt,
      }
    : null;
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

/** Tamanho de página com teto: parâmetro do cliente nunca decide quanto é lido do banco. */
function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 50) : 12;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export async function listPublishedPosts(
  executor: Executor,
  options: { page?: number; pageSize?: number } = {},
): Promise<Page<PublicPostSummary>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, options.pageSize ?? 12);
  const [totalRow] = await executor.select({ n: count() }).from(posts).where(isPublished);
  const rows = await executor
    .select(summaryColumns)
    .from(posts)
    .innerJoin(specialists, eq(specialists.id, posts.authorId))
    .where(isPublished)
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
