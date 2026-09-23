import "server-only";
import type { Database } from "@/db/client";
import {
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
  options: { page?: number; pageSize?: number; categorySlug?: string } = {},
): Promise<Page<PublicPostSummary>> {
  return listPublishedPosts(db, options);
}

export async function searchPublicPosts(
  { db }: { db: Database },
  query: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<Page<PublicPostSummary>> {
  return searchPublishedPosts(db, query, options);
}

export async function getPublicPostBySlug(
  { db }: { db: Database },
  slug: string,
): Promise<PublicPost | null> {
  return findPublishedPostBySlug(db, slug);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicPostsForRoute(options?: {
  page?: number;
  pageSize?: number;
  categorySlug?: string;
}) {
  "use cache";
  cacheTag(options?.categorySlug ? `posts:category:${options.categorySlug}` : "posts");
  cacheLife("days");
  return listPublicPosts({ db: getDb() }, options ?? {});
}

export async function searchPublicPostsForRoute(
  query: string,
  options?: { page?: number; pageSize?: number },
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
