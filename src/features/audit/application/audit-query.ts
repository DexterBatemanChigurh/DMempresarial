import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { assertCan, type Actor } from "@/server/permissions";
import {
  listAuditEntityTypes,
  listAuditLogs,
  type AuditFilter,
  type Page,
  type AuditRow,
} from "../infrastructure/audit-repository";

type Deps = { db: Database };

export async function getAuditLog(
  { db }: Deps,
  actor: Actor | null | undefined,
  filter: AuditFilter,
  options: { page?: number } = {},
): Promise<Page<AuditRow>> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "audit:view");
  return listAuditLogs(db, filter, options);
}

export async function getAuditEntityTypes(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<string[]> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "audit:view");
  return listAuditEntityTypes(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const getAuditLogForRoute = (
  actor: Actor | null | undefined,
  filter: AuditFilter,
  options?: { page?: number },
) => getAuditLog({ db: getDb() }, actor, filter, options);
export const getAuditEntityTypesForRoute = (actor: Actor | null | undefined) =>
  getAuditEntityTypes({ db: getDb() }, actor);
