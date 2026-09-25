import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { specialists } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";
import { prepareRichBody } from "@/features/content/application/rich-body";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, can, type Actor } from "@/server/permissions";
import {
  findSpecialistForEdit,
  isSpecialistReferenced,
  listSpecialistsForAdminPaged,
  replaceSpecialistAssociations,
  type Page as SpecialistPage,
  type SpecialistForEdit,
  type SpecialistSummaryForAdmin,
} from "../infrastructure/specialist-repository";

/**
 * CRUD de especialista (docs/03, parte 9): edita CONTEÚDO (nome, cargo, resumo, bio, foto, áreas
 * de atuação, soluções). Estado (`status`) muda só por `transitionSpecialist`. `create`,
 * `delete` e trocar `userId`/`kind` são só de ADMIN/EDITOR (`specialist:manage`); editar o
 * conteúdo do PRÓPRIO perfil vinculado (`userId`) também é permitido a quem é dono
 * (`specialist:edit-own` — pronto para quando o incremento de usuários existir e puder ligar uma
 * conta a um especialista).
 */
type Deps = { db: Database };

const LIMITS = { name: 120, roleTitle: 120, summary: 400, seoTitle: 70, seoDescription: 160 };

function assertName(name: string): void {
  if (name.trim() === "") {
    throw new AppError("VALIDATION", "Nome obrigatório.", {
      fieldErrors: { name: ["Nome obrigatório."] },
    });
  }
}

function assertFieldLengths(input: {
  name: string;
  roleTitle?: string | null;
  summary?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): void {
  const fieldErrors: Record<string, string[]> = {};
  const check = (field: keyof typeof LIMITS, value: string | null | undefined) => {
    if ((value?.length ?? 0) > LIMITS[field])
      fieldErrors[field] = [`No máximo ${LIMITS[field]} caracteres.`];
  };
  check("name", input.name);
  check("roleTitle", input.roleTitle);
  check("summary", input.summary);
  check("seoTitle", input.seoTitle);
  check("seoDescription", input.seoDescription);
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
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

/** Para quem não pode nem ver o especialista, a resposta é "não existe" (não revelar existência: BOLA/IDOR). */
function mustHideExistence(actor: Actor, ownerId: string | null): boolean {
  return actor.role === "AUTHOR" && ownerId !== actor.id;
}

/** Editar CONTEÚDO permite ADMIN/EDITOR (qualquer perfil) OU o dono do próprio (`userId`). */
function assertCanEditContent(
  actor: Actor | null | undefined,
  ownerId: string | null,
): asserts actor is Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  if (can(actor, "specialist:manage")) return;
  assertCan(
    actor,
    "specialist:edit-own",
    { ownerId },
    { hideExistence: mustHideExistence(actor, ownerId) },
  );
}

export type SpecialistContentInput = {
  actor: Actor | null | undefined;
  name: string;
  roleTitle?: string | null;
  summary?: string | null;
  bio?: unknown;
  photoMediaId?: string | null;
  kind?: "TEAM" | "GUEST";
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogMediaId?: string | null;
  solutionIds: string[];
  categoryIds: string[];
  requestId?: string;
};

export type CreateSpecialistInput = SpecialistContentInput & { slug?: string };

export async function createSpecialist(
  { db }: Deps,
  input: CreateSpecialistInput,
): Promise<{ id: string; slug: string }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  // Criar um perfil novo (ninguém é dono ainda) é sempre ADMIN/EDITOR.
  assertCan(actor, "specialist:manage");
  assertName(input.name);
  assertFieldLengths(input);

  const slug = input.slug?.trim() || slugify(input.name);
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

  const bio = input.bio !== undefined ? prepareRichBody(input.bio, "bio").doc : null;

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(specialists)
        .values({
          slug,
          name: input.name.trim(),
          roleTitle: input.roleTitle?.trim() || null,
          summary: input.summary?.trim() || null,
          bio,
          photoMediaId: input.photoMediaId ?? null,
          kind: input.kind ?? "TEAM",
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          ogMediaId: input.ogMediaId ?? null,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({ id: specialists.id, slug: specialists.slug });
      if (!row) throw new Error("Falha ao gravar o especialista.");

      await replaceSpecialistAssociations(tx, row.id, input);
      await recordAudit(tx, {
        actorId: actor.id,
        action: "specialist.created",
        entityType: "specialist",
        entityId: row.id,
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe um especialista com este endereço."] },
      });
    }
    throw error;
  }
}

export type UpdateSpecialistInput = SpecialistContentInput & {
  id: string;
  expectedVersion: number;
};

export async function updateSpecialist(
  { db }: Deps,
  input: UpdateSpecialistInput,
): Promise<{ id: string; slug: string; version: number }> {
  const actor = input.actor;
  assertFieldLengths(input);
  assertName(input.name);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(specialists)
      .where(eq(specialists.id, input.id))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Especialista inexistente.");

    assertCanEditContent(actor, existing.userId);
    const isManager = can(actor, "specialist:manage");
    if (existing.version !== input.expectedVersion) {
      throw new AppError("CONFLICT", "O especialista foi alterado por outra pessoa.");
    }

    const bio = input.bio !== undefined ? prepareRichBody(input.bio, "bio").doc : existing.bio;
    const [updated] = await tx
      .update(specialists)
      .set({
        name: input.name.trim(),
        roleTitle: input.roleTitle?.trim() || null,
        summary: input.summary?.trim() || null,
        bio,
        photoMediaId: input.photoMediaId ?? null,
        // `kind` (convidado × equipe) só ADMIN/EDITOR muda: não é conteúdo do próprio perfil.
        kind: isManager && input.kind ? input.kind : existing.kind,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        ogMediaId: input.ogMediaId ?? null,
        updatedBy: actor.id,
        version: existing.version + 1,
      })
      .where(eq(specialists.id, input.id))
      .returning({ id: specialists.id, slug: specialists.slug, version: specialists.version });
    if (!updated) throw new AppError("CONFLICT", "O especialista foi alterado por outra pessoa.");

    await replaceSpecialistAssociations(tx, input.id, input);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "specialist.updated",
      entityType: "specialist",
      entityId: input.id,
      requestId: input.requestId,
    });
    return updated;
  });
}

export type DeleteSpecialistInput = {
  actor: Actor | null | undefined;
  id: string;
  requestId?: string;
};

/** Só ADMIN/EDITOR, e só se ninguém tiver este especialista como autor (`posts.author_id`,
 * `ON DELETE RESTRICT`). As junções de solução/área somem em cascata. */
export async function deleteSpecialist({ db }: Deps, input: DeleteSpecialistInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "specialist:manage");
  if (await isSpecialistReferenced(db, input.id)) {
    throw new AppError("DOMAIN_RULE", "Este especialista tem artigos e não pode ser excluído.");
  }
  await db.transaction(async (tx) => {
    if (await isSpecialistReferenced(tx, input.id)) {
      throw new AppError("DOMAIN_RULE", "Este especialista tem artigos e não pode ser excluído.");
    }
    const [row] = await tx
      .delete(specialists)
      .where(eq(specialists.id, input.id))
      .returning({ id: specialists.id });
    if (!row) throw new AppError("NOT_FOUND", "Especialista inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "specialist.deleted",
      entityType: "specialist",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export async function getSpecialistForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
  id: string,
): Promise<SpecialistForEdit> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const found = await findSpecialistForEdit(db, id);
  if (!found) throw new AppError("NOT_FOUND", "Especialista inexistente.");
  assertCanEditContent(actor, found.specialist.userId);
  return found;
}

export async function listSpecialistsForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  options: { page?: number } = {},
): Promise<SpecialistPage<SpecialistSummaryForAdmin>> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "specialist:manage");
  return listSpecialistsForAdminPaged(db, options);
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const createSpecialistForRoute = (input: CreateSpecialistInput) =>
  createSpecialist({ db: getDb() }, input);
export const updateSpecialistForRoute = (input: UpdateSpecialistInput) =>
  updateSpecialist({ db: getDb() }, input);
export const deleteSpecialistForRoute = (input: DeleteSpecialistInput) =>
  deleteSpecialist({ db: getDb() }, input);
export const getSpecialistForEditForRoute = (actor: Actor | null | undefined, id: string) =>
  getSpecialistForEdit({ db: getDb() }, actor, id);
export const listSpecialistsForAdminForRoute = (
  actor: Actor | null | undefined,
  options?: { page?: number },
) => listSpecialistsForAdmin({ db: getDb() }, actor, options);

import { getStorage } from "@/server/storage";
import { loadMediaInfo } from "../infrastructure/specialist-repository";

/** URL e texto alternativo da foto, para a pré-visualização no formulário de edição. */
export async function getSpecialistPhotoForRoute(
  mediaId: string,
): Promise<{ url: string; alt: string } | null> {
  const info = await loadMediaInfo(getDb(), mediaId);
  if (!info) return null;
  return { url: getStorage().publicUrl(info.storageKey), alt: info.altText ?? "" };
}
