import "server-only";
import type { Database } from "@/db/client";
import { listPublishedDepoimentos, type Depoimento } from "../infrastructure/proof-repository";

/** Leitura pública de depoimentos: só `visivel: true`, sem sessão. */
export async function listPublicDepoimentos({ db }: { db: Database }): Promise<Depoimento[]> {
  return listPublishedDepoimentos(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export async function listPublicDepoimentosForRoute() {
  "use cache";
  cacheTag("depoimentos");
  cacheLife("days");
  return listPublicDepoimentos({ db: getDb() });
}
