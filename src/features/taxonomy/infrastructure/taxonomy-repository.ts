import "server-only";
import { asc } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { categories, tags } from "@/db/schema";

/**
 * Leitura administrativa de categorias e tags: sem filtro de status (elas não têm um — são
 * sempre visíveis), usada para os seletores do formulário de artigo.
 */
export type CategoryOption = { id: string; slug: string; name: string };
export type TagOption = { id: string; slug: string; name: string };

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
