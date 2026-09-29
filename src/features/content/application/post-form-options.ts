import "server-only";
import type { Database } from "@/db/client";
import { SPECIALISTS } from "@/content/dm";
import {
  listCategories,
  listTags,
  type CategoryOption,
  type TagOption,
} from "@/features/taxonomy/infrastructure/taxonomy-repository";

/** As opções dos seletores do formulário de artigo, carregadas de uma vez. Autores vêm da lista
 * fixa de especialistas (src/content/dm.ts). */
export type PostFormOptions = {
  authors: { slug: string; name: string }[];
  categories: CategoryOption[];
  tags: TagOption[];
};

export async function loadPostFormOptions(db: Database): Promise<PostFormOptions> {
  const [categories, tags] = await Promise.all([listCategories(db), listTags(db)]);
  return { authors: SPECIALISTS.map(({ slug, name }) => ({ slug, name })), categories, tags };
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function loadPostFormOptionsForRoute(): Promise<PostFormOptions> {
  return loadPostFormOptions(getDb());
}
