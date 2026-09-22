"use server";

import { listMediaForRoute } from "@/features/media/application/manage-media";
import { requireAdminSession } from "@/server/auth/admin-guard";

export type MediaThumbnail = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
};

/** Para o seletor de imagem do editor: lista compacta, sem paginação avançada (poucas por vez). */
export async function listMediaThumbnailsAction(page = 1): Promise<MediaThumbnail[]> {
  const { actor } = await requireAdminSession();
  const { items } = await listMediaForRoute(actor, page);
  return items.map((row) => ({
    id: row.id,
    url: `/media/${row.storageKey}`,
    alt: row.altText ?? "",
    width: row.width,
    height: row.height,
  }));
}
