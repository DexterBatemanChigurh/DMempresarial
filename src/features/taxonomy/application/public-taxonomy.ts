import "server-only";
import type { Database } from "@/db/client";
import {
  listPublishedCategories,
  type CategoryOption,
} from "../infrastructure/taxonomy-repository";

/** Leituras públicas de taxonomia: categorias visíveis no site. (Os seletores do formulário de
 * artigo usam `loadPostFormOptions`, em content/application/post-form-options.ts.) */
export async function listPublicCategories({
  db,
}: {
  db: Database;
}): Promise<(CategoryOption & { postCount: number })[]> {
  return listPublishedCategories(db);
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
