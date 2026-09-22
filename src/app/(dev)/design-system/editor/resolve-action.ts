"use server";

import { buildMediaResolverForRoute } from "@/features/media/application/resolve";
import type { RichDoc } from "@/lib/rich-text";

/** Só para a página de demonstração: resolve as imagens de um documento em um mapa serializável. */
export async function resolveMediaMapAction(
  doc: RichDoc,
): Promise<Record<string, { url: string; alt: string; width: number; height: number }>> {
  const resolver = await buildMediaResolverForRoute(doc);
  const { extractMediaIds } = await import("@/lib/rich-text");
  const map: Record<string, { url: string; alt: string; width: number; height: number }> = {};
  for (const id of extractMediaIds(doc)) {
    const resolved = resolver(id);
    if (resolved) map[id] = resolved;
  }
  return map;
}
