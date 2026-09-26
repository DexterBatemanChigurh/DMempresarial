import "server-only";
import { getDb } from "@/db/client";
import { getStorage } from "@/server/storage";
import { findReadyMediaByStorageKey } from "../infrastructure/media-repository";

/**
 * Usado pela rota pública `GET /media/[...key]` (docs/03, parte 21): rotas não falam com o banco
 * nem com o storage. Só entrega arquivo que exista em `media` com `status = READY`.
 */
export async function readServableMedia(
  storageKey: string,
): Promise<{ mime: string; bytes: Buffer } | null> {
  const row = await findReadyMediaByStorageKey(getDb(), storageKey);
  if (!row) return null;
  try {
    return { mime: row.mime, bytes: await getStorage().read(storageKey) };
  } catch {
    // Linha existe mas o arquivo não (storage trocado, remoção manual): some da resposta como 404.
    return null;
  }
}
