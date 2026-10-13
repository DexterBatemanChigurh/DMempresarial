import "server-only";
import type { Database } from "@/db/client";
import {
  listCategories,
  listTags,
  type CategoryOption,
  type TagOption,
} from "@/features/taxonomy/infrastructure/taxonomy-repository";

/** As opções dos seletores do formulário de artigo, carregadas de uma vez. */
export type PostFormOptions = {
  categories: CategoryOption[];
  tags: TagOption[];
};

export async function loadPostFormOptions(db: Database): Promise<PostFormOptions> {
  const [categories, tags] = await Promise.all([listCategories(db), listTags(db)]);
  return { categories, tags };
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function loadPostFormOptionsForRoute(): Promise<PostFormOptions> {
  return loadPostFormOptions(getDb());
}
