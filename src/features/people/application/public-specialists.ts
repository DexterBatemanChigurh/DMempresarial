import "server-only";
import type { Database } from "@/db/client";
import {
  findPublishedSpecialistBySlug,
  listPublishedSpecialists,
} from "../infrastructure/specialist-repository";

/** Leitura pública de especialistas: só `PUBLISHED` e da equipe (`TEAM`), sem sessão. */
export async function listPublicSpecialists({ db }: { db: Database }) {
  return listPublishedSpecialists(db);
}

export async function getPublicSpecialistBySlug({ db }: { db: Database }, slug: string) {
  return findPublishedSpecialistBySlug(db, slug);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicSpecialistsForRoute() {
  "use cache";
  cacheTag("specialists");
  cacheLife("days");
  return listPublicSpecialists({ db: getDb() });
}

export async function getPublicSpecialistBySlugForRoute(slug: string) {
  "use cache";
  cacheTag(`specialist:${slug}`, "specialists");
  cacheLife("days");
  return getPublicSpecialistBySlug({ db: getDb() }, slug);
}
