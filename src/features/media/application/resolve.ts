import "server-only";
import type { Database } from "@/db/client";
import { extractMediaIds, type MediaResolver, type RichDoc } from "@/lib/rich-text";
import { getStorage } from "@/server/storage";
import { findManyMediaByIds } from "../infrastructure/media-repository";

/**
 * `<RichText resolveMedia>` exige uma função SÍNCRONA (a renderização em si não pode esperar por
 * consulta ao banco por imagem). Por isso o resolvedor pré-carrega, numa única consulta, todas as
 * mídias referenciadas no documento e devolve um fechamento síncrono sobre o resultado.
 */
export async function buildMediaResolver(db: Database, doc: RichDoc): Promise<MediaResolver> {
  const ids = extractMediaIds(doc);
  const rows = ids.length > 0 ? await findManyMediaByIds(db, ids) : [];
  const storage = getStorage();
  const byId = new Map(rows.map((row) => [row.id, row]));

  return (mediaId) => {
    const row = byId.get(mediaId);
    if (!row) return null;
    return {
      url: storage.publicUrl(row.storageKey),
      alt: row.altText ?? "",
      width: row.width,
      height: row.height,
    };
  };
}

// Wrapper para páginas de `src/app/**` (ver nota em upload-media.ts).
import { getDb } from "@/db/client";

export function buildMediaResolverForRoute(doc: RichDoc): Promise<MediaResolver> {
  return buildMediaResolver(getDb(), doc);
}
