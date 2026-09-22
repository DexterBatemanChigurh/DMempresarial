import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { solutions } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, can, type Action, type Actor } from "@/server/permissions";
import { solutionPublishBlockers } from "../domain/solution-rules";

/**
 * Transição de estado da solução (docs/03, parte 9: DRAFT/PUBLISHED/ARCHIVED, sem revisão nem
 * agendamento). Mesmo desenho de `specialist-service.ts`.
 */
type Deps = { db: Database };

export type SolutionStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export const SOLUTION_STATUSES: readonly SolutionStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const TRANSITIONS: Readonly<Record<SolutionStatus, readonly SolutionStatus[]>> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};
function canTransition(from: SolutionStatus, to: SolutionStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

const PERMISSION: Action = "solution:manage";

export type TransitionSolutionInput = {
  actor: Actor | null | undefined;
  solutionId: string;
  to: SolutionStatus;
  expectedVersion: number;
  now?: Date;
  requestId?: string;
};

export type SolutionMutationResult = {
  id: string;
  slug: string;
  status: SolutionStatus;
  version: number;
  invalidateTags: string[];
};

export async function transitionSolution(
  { db }: Deps,
  input: TransitionSolutionInput,
): Promise<SolutionMutationResult> {
  const { actor, solutionId, to, expectedVersion } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const now = input.now ?? new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(solutions)
      .where(eq(solutions.id, solutionId))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Solução inexistente.");
    const from = existing.status as SolutionStatus;

    assertCan(actor, PERMISSION);
    if (existing.version !== expectedVersion) {
      throw new AppError("CONFLICT", "A solução foi alterada por outra pessoa.");
    }
    if (!canTransition(from, to)) {
      throw new AppError("DOMAIN_RULE", `Transição inválida: ${from} → ${to}.`);
    }

    if (to === "PUBLISHED") {
      const blockers = solutionPublishBlockers({
        title: existing.title,
        slug: existing.slug,
        summary: existing.summary,
        context: existing.context,
        approach: existing.approach,
      });
      if (blockers.length > 0) {
        throw new AppError("DOMAIN_RULE", "Pré-requisitos de publicação não atendidos.", {
          fieldErrors: { publish: blockers.map((b) => b.message) },
        });
      }
    }

    const values: Partial<typeof solutions.$inferInsert> = { status: to, updatedBy: actor.id };
    if (to === "PUBLISHED") {
      values.publishedAt = existing.publishedAt ?? now;
      values.archivedAt = null;
    } else if (to === "ARCHIVED") {
      values.archivedAt = now;
    } else {
      values.archivedAt = null;
    }

    const [updated] = await tx
      .update(solutions)
      .set({ ...values, version: sql`${solutions.version} + 1` })
      .where(and(eq(solutions.id, solutionId), eq(solutions.version, expectedVersion)))
      .returning({
        id: solutions.id,
        slug: solutions.slug,
        status: solutions.status,
        version: solutions.version,
      });
    if (!updated) throw new AppError("CONFLICT", "A solução foi alterada por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: `solution.${to.toLowerCase()}`,
      entityType: "solution",
      entityId: solutionId,
      metadata: { from, to },
      requestId: input.requestId,
    });

    return {
      ...updated,
      status: updated.status as SolutionStatus,
      invalidateTags: [`solution:${updated.slug}`, "solutions"],
    };
  });
}

/** Útil para a UI decidir quais botões mostrar (a autorização real acontece na função acima). */
export function availableSolutionTransitions(
  actor: Actor | null | undefined,
  from: SolutionStatus,
): SolutionStatus[] {
  return TRANSITIONS[from].filter(() => can(actor, PERMISSION));
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function transitionSolutionForRoute(
  input: TransitionSolutionInput,
): Promise<SolutionMutationResult> {
  return transitionSolution({ db: getDb() }, input);
}
