import "server-only";
import { getDb } from "@/db/client";
import { findReadyMediaByStorageKey } from "../infrastructure/media-repository";

/** Usado pela rota pública `GET /media/[...key]` (docs/03, parte 21): rotas não falam com o banco. */
export async function findServableMedia(storageKey: string): Promise<{ mime: string } | null> {
  const row = await findReadyMediaByStorageKey(getDb(), storageKey);
  return row ? { mime: row.mime } : null;
}
