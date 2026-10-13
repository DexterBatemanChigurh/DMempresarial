"use server";

import { buildMediaResolverForRoute } from "@/features/media/application/resolve";
import type { RichDoc } from "@/lib/rich-text";
import { env } from "@/server/env";

/**
 * Só para a página de demonstração: resolve as imagens de um documento em um mapa serializável.
 * Server Actions são endpoints públicos (anônimos) mesmo quando a página que as usa responde 404:
 * esta só responde em development/test. Em staging e production não faz nada — staging usa dados
 * reais de mídia e não deve expô-los a quem chama a action sem sessão.
 */
export async function resolveMediaMapAction(
  doc: RichDoc,
): Promise<Record<string, { url: string; alt: string; width: number; height: number }>> {
  const appEnv = env().APP_ENV;
  if (appEnv !== "development" && appEnv !== "test") return {};
  const resolver = await buildMediaResolverForRoute(doc);
  const { extractMediaIds } = await import("@/lib/rich-text");
  const map: Record<string, { url: string; alt: string; width: number; height: number }> = {};
  for (const id of extractMediaIds(doc)) {
    const resolved = resolver(id);
    if (resolved) map[id] = resolved;
  }
  return map;
}
