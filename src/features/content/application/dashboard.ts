import "server-only";
import { and, asc, count, eq } from "drizzle-orm";
import { getDb, type Database } from "@/db/client";
import { posts } from "@/db/schema";
import type { Actor } from "@/server/permissions";

export type PostStatusCounts = Record<
  "DRAFT" | "REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED",
  number
>;

/**
 * Contagem de artigos por estado para o painel. O escopo depende do papel: ADMIN e EDITOR veem
 * tudo; AUTHOR vê SÓ os próprios (nunca conta o que não pode abrir).
 */
export async function postCountsFor(db: Database, actor: Actor): Promise<PostStatusCounts> {
  const query = db.select({ status: posts.status, n: count() }).from(posts);
  const rows = await (
    actor.role === "AUTHOR" ? query.where(eq(posts.createdBy, actor.id)) : query
  ).groupBy(posts.status);

  const counts: PostStatusCounts = { DRAFT: 0, REVIEW: 0, SCHEDULED: 0, PUBLISHED: 0, ARCHIVED: 0 };
  for (const row of rows) counts[row.status] = row.n;
  return counts;
}

/** Versão para as rotas: usa o banco da aplicação (rotas nunca importam o cliente do banco). */
export function getPostCounts(actor: Actor): Promise<PostStatusCounts> {
  return postCountsFor(getDb(), actor);
}

export type UpcomingPost = { id: string; title: string; scheduledFor: Date };

/** Próximos artigos agendados (mesmo escopo por papel da contagem acima). */
export async function upcomingScheduledFor(
  db: Database,
  actor: Actor,
  limit = 5,
): Promise<UpcomingPost[]> {
  const scheduled = eq(posts.status, "SCHEDULED");
  const rows = await db
    .select({ id: posts.id, title: posts.title, scheduledFor: posts.scheduledFor })
    .from(posts)
    .where(actor.role === "AUTHOR" ? and(scheduled, eq(posts.createdBy, actor.id)) : scheduled)
    .orderBy(asc(posts.scheduledFor))
    .limit(limit);
  return rows.flatMap((r) => (r.scheduledFor ? [{ ...r, scheduledFor: r.scheduledFor }] : []));
}

export function getUpcomingScheduled(actor: Actor, limit?: number): Promise<UpcomingPost[]> {
  return upcomingScheduledFor(getDb(), actor, limit);
}
