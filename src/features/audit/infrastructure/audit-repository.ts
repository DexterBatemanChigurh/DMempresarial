import "server-only";
import { and, count, desc, eq, sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { auditLogs, users } from "@/db/schema";

export type AuditRow = {
  id: string;
  at: Date;
  actorName: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
};

export type AuditFilter = { entityType?: string; action?: string };

function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 100) : 50;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

/** Sem dado pessoal: só ator (nome, não e-mail), ação e entidade — `metadata` fica de fora. */
export async function listAuditLogs(
  executor: Executor,
  filter: AuditFilter,
  options: { page?: number } = {},
): Promise<Page<AuditRow>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, 50);
  const conditions = [
    filter.entityType ? eq(auditLogs.entityType, filter.entityType) : undefined,
    filter.action ? eq(auditLogs.action, filter.action) : undefined,
  ].filter((c) => c !== undefined);
  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalRow] = await executor
    .select({ n: count() })
    .from(auditLogs)
    .where(where ?? sql`true`);

  const rows = await executor
    .select({
      id: auditLogs.id,
      at: auditLogs.at,
      actorName: users.name,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
    })
    .from(auditLogs)
    .leftJoin(users, eq(users.id, auditLogs.actorUserId))
    .where(where ?? sql`true`)
    .orderBy(desc(auditLogs.at))
    .limit(pageSize)
    .offset(offset);

  return { items: rows, total: totalRow?.n ?? 0, page, pageSize };
}

export async function listAuditEntityTypes(executor: Executor): Promise<string[]> {
  const rows = await executor
    .selectDistinct({ entityType: auditLogs.entityType })
    .from(auditLogs)
    .orderBy(auditLogs.entityType);
  return rows.map((r) => r.entityType);
}
