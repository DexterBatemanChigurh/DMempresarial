import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { pages } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, can, type Action, type Actor } from "@/server/permissions";
import { isArchiveBlocked, pagePublishBlockers } from "../domain/page-rules";
import type { PageTemplate } from "../domain/page-schemas";

/**
 * Transição de estado da página institucional (docs/03, parte 9). Mesmo desenho de
 * `solution-service.ts`, com uma regra a mais: `privacy`/`terms` nunca arquivam (ficam sempre
 * publicadas — docs/03, parte 7.3).
 */
type Deps = { db: Database };

export type PageStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export const PAGE_STATUSES: readonly PageStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const TRANSITIONS: Readonly<Record<PageStatus, readonly PageStatus[]>> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};
function canTransition(from: PageStatus, to: PageStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

const PERMISSION: Action = "page:manage";

export type TransitionPageInput = {
  actor: Actor | null | undefined;
  pageId: string;
  to: PageStatus;
  expectedVersion: number;
  now?: Date;
  requestId?: string;
};

export type PageMutationResult = {
  id: string;
  key: string;
  status: PageStatus;
  version: number;
  invalidateTags: string[];
};

export async function transitionPage(
  { db }: Deps,
  input: TransitionPageInput,
): Promise<PageMutationResult> {
  const { actor, pageId, to, expectedVersion } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const now = input.now ?? new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(pages)
      .where(eq(pages.id, pageId))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Página inexistente.");
    const from = existing.status as PageStatus;

    assertCan(actor, PERMISSION);
    if (existing.version !== expectedVersion) {
      throw new AppError("CONFLICT", "A página foi alterada por outra pessoa.");
    }
    if (!canTransition(from, to)) {
      throw new AppError("DOMAIN_RULE", `Transição inválida: ${from} → ${to}.`);
    }
    if (to === "ARCHIVED" && isArchiveBlocked(existing.key)) {
      throw new AppError(
        "DOMAIN_RULE",
        "Esta página fica sempre publicada e não pode ser arquivada.",
      );
    }

    if (to === "PUBLISHED") {
      const blockers = pagePublishBlockers({
        title: existing.title,
        key: existing.key,
        template: existing.template as PageTemplate,
        data: (existing.data ?? {}) as Record<string, unknown>,
      });
      if (blockers.length > 0) {
        throw new AppError("DOMAIN_RULE", "Pré-requisitos de publicação não atendidos.", {
          fieldErrors: { publish: blockers.map((b) => b.message) },
        });
      }
    }

    const values: Partial<typeof pages.$inferInsert> = { status: to, updatedBy: actor.id };
    if (to === "PUBLISHED") {
      values.publishedAt = existing.publishedAt ?? now;
      values.archivedAt = null;
    } else if (to === "ARCHIVED") {
      values.archivedAt = now;
    } else {
      values.archivedAt = null;
    }

    const [updated] = await tx
      .update(pages)
      .set({ ...values, version: sql`${pages.version} + 1` })
      .where(and(eq(pages.id, pageId), eq(pages.version, expectedVersion)))
      .returning({ id: pages.id, key: pages.key, status: pages.status, version: pages.version });
    if (!updated) throw new AppError("CONFLICT", "A página foi alterada por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: `page.${to.toLowerCase()}`,
      entityType: "page",
      entityId: pageId,
      metadata: { from, to },
      requestId: input.requestId,
    });

    return {
      ...updated,
      status: updated.status as PageStatus,
      invalidateTags: [`page:${updated.key}`, "pages"],
    };
  });
}

/** Útil para a UI decidir quais botões mostrar (a autorização real acontece na função acima). */
export function availablePageTransitions(
  actor: Actor | null | undefined,
  from: PageStatus,
  key: string,
): PageStatus[] {
  return TRANSITIONS[from].filter((to) => {
    if (to === "ARCHIVED" && isArchiveBlocked(key)) return false;
    return can(actor, PERMISSION);
  });
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function transitionPageForRoute(input: TransitionPageInput): Promise<PageMutationResult> {
  return transitionPage({ db: getDb() }, input);
}
