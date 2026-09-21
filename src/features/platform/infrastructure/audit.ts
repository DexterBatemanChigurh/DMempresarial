import "server-only";
import type { Executor } from "@/db/client";
import { auditLogs } from "@/db/schema";

export type AuditEntry = {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  /** Só o mínimo: nomes de campos e estados de/para. NUNCA conteúdo, senhas ou dados pessoais. */
  metadata?: Record<string, unknown>;
  requestId?: string | null;
};

/**
 * Registra uma ação administrativa. Chame SEMPRE com a transação da própria mudança: se o
 * registro falhar, a mudança é desfeita (não existe alteração sem rastro).
 */
export async function recordAudit(executor: Executor, entry: AuditEntry): Promise<void> {
  await executor.insert(auditLogs).values({
    actorUserId: entry.actorId ?? null,
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    metadata: entry.metadata ?? {},
    requestId: entry.requestId ?? null,
  });
}
