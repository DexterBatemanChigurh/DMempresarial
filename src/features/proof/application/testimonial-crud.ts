import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { testimonials } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import {
  canTransitionTestimonial,
  validateTestimonial,
  type TestimonialInput,
  type TestimonialStatus,
} from "../domain/proof";
import {
  findTestimonialForAdmin,
  listTestimonialsForAdmin,
  type TestimonialForAdmin,
} from "../infrastructure/proof-repository";

/**
 * CRUD de depoimentos (ADMIN/EDITOR, `testimonial:manage`). Mesmo desenho das soluções: conteúdo
 * por `create`/`update` com bloqueio otimista, estado só por `transitionTestimonial`, auditoria
 * na mesma transação — sem o texto do depoimento, só o que mudou.
 */
type Deps = { db: Database };

/** Tag de cache das leituras públicas (Home e /depoimentos). */
export const TESTIMONIALS_TAG = "testimonials";

function requireActor(actor: Actor | null | undefined): Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "testimonial:manage");
  return actor;
}

function validOrThrow(input: TestimonialInput): TestimonialInput {
  const { value, errors } = validateTestimonial(input);
  if (Object.keys(errors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", {
      fieldErrors: errors as Record<string, string[]>,
    });
  }
  return value;
}

function columns(value: TestimonialInput) {
  return {
    authorName: value.authorName,
    authorDetail: value.authorDetail,
    quote: value.quote,
    rating: value.rating,
    source: value.source,
    givenAt: value.givenAt ? new Date(`${value.givenAt}T12:00:00Z`) : null,
    position: value.position,
  };
}

export async function createTestimonial(
  { db }: Deps,
  input: TestimonialInput & { actor: Actor | null | undefined; requestId?: string },
): Promise<{ id: string }> {
  const actor = requireActor(input.actor);
  const value = validOrThrow(input);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(testimonials)
      .values({ ...columns(value), createdBy: actor.id, updatedBy: actor.id })
      .returning({ id: testimonials.id });
    if (!row) throw new Error("Falha ao gravar o depoimento.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "testimonial.created",
      entityType: "testimonial",
      entityId: row.id,
      metadata: { source: value.source },
      requestId: input.requestId,
    });
    return row;
  });
}

export async function updateTestimonial(
  { db }: Deps,
  input: TestimonialInput & {
    actor: Actor | null | undefined;
    id: string;
    expectedVersion: number;
    requestId?: string;
  },
): Promise<{ id: string; version: number; status: TestimonialStatus }> {
  const actor = requireActor(input.actor);
  const value = validOrThrow(input);
  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(testimonials)
      .set({
        ...columns(value),
        updatedBy: actor.id,
        version: sql`${testimonials.version} + 1`,
      })
      .where(and(eq(testimonials.id, input.id), eq(testimonials.version, input.expectedVersion)))
      .returning({
        id: testimonials.id,
        version: testimonials.version,
        status: testimonials.status,
      });
    if (!updated) {
      const exists = await findTestimonialForAdmin(tx, input.id);
      if (!exists) throw new AppError("NOT_FOUND", "Depoimento inexistente.");
      throw new AppError("CONFLICT", "O depoimento foi alterado por outra pessoa.");
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: "testimonial.updated",
      entityType: "testimonial",
      entityId: input.id,
      requestId: input.requestId,
    });
    return { ...updated, status: updated.status as TestimonialStatus };
  });
}

export async function transitionTestimonial(
  { db }: Deps,
  input: {
    actor: Actor | null | undefined;
    id: string;
    to: TestimonialStatus;
    expectedVersion: number;
    now?: Date;
    requestId?: string;
  },
): Promise<{ id: string; version: number; status: TestimonialStatus }> {
  const actor = requireActor(input.actor);
  const now = input.now ?? new Date();
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(testimonials)
      .where(eq(testimonials.id, input.id))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Depoimento inexistente.");
    if (existing.version !== input.expectedVersion) {
      throw new AppError("CONFLICT", "O depoimento foi alterado por outra pessoa.");
    }
    const from = existing.status as TestimonialStatus;
    if (!canTransitionTestimonial(from, input.to)) {
      throw new AppError("DOMAIN_RULE", `Transição inválida: ${from} → ${input.to}.`);
    }

    const [updated] = await tx
      .update(testimonials)
      .set({
        status: input.to,
        publishedAt:
          input.to === "PUBLISHED" ? (existing.publishedAt ?? now) : existing.publishedAt,
        archivedAt: input.to === "ARCHIVED" ? now : null,
        updatedBy: actor.id,
        version: sql`${testimonials.version} + 1`,
      })
      .where(eq(testimonials.id, input.id))
      .returning({
        id: testimonials.id,
        version: testimonials.version,
        status: testimonials.status,
      });
    if (!updated) throw new AppError("CONFLICT", "O depoimento foi alterado por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: `testimonial.${input.to.toLowerCase()}`,
      entityType: "testimonial",
      entityId: input.id,
      metadata: { from, to: input.to },
      requestId: input.requestId,
    });
    return { ...updated, status: updated.status as TestimonialStatus };
  });
}

export async function deleteTestimonial(
  { db }: Deps,
  input: { actor: Actor | null | undefined; id: string; requestId?: string },
): Promise<void> {
  const actor = requireActor(input.actor);
  await db.transaction(async (tx) => {
    const [row] = await tx
      .delete(testimonials)
      .where(eq(testimonials.id, input.id))
      .returning({ id: testimonials.id });
    if (!row) throw new AppError("NOT_FOUND", "Depoimento inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "testimonial.deleted",
      entityType: "testimonial",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export async function listTestimonials(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<TestimonialForAdmin[]> {
  requireActor(actor);
  return listTestimonialsForAdmin(db);
}

export async function getTestimonialForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
  id: string,
): Promise<TestimonialForAdmin> {
  requireActor(actor);
  const found = await findTestimonialForAdmin(db, id);
  if (!found) throw new AppError("NOT_FOUND", "Depoimento inexistente.");
  return found;
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

type WithActor<T> = T & { actor: Actor | null | undefined; requestId?: string };

export const createTestimonialForRoute = (input: WithActor<TestimonialInput>) =>
  createTestimonial({ db: getDb() }, input);
export const updateTestimonialForRoute = (
  input: WithActor<TestimonialInput> & { id: string; expectedVersion: number },
) => updateTestimonial({ db: getDb() }, input);
export const transitionTestimonialForRoute = (
  input: WithActor<{ id: string; to: TestimonialStatus; expectedVersion: number }>,
) => transitionTestimonial({ db: getDb() }, input);
export const deleteTestimonialForRoute = (input: WithActor<{ id: string }>) =>
  deleteTestimonial({ db: getDb() }, input);
export const listTestimonialsForRoute = (actor: Actor | null | undefined) =>
  listTestimonials({ db: getDb() }, actor);
export const getTestimonialForEditForRoute = (actor: Actor | null | undefined, id: string) =>
  getTestimonialForEdit({ db: getDb() }, actor, id);
