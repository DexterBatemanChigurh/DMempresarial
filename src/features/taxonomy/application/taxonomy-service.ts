import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { categories, tags } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import {
  isCategoryReferenced,
  isTagReferenced,
  listCategoriesForAdmin as listCategoriesForAdminQuery,
  listTagsForAdmin as listTagsForAdminQuery,
  mergeCategories as mergeCategoriesQuery,
  mergeTags as mergeTagsQuery,
  type CategoryForAdmin,
  type TagForAdmin,
} from "../infrastructure/taxonomy-repository";

/**
 * Categorias e tags (docs/03, parte 7.3): ADMIN e EDITOR gerenciam (`taxonomy:manage`); AUTHOR
 * não. Apagar é bloqueado se estiver em uso; mesclar move o uso e apaga a origem.
 */
type Deps = { db: Database };

const NAME_LIMIT = { category: 80, tag: 60 } as const;
const DESCRIPTION_LIMIT = 300;

function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && (current as { code?: unknown }).code === "23505")
      return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

function resolveSlug(name: string, slug: string | undefined): string {
  const candidate = slug?.trim() || slugify(name);
  if (!isValidSlug(candidate)) {
    throw new AppError("VALIDATION", "Slug inválido.", {
      fieldErrors: { slug: ["Use minúsculas, números e hífens (até 80 caracteres)."] },
    });
  }
  if (isReservedSlug(candidate)) {
    throw new AppError("VALIDATION", "Slug reservado.", {
      fieldErrors: { slug: ["Este endereço é reservado pelo site."] },
    });
  }
  return candidate;
}

function assertName(name: string, kind: keyof typeof NAME_LIMIT): void {
  const limit = NAME_LIMIT[kind];
  if (name.trim() === "") {
    throw new AppError("VALIDATION", "Nome obrigatório.", {
      fieldErrors: { name: ["Nome obrigatório."] },
    });
  }
  if (name.length > limit) {
    throw new AppError("VALIDATION", "Nome muito longo.", {
      fieldErrors: { name: [`No máximo ${limit} caracteres.`] },
    });
  }
}

// -----------------------------------------------------------------------------------------------
// Categorias
// -----------------------------------------------------------------------------------------------

export type CategoryInput = {
  actor: Actor | null | undefined;
  name: string;
  slug?: string;
  description?: string | null;
  requestId?: string;
};

export async function createCategory({ db }: Deps, input: CategoryInput): Promise<{ id: string }> {
  if (!input.actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(input.actor, "taxonomy:manage");
  assertName(input.name, "category");
  if ((input.description?.length ?? 0) > DESCRIPTION_LIMIT) {
    throw new AppError("VALIDATION", "Descrição muito longa.", {
      fieldErrors: { description: [`No máximo ${DESCRIPTION_LIMIT} caracteres.`] },
    });
  }
  const slug = resolveSlug(input.name, input.slug);
  const actor = input.actor;

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(categories)
        .values({ slug, name: input.name.trim(), description: input.description?.trim() || null })
        .returning({ id: categories.id });
      if (!row) throw new Error("Falha ao gravar a categoria.");
      await recordAudit(tx, {
        actorId: actor.id,
        action: "category.created",
        entityType: "category",
        entityId: row.id,
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe uma categoria com este endereço."] },
      });
    }
    throw error;
  }
}

export type UpdateCategoryInput = CategoryInput & { id: string };

export async function updateCategory({ db }: Deps, input: UpdateCategoryInput): Promise<void> {
  if (!input.actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(input.actor, "taxonomy:manage");
  assertName(input.name, "category");
  if ((input.description?.length ?? 0) > DESCRIPTION_LIMIT) {
    throw new AppError("VALIDATION", "Descrição muito longa.", {
      fieldErrors: { description: [`No máximo ${DESCRIPTION_LIMIT} caracteres.`] },
    });
  }
  const actor = input.actor;
  try {
    await db.transaction(async (tx) => {
      const [row] = await tx
        .update(categories)
        .set({ name: input.name.trim(), description: input.description?.trim() || null })
        .where(eq(categories.id, input.id))
        .returning({ id: categories.id });
      if (!row) throw new AppError("NOT_FOUND", "Categoria inexistente.");
      await recordAudit(tx, {
        actorId: actor.id,
        action: "category.updated",
        entityType: "category",
        entityId: input.id,
        requestId: input.requestId,
      });
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe uma categoria com este endereço."] },
      });
    }
    throw error;
  }
}

export type DeleteCategoryInput = {
  actor: Actor | null | undefined;
  id: string;
  requestId?: string;
};

export async function deleteCategory({ db }: Deps, input: DeleteCategoryInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  if (await isCategoryReferenced(db, input.id)) {
    throw new AppError("DOMAIN_RULE", "Esta categoria está em uso e não pode ser excluída.");
  }
  await db.transaction(async (tx) => {
    // Confere de novo DENTRO da transação: fecha a janela entre a checagem acima e a exclusão.
    if (await isCategoryReferenced(tx, input.id)) {
      throw new AppError("DOMAIN_RULE", "Esta categoria está em uso e não pode ser excluída.");
    }
    const [row] = await tx
      .delete(categories)
      .where(eq(categories.id, input.id))
      .returning({ id: categories.id });
    if (!row) throw new AppError("NOT_FOUND", "Categoria inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "category.deleted",
      entityType: "category",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export type MergeCategoriesInput = {
  actor: Actor | null | undefined;
  fromId: string;
  toId: string;
  requestId?: string;
};

export async function mergeCategoriesService(
  { db }: Deps,
  input: MergeCategoriesInput,
): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  if (input.fromId === input.toId) {
    throw new AppError("VALIDATION", "Escolha duas categorias diferentes.", {
      fieldErrors: { toId: ["Escolha uma categoria diferente da origem."] },
    });
  }
  await db.transaction(async (tx) => {
    await mergeCategoriesQuery(tx, input.fromId, input.toId);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "category.merged",
      entityType: "category",
      entityId: input.toId,
      metadata: { from: input.fromId },
      requestId: input.requestId,
    });
  });
}

export async function listCategoriesForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<CategoryForAdmin[]> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  return listCategoriesForAdminQuery(db);
}

// -----------------------------------------------------------------------------------------------
// Tags
// -----------------------------------------------------------------------------------------------

export type TagInput = {
  actor: Actor | null | undefined;
  name: string;
  slug?: string;
  requestId?: string;
};

export async function createTag({ db }: Deps, input: TagInput): Promise<{ id: string }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  assertName(input.name, "tag");
  const slug = resolveSlug(input.name, input.slug);
  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(tags)
        .values({ slug, name: input.name.trim() })
        .returning({ id: tags.id });
      if (!row) throw new Error("Falha ao gravar a tag.");
      await recordAudit(tx, {
        actorId: actor.id,
        action: "tag.created",
        entityType: "tag",
        entityId: row.id,
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe uma tag com este endereço."] },
      });
    }
    throw error;
  }
}

export type DeleteTagInput = { actor: Actor | null | undefined; id: string; requestId?: string };

export async function deleteTag({ db }: Deps, input: DeleteTagInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  if (await isTagReferenced(db, input.id)) {
    throw new AppError("DOMAIN_RULE", "Esta tag está em uso e não pode ser excluída.");
  }
  await db.transaction(async (tx) => {
    if (await isTagReferenced(tx, input.id)) {
      throw new AppError("DOMAIN_RULE", "Esta tag está em uso e não pode ser excluída.");
    }
    const [row] = await tx.delete(tags).where(eq(tags.id, input.id)).returning({ id: tags.id });
    if (!row) throw new AppError("NOT_FOUND", "Tag inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "tag.deleted",
      entityType: "tag",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export type MergeTagsInput = {
  actor: Actor | null | undefined;
  fromId: string;
  toId: string;
  requestId?: string;
};

export async function mergeTagsService({ db }: Deps, input: MergeTagsInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  if (input.fromId === input.toId) {
    throw new AppError("VALIDATION", "Escolha duas tags diferentes.", {
      fieldErrors: { toId: ["Escolha uma tag diferente da origem."] },
    });
  }
  await db.transaction(async (tx) => {
    await mergeTagsQuery(tx, input.fromId, input.toId);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "tag.merged",
      entityType: "tag",
      entityId: input.toId,
      metadata: { from: input.fromId },
      requestId: input.requestId,
    });
  });
}

export async function listTagsForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<TagForAdmin[]> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "taxonomy:manage");
  return listTagsForAdminQuery(db);
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const createCategoryForRoute = (input: CategoryInput) =>
  createCategory({ db: getDb() }, input);
export const updateCategoryForRoute = (input: UpdateCategoryInput) =>
  updateCategory({ db: getDb() }, input);
export const deleteCategoryForRoute = (input: DeleteCategoryInput) =>
  deleteCategory({ db: getDb() }, input);
export const mergeCategoriesForRoute = (input: MergeCategoriesInput) =>
  mergeCategoriesService({ db: getDb() }, input);
export const listCategoriesForAdminForRoute = (actor: Actor | null | undefined) =>
  listCategoriesForAdmin({ db: getDb() }, actor);

export const createTagForRoute = (input: TagInput) => createTag({ db: getDb() }, input);
export const deleteTagForRoute = (input: DeleteTagInput) => deleteTag({ db: getDb() }, input);
export const mergeTagsForRoute = (input: MergeTagsInput) =>
  mergeTagsService({ db: getDb() }, input);
export const listTagsForAdminForRoute = (actor: Actor | null | undefined) =>
  listTagsForAdmin({ db: getDb() }, actor);
