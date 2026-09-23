import "server-only";
import type { Database } from "@/db/client";
import { findRedirect, type RedirectTarget } from "../infrastructure/redirects";

/** Leitura pública: resolve um caminho antigo para o novo, se existir (docs/03, parte 20). */
export async function getRedirect(
  { db }: { db: Database },
  path: string,
): Promise<RedirectTarget | null> {
  return findRedirect(db, path);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const getRedirectForRoute = (path: string) => getRedirect({ db: getDb() }, path);
