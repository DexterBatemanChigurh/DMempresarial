import "server-only";
import { and, count, desc, eq, inArray, sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { media, pages, posts, solutions, specialists } from "@/db/schema";

/**
 * Acesso à tabela `media`. Nada aqui decide permissão (isso é da camada `application`, que
 * carrega o registro e chama `assertCan`). `ownerId` no resultado é `uploadedBy` — o mesmo campo
 * que `can()` usa para a regra de propriedade do AUTHOR.
 */
export type MediaRow = typeof media.$inferSelect;

export async function insertMedia(
  executor: Executor,
  input: {
    storageKey: string;
    mime: string;
    bytes: number;
    width: number;
    height: number;
    sha256: string;
    altText: string | null;
    caption: string | null;
    uploadedBy: string;
  },
): Promise<MediaRow> {
  const [row] = await executor
    .insert(media)
    .values({ ...input, status: "READY" })
    .returning();
  if (!row) throw new Error("Falha ao gravar a mídia.");
  return row;
}

export async function findMediaById(executor: Executor, id: string): Promise<MediaRow | null> {
  const [row] = await executor.select().from(media).where(eq(media.id, id)).limit(1);
  return row ?? null;
}

/** Usada só pela rota pública que serve o binário: exige `status = READY`. */
export async function findReadyMediaByStorageKey(
  executor: Executor,
  storageKey: string,
): Promise<MediaRow | null> {
  const [row] = await executor
    .select()
    .from(media)
    .where(and(eq(media.storageKey, storageKey), eq(media.status, "READY")))
    .limit(1);
  return row ?? null;
}

/** Carrega várias mídias PRONTAS de uma vez (usado para resolver imagens de um documento). */
export async function findManyMediaByIds(
  executor: Executor,
  ids: readonly string[],
): Promise<MediaRow[]> {
  if (ids.length === 0) return [];
  return executor
    .select()
    .from(media)
    .where(and(inArray(media.id, ids as string[]), eq(media.status, "READY")));
}

export type MediaListPage = {
  items: MediaRow[];
  total: number;
  page: number;
  pageSize: number;
};

function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 60) : 24;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

/** Lista para a biblioteca de mídia do painel. `ownerId` restringe a AUTHOR à própria mídia. */
export async function listMedia(
  executor: Executor,
  options: { page?: number; pageSize?: number; ownerId?: string } = {},
): Promise<MediaListPage> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, options.pageSize ?? 24);
  const where = options.ownerId ? eq(media.uploadedBy, options.ownerId) : undefined;

  const [totalRow] = await executor.select({ n: count() }).from(media).where(where);
  const items = await executor
    .select()
    .from(media)
    .where(where)
    .orderBy(desc(media.createdAt), desc(media.id))
    .limit(pageSize)
    .offset(offset);

  return { items, total: totalRow?.n ?? 0, page, pageSize };
}

export async function updateMediaMetadata(
  executor: Executor,
  id: string,
  values: { altText?: string | null; caption?: string | null; focalX?: number; focalY?: number },
): Promise<MediaRow | null> {
  const [row] = await executor.update(media).set(values).where(eq(media.id, id)).returning();
  return row ?? null;
}

export async function deleteMediaRow(executor: Executor, id: string): Promise<void> {
  await executor.delete(media).where(eq(media.id, id));
}

/**
 * Verifica se a mídia está referenciada em algum lugar publicável (capa/OG de artigo, solução,
 * página, especialista ou dentro do corpo de um artigo). A exclusão só é permitida se devolver
 * `false` — evita imagem quebrada em conteúdo existente.
 */
export async function isMediaReferenced(executor: Executor, id: string): Promise<boolean> {
  const [postRow] = await executor
    .select({ id: posts.id })
    .from(posts)
    .where(
      sql`${posts.coverMediaId} = ${id} OR ${posts.ogMediaId} = ${id} OR ${posts.body}::text LIKE ${"%" + id + "%"}`,
    )
    .limit(1);
  if (postRow) return true;

  const [solutionRow] = await executor
    .select({ id: solutions.id })
    .from(solutions)
    .where(
      sql`${solutions.ogMediaId} = ${id} OR ${solutions.context}::text LIKE ${"%" + id + "%"} OR ${solutions.approach}::text LIKE ${"%" + id + "%"}`,
    )
    .limit(1);
  if (solutionRow) return true;

  const [specialistRow] = await executor
    .select({ id: specialists.id })
    .from(specialists)
    .where(
      sql`${specialists.photoMediaId} = ${id} OR ${specialists.ogMediaId} = ${id} OR ${specialists.bio}::text LIKE ${"%" + id + "%"}`,
    )
    .limit(1);
  if (specialistRow) return true;

  const [pageRow] = await executor
    .select({ id: pages.id })
    .from(pages)
    .where(sql`${pages.ogMediaId} = ${id} OR ${pages.data}::text LIKE ${"%" + id + "%"}`)
    .limit(1);
  if (pageRow) return true;

  return false;
}
