import "server-only";
import type { Database } from "@/db/client";
import { findPublishedPageByKey, type PublicPage } from "../infrastructure/page-repository";

/** Leitura pública de página institucional: só `PUBLISHED`, sem sessão. */
export async function getPublishedPage(
  { db }: { db: Database },
  key: string,
): Promise<PublicPage | null> {
  return findPublishedPageByKey(db, key);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function getPublishedPageForRoute(key: string) {
  "use cache";
  cacheTag(`page:${key}`, "pages");
  cacheLife("days");
  return getPublishedPage({ db: getDb() }, key);
}
