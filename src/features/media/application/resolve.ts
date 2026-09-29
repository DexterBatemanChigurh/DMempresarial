import "server-only";
import type { Database } from "@/db/client";
import { extractMediaIds, type MediaResolver, type RichDoc } from "@/lib/rich-text";
import { getStorage } from "@/server/storage";
import { findManyMediaByIds, findMediaById } from "../infrastructure/media-repository";

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

/** URL e texto alternativo de uma mídia avulsa, para pré-visualização em formulários de admin
 * (capa de artigo, foto do hero da home...). */
export async function getMediaPreviewForRoute(
  mediaId: string,
): Promise<{ url: string; alt: string } | null> {
  const row = await findMediaById(getDb(), mediaId);
  if (!row) return null;
  return { url: getStorage().publicUrl(row.storageKey), alt: row.altText ?? "" };
}

import { cacheLife, cacheTag } from "next/cache";

type MediaInfo = { id: string; url: string; alt: string; width: number; height: number };

/** Dados públicos das mídias, em cache (páginas públicas são pré-renderizadas). A etiqueta
 * "posts" é a mesma dos artigos: salvar um artigo (e trocar a capa) invalida junto. */
async function getPublicMediaInfo(ids: readonly string[]): Promise<MediaInfo[]> {
  "use cache";
  cacheTag("posts", "media");
  cacheLife("hours");
  if (ids.length === 0) return [];
  const rows = await findManyMediaByIds(getDb(), [...ids]);
  const storage = getStorage();
  return rows.map((row) => ({
    id: row.id,
    url: storage.publicUrl(row.storageKey),
    alt: row.altText ?? "",
    width: row.width,
    height: row.height,
  }));
}

/** Resolvedor síncrono para `<RichText>`/capas nas páginas públicas: uma consulta, em cache. */
export async function buildPublicMediaResolverForRoute(
  mediaIds: readonly (string | null | undefined)[],
): Promise<MediaResolver> {
  const ids = [...new Set(mediaIds.filter((id): id is string => typeof id === "string"))].sort();
  const byId = new Map((await getPublicMediaInfo(ids)).map((m) => [m.id, m]));
  return (mediaId) => {
    const m = byId.get(mediaId);
    return m ? { url: m.url, alt: m.alt, width: m.width, height: m.height } : null;
  };
}

/** Capas de uma lista de artigos (Home, /blog, categorias). */
export function buildCoverResolverForRoute(
  coverIds: readonly (string | null)[],
): Promise<MediaResolver> {
  return buildPublicMediaResolverForRoute(coverIds);
}
