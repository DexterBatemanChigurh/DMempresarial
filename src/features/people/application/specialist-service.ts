import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { specialists } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, can, type Action, type Actor } from "@/server/permissions";
import { specialistPublishBlockers } from "../domain/specialist-rules";

/**
 * Transição de estado do especialista (docs/03, parte 9: DRAFT/PUBLISHED/ARCHIVED, sem revisão
 * nem agendamento). Separado do CRUD (`specialist-crud.ts`) pelo mesmo motivo de `post-service.ts`
 * vs `post-crud.ts`: estado muda só aqui, com bloqueio otimista e auditoria.
 */
type Deps = { db: Database };

export type SpecialistStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export const SPECIALIST_STATUSES: readonly SpecialistStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];
const TRANSITIONS: Readonly<Record<SpecialistStatus, readonly SpecialistStatus[]>> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT"],
};
function canTransition(from: SpecialistStatus, to: SpecialistStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export type TransitionSpecialistInput = {
  actor: Actor | null | undefined;
  specialistId: string;
  to: SpecialistStatus;
  expectedVersion: number;
  now?: Date;
  requestId?: string;
};

export type SpecialistMutationResult = {
  id: string;
  slug: string;
  status: SpecialistStatus;
  version: number;
  invalidateTags: string[];
};

// Toda transição (inclusive DRAFT → PUBLISHED) é uma decisão editorial: só `specialist:manage`
// (ADMIN/EDITOR). `specialist:edit-own` só cobre o CONTEÚDO do próprio perfil (`specialist-crud.ts`).
const PERMISSION: Action = "specialist:manage";

export async function transitionSpecialist(
  { db }: Deps,
  input: TransitionSpecialistInput,
): Promise<SpecialistMutationResult> {
  const { actor, specialistId, to, expectedVersion } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const now = input.now ?? new Date();

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(specialists)
      .where(eq(specialists.id, specialistId))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Especialista inexistente.");
    const from = existing.status as SpecialistStatus;

    assertCan(actor, PERMISSION);
    if (existing.version !== expectedVersion) {
      throw new AppError("CONFLICT", "O especialista foi alterado por outra pessoa.");
    }
    if (!canTransition(from, to)) {
      throw new AppError("DOMAIN_RULE", `Transição inválida: ${from} → ${to}.`);
    }

    if (to === "PUBLISHED") {
      const blockers = specialistPublishBlockers({
        kind: existing.kind as "TEAM" | "GUEST",
        name: existing.name,
        slug: existing.slug,
        roleTitle: existing.roleTitle,
        summary: existing.summary,
        photoMediaId: existing.photoMediaId,
      });
      if (blockers.length > 0) {
        throw new AppError("DOMAIN_RULE", "Pré-requisitos de publicação não atendidos.", {
          fieldErrors: { publish: blockers.map((b) => b.message) },
        });
      }
    }

    const values: Partial<typeof specialists.$inferInsert> = { status: to, updatedBy: actor.id };
    if (to === "PUBLISHED") {
      values.publishedAt = existing.publishedAt ?? now;
      values.archivedAt = null;
    } else if (to === "ARCHIVED") {
      values.archivedAt = now;
    } else {
      values.archivedAt = null;
    }

    const [updated] = await tx
      .update(specialists)
      .set({ ...values, version: sql`${specialists.version} + 1` })
      .where(and(eq(specialists.id, specialistId), eq(specialists.version, expectedVersion)))
      .returning({
        id: specialists.id,
        slug: specialists.slug,
        status: specialists.status,
        version: specialists.version,
      });
    if (!updated) throw new AppError("CONFLICT", "O especialista foi alterado por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: `specialist.${to.toLowerCase()}`,
      entityType: "specialist",
      entityId: specialistId,
      metadata: { from, to },
      requestId: input.requestId,
    });

    return {
      ...updated,
      status: updated.status as SpecialistStatus,
      invalidateTags: [`specialist:${updated.slug}`, "specialists"],
    };
  });
}

/** Útil para a UI decidir quais botões mostrar (a autorização real acontece na função acima). */
export function availableSpecialistTransitions(
  actor: Actor | null | undefined,
  from: SpecialistStatus,
): SpecialistStatus[] {
  return TRANSITIONS[from].filter(() => can(actor, PERMISSION));
}

// -----------------------------------------------------------------------------------------------
// Wrapper para Server Actions (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function transitionSpecialistForRoute(
  input: TransitionSpecialistInput,
): Promise<SpecialistMutationResult> {
  return transitionSpecialist({ db: getDb() }, input);
}
