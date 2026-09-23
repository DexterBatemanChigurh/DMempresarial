import "server-only";
import type { Database } from "@/db/client";
import {
  findPublishedSolutionBySlug,
  listPublishedSolutions,
  type PublicSolutionSummary,
} from "../infrastructure/solution-repository";

/** Leituras públicas de soluções: só `PUBLISHED`, sem sessão. */
export async function listPublicSolutions({
  db,
}: {
  db: Database;
}): Promise<PublicSolutionSummary[]> {
  return listPublishedSolutions(db);
}

export async function getPublicSolutionBySlug({ db }: { db: Database }, slug: string) {
  return findPublishedSolutionBySlug(db, slug);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicSolutionsForRoute() {
  "use cache";
  cacheTag("solutions");
  cacheLife("days");
  return listPublicSolutions({ db: getDb() });
}

export async function getPublicSolutionBySlugForRoute(slug: string) {
  "use cache";
  cacheTag(`solution:${slug}`, "solutions");
  cacheLife("days");
  return getPublicSolutionBySlug({ db: getDb() }, slug);
}
