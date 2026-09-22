import "server-only";
import type { Database } from "@/db/client";
import {
  listSolutionsForAdmin,
  type SolutionOption,
} from "@/features/catalog/infrastructure/solution-repository";
import {
  listCategories,
  type CategoryOption,
} from "@/features/taxonomy/infrastructure/taxonomy-repository";

/** As opções dos seletores do formulário de especialista (soluções em que atua, áreas de
 * atuação), carregadas de uma vez. */
export type SpecialistFormOptions = { solutions: SolutionOption[]; categories: CategoryOption[] };

export async function loadSpecialistFormOptions(db: Database): Promise<SpecialistFormOptions> {
  const [solutions, categories] = await Promise.all([
    listSolutionsForAdmin(db),
    listCategories(db),
  ]);
  return { solutions, categories };
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function loadSpecialistFormOptionsForRoute(): Promise<SpecialistFormOptions> {
  return loadSpecialistFormOptions(getDb());
}
