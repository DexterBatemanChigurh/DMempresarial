import "server-only";
import type { Database } from "@/db/client";
import { can, type Actor, type PostStatus } from "@/server/permissions";
import {
  findPostBySlugForPreview,
  findPublishedPostBySlug,
  listPublishedPosts,
  searchPublishedPosts,
  type Page,
  type PublicPost,
  type PublicPostSummary,
} from "../infrastructure/post-repository";

/** Leituras públicas de artigos: só `PUBLISHED`, sem sessão. */
export async function listPublicPosts(
  { db }: { db: Database },
  options: { page?: number; pageSize?: number; categorySlug?: string; featuredOnly?: boolean } = {},
): Promise<Page<PublicPostSummary>> {
  return listPublishedPosts(db, options);
}

export async function searchPublicPosts(
  { db }: { db: Database },
  query: string,
  options: { page?: number; pageSize?: number; categorySlug?: string } = {},
): Promise<Page<PublicPostSummary>> {
  return searchPublishedPosts(db, query, options);
}

export async function getPublicPostBySlug(
  { db }: { db: Database },
  slug: string,
): Promise<PublicPost | null> {
  return findPublishedPostBySlug(db, slug);
}

/**
 * Artigo em qualquer estado (preview/Draft Mode), SÓ para quem pode editá-lo — a mesma regra de
 * `/api/preview`. O cookie do Draft Mode vale para o site inteiro: sem esta checagem, quem ativou
 * o preview de um rascunho próprio veria o rascunho de qualquer outra pessoa pelo slug.
 * Sem permissão (ou sem sessão) devolve `null`, sem revelar que o rascunho existe.
 */
export async function getPostBySlugForPreview(
  { db }: { db: Database },
  actor: Actor | null,
  slug: string,
): Promise<PublicPost | null> {
  if (!actor) return null;
  const post = await findPostBySlugForPreview(db, slug);
  if (!post) return null;
  const allowed = can(actor, "post:edit", {
    ownerId: post.createdBy,
    status: post.status as PostStatus,
  });
  if (!allowed) return null;
  const { createdBy: _createdBy, ...publicPost } = post;
  return publicPost;
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";
import { getActor } from "@/server/auth/session";

export async function listPublicPostsForRoute(options?: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
  featuredOnly?: boolean;
}) {
  "use cache";
  cacheTag("posts", ...(options?.categorySlug ? [`posts:category:${options.categorySlug}`] : []));
  cacheLife("days");
  return listPublicPosts({ db: getDb() }, options ?? {});
}

export async function searchPublicPostsForRoute(
  query: string,
  options?: { page?: number; pageSize?: number; categorySlug?: string },
) {
  "use cache";
  cacheTag("posts");
  cacheLife("minutes");
  return searchPublicPosts({ db: getDb() }, query, options ?? {});
}

export async function getPublicPostBySlugForRoute(slug: string) {
  "use cache";
  cacheTag(`post:${slug}`, "posts");
  cacheLife("days");
  return getPublicPostBySlug({ db: getDb() }, slug);
}

/**
 * Preview (Draft Mode ativo) — sem cache, direto no banco, com a sessão do request.
 * `null` quando o ator não pode editar o artigo: a página então cai na versão pública.
 */
export async function getPostBySlugForPreviewRoute(slug: string) {
  return getPostBySlugForPreview({ db: getDb() }, await getActor(), slug);
}
