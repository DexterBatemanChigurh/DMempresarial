import "server-only";
import type { Database } from "@/db/client";
import {
  listSpecialistsForAdmin,
  type SpecialistOption,
} from "@/features/people/infrastructure/specialist-repository";
import {
  listSolutionsForAdmin,
  type SolutionOption,
} from "@/features/catalog/infrastructure/solution-repository";
import {
  listCategories,
  listTags,
  type CategoryOption,
  type TagOption,
} from "@/features/taxonomy/infrastructure/taxonomy-repository";

/** As opções dos seletores do formulário de artigo, carregadas de uma vez. */
export type PostFormOptions = {
  specialists: SpecialistOption[];
  categories: CategoryOption[];
  tags: TagOption[];
  solutions: SolutionOption[];
};

export async function loadPostFormOptions(db: Database): Promise<PostFormOptions> {
  const [specialists, categories, tags, solutions] = await Promise.all([
    listSpecialistsForAdmin(db),
    listCategories(db),
    listTags(db),
    listSolutionsForAdmin(db),
  ]);
  return { specialists, categories, tags, solutions };
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function loadPostFormOptionsForRoute(): Promise<PostFormOptions> {
  return loadPostFormOptions(getDb());
}
