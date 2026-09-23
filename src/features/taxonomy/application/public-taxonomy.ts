import "server-only";
import type { Database } from "@/db/client";
import {
  listPublishedCategories,
  listCategories,
  listTags,
  type CategoryOption,
  type TagOption,
} from "../infrastructure/taxonomy-repository";

/** Leituras públicas de taxonomia: categorias e tags visíveis no site. */
export async function listPublicCategories({
  db,
}: {
  db: Database;
}): Promise<(CategoryOption & { postCount: number })[]> {
  return listPublishedCategories(db);
}

export async function listPublicCategoriesForSelect({
  db,
}: {
  db: Database;
}): Promise<CategoryOption[]> {
  return listCategories(db);
}

export async function listPublicTagsForSelect({ db }: { db: Database }): Promise<TagOption[]> {
  return listTags(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicCategoriesForRoute() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");
  return listPublicCategories({ db: getDb() });
}

export async function listPublicCategoriesForSelectForRoute() {
  "use cache";
  cacheTag("categories");
  cacheLife("days");
  return listPublicCategoriesForSelect({ db: getDb() });
}

export async function listPublicTagsForSelectForRoute() {
  "use cache";
  cacheTag("tags");
  cacheLife("days");
  return listPublicTagsForSelect({ db: getDb() });
}
