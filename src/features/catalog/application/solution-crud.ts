import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { solutions } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";
import { prepareRichBody } from "@/features/content/application/rich-body";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import {
  findSolutionForEdit,
  isSolutionReferenced,
  listSolutionsForAdminPaged,
  replaceSolutionItems,
  type Page,
  type SolutionForEdit,
  type SolutionItemInput,
  type SolutionSummaryForAdmin,
} from "../infrastructure/solution-repository";

export type { SolutionItemInput } from "../infrastructure/solution-repository";

/**
 * CRUD de solução (docs/03, parte 9): edita CONTEÚDO (título, resumo, contexto, abordagem,
 * itens, destaque). Estado (`status`) muda só por `transitionSolution`. Só ADMIN/EDITOR
 * (`solution:manage`) — sem conceito de "dono" ou edição parcial para AUTHOR.
 */
type Deps = { db: Database };

const LIMITS = { title: 160, summary: 280, seoTitle: 70, seoDescription: 160 };
const ITEM_LIMITS = { title: 160, body: 600 };

function assertFieldLengths(input: {
  title: string;
  summary: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): void {
  const fieldErrors: Record<string, string[]> = {};
  if (input.title.trim() === "") fieldErrors.title = ["Título obrigatório."];
  if (input.title.length > LIMITS.title)
    fieldErrors.title = [`No máximo ${LIMITS.title} caracteres.`];
  if (input.summary.trim() === "") fieldErrors.summary = ["Resumo obrigatório."];
  if (input.summary.length > LIMITS.summary) {
    fieldErrors.summary = [`No máximo ${LIMITS.summary} caracteres.`];
  }
  if ((input.seoTitle?.length ?? 0) > LIMITS.seoTitle) {
    fieldErrors.seoTitle = [`No máximo ${LIMITS.seoTitle} caracteres.`];
  }
  if ((input.seoDescription?.length ?? 0) > LIMITS.seoDescription) {
    fieldErrors.seoDescription = [`No máximo ${LIMITS.seoDescription} caracteres.`];
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
  }
}

function assertItems(items: SolutionItemInput[]): void {
  for (const item of items) {
    if (item.title.trim() === "" || item.title.length > ITEM_LIMITS.title) {
      throw new AppError("VALIDATION", "Confira os itens da solução.", {
        fieldErrors: {
          items: [`Cada item precisa de um título de até ${ITEM_LIMITS.title} caracteres.`],
        },
      });
    }
    if ((item.body?.length ?? 0) > ITEM_LIMITS.body) {
      throw new AppError("VALIDATION", "Confira os itens da solução.", {
        fieldErrors: { items: [`O texto de cada item vai até ${ITEM_LIMITS.body} caracteres.`] },
      });
    }
  }
}

function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && (current as { code?: unknown }).code === "23505")
      return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export type SolutionContentInput = {
  actor: Actor | null | undefined;
  type: "CONSULTORIA" | "SERVICO";
  title: string;
  summary: string;
  context?: unknown;
  approach?: unknown;
  isFeatured: boolean;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogMediaId?: string | null;
  items: SolutionItemInput[];
  requestId?: string;
};

export type CreateSolutionInput = SolutionContentInput & { slug?: string };

export async function createSolution(
  { db }: Deps,
  input: CreateSolutionInput,
): Promise<{ id: string; slug: string }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "solution:manage");
  assertFieldLengths(input);
  assertItems(input.items);

  const slug = input.slug?.trim() || slugify(input.title);
  if (!isValidSlug(slug)) {
    throw new AppError("VALIDATION", "Slug inválido.", {
      fieldErrors: { slug: ["Use minúsculas, números e hífens (até 80 caracteres)."] },
    });
  }
  if (isReservedSlug(slug)) {
    throw new AppError("VALIDATION", "Slug reservado.", {
      fieldErrors: { slug: ["Este endereço é reservado pelo site."] },
    });
  }

  const context =
    input.context !== undefined ? prepareRichBody(input.context, "context").doc : null;
  const approach =
    input.approach !== undefined ? prepareRichBody(input.approach, "approach").doc : null;

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(solutions)
        .values({
          type: input.type,
          slug,
          title: input.title.trim(),
          summary: input.summary.trim(),
          context,
          approach,
          isFeatured: input.isFeatured,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          ogMediaId: input.ogMediaId ?? null,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({ id: solutions.id, slug: solutions.slug });
      if (!row) throw new Error("Falha ao gravar a solução.");

      await replaceSolutionItems(tx, row.id, input.items);
      await recordAudit(tx, {
        actorId: actor.id,
        action: "solution.created",
        entityType: "solution",
        entityId: row.id,
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe uma solução com este endereço."] },
      });
    }
    throw error;
  }
}

export type UpdateSolutionInput = SolutionContentInput & { id: string; expectedVersion: number };

export async function updateSolution(
  { db }: Deps,
  input: UpdateSolutionInput,
): Promise<{ id: string; slug: string; version: number }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "solution:manage");
  assertFieldLengths(input);
  assertItems(input.items);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(solutions)
      .where(eq(solutions.id, input.id))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Solução inexistente.");
    if (existing.version !== input.expectedVersion) {
      throw new AppError("CONFLICT", "A solução foi alterada por outra pessoa.");
    }

    const context =
      input.context !== undefined
        ? prepareRichBody(input.context, "context").doc
        : existing.context;
    const approach =
      input.approach !== undefined
        ? prepareRichBody(input.approach, "approach").doc
        : existing.approach;

    const [updated] = await tx
      .update(solutions)
      .set({
        type: input.type,
        title: input.title.trim(),
        summary: input.summary.trim(),
        context,
        approach,
        isFeatured: input.isFeatured,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        ogMediaId: input.ogMediaId ?? null,
        updatedBy: actor.id,
        version: existing.version + 1,
      })
      .where(eq(solutions.id, input.id))
      .returning({ id: solutions.id, slug: solutions.slug, version: solutions.version });
    if (!updated) throw new AppError("CONFLICT", "A solução foi alterada por outra pessoa.");

    await replaceSolutionItems(tx, input.id, input.items);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "solution.updated",
      entityType: "solution",
      entityId: input.id,
      requestId: input.requestId,
    });
    return updated;
  });
}

export type DeleteSolutionInput = {
  actor: Actor | null | undefined;
  id: string;
  requestId?: string;
};

export async function deleteSolution({ db }: Deps, input: DeleteSolutionInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "solution:manage");
  if (await isSolutionReferenced(db, input.id)) {
    throw new AppError(
      "DOMAIN_RULE",
      "Esta solução tem artigos relacionados e não pode ser excluída.",
    );
  }
  await db.transaction(async (tx) => {
    if (await isSolutionReferenced(tx, input.id)) {
      throw new AppError(
        "DOMAIN_RULE",
        "Esta solução tem artigos relacionados e não pode ser excluída.",
      );
    }
    const [row] = await tx
      .delete(solutions)
      .where(eq(solutions.id, input.id))
      .returning({ id: solutions.id });
    if (!row) throw new AppError("NOT_FOUND", "Solução inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "solution.deleted",
      entityType: "solution",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export async function getSolutionForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
  id: string,
): Promise<SolutionForEdit> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "solution:manage");
  const found = await findSolutionForEdit(db, id);
  if (!found) throw new AppError("NOT_FOUND", "Solução inexistente.");
  return found;
}

export async function listSolutionsForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  options: { page?: number } = {},
): Promise<Page<SolutionSummaryForAdmin>> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "solution:manage");
  return listSolutionsForAdminPaged(db, options);
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const createSolutionForRoute = (input: CreateSolutionInput) =>
  createSolution({ db: getDb() }, input);
export const updateSolutionForRoute = (input: UpdateSolutionInput) =>
  updateSolution({ db: getDb() }, input);
export const deleteSolutionForRoute = (input: DeleteSolutionInput) =>
  deleteSolution({ db: getDb() }, input);
export const getSolutionForEditForRoute = (actor: Actor | null | undefined, id: string) =>
  getSolutionForEdit({ db: getDb() }, actor, id);
export const listSolutionsForAdminForRoute = (
  actor: Actor | null | undefined,
  options?: { page?: number },
) => listSolutionsForAdmin({ db: getDb() }, actor, options);
