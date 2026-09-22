import "server-only";
import { and, eq } from "drizzle-orm";
import type { Database, Transaction } from "@/db/client";
import { postCategories, postSolutions, postTags, posts, type postFormat } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug, slugify } from "@/lib/slug";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import type { PostStatus } from "../domain/post-status";
import {
  boundedPaging,
  findPostForEdit,
  loadMediaInfo,
  listPostsForAdmin as listPostsForAdminQuery,
  type Page,
  type PostForEdit,
  type PostSummaryForAdmin,
} from "../infrastructure/post-repository";
import { prepareRichBody } from "./rich-body";

/**
 * CRUD de artigo (docs/03, parte 9), separado de `post-service.ts`: aqui só se edita METADADOS e
 * conteúdo (título, corpo, associações). Estado (`status`, datas) muda só por `transitionPost`;
 * endereço (`slug`) muda só por `changePostSlug` (ela cuida do redirecionamento). Nenhuma das
 * funções abaixo toca essas colunas.
 */
type Deps = { db: Database };

const LIMITS = { title: 200, subtitle: 300, excerpt: 400, seoTitle: 70, seoDescription: 160 };

type PostFormat = (typeof postFormat.enumValues)[number];

export type PostFormInput = {
  actor: Actor | null | undefined;
  title: string;
  subtitle?: string | null;
  excerpt?: string | null;
  body: unknown;
  format?: PostFormat | null;
  coverMediaId?: string | null;
  authorId: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogMediaId?: string | null;
  categoryIds: string[];
  primaryCategoryId?: string | null;
  tagIds: string[];
  solutionIds: string[];
  primarySolutionId?: string | null;
  requestId?: string;
};

function validateFields(input: PostFormInput): void {
  const fieldErrors: Record<string, string[]> = {};
  const addIfTooLong = (field: keyof typeof LIMITS, value: string | null | undefined) => {
    if ((value?.length ?? 0) > LIMITS[field]) {
      fieldErrors[field] = [`No máximo ${LIMITS[field]} caracteres.`];
    }
  };
  if (input.title.trim() === "") fieldErrors.title = ["Título obrigatório."];
  addIfTooLong("title", input.title);
  addIfTooLong("subtitle", input.subtitle);
  addIfTooLong("excerpt", input.excerpt);
  addIfTooLong("seoTitle", input.seoTitle);
  addIfTooLong("seoDescription", input.seoDescription);
  if (input.primaryCategoryId && !input.categoryIds.includes(input.primaryCategoryId)) {
    fieldErrors.primaryCategoryId = ["A categoria principal precisa estar entre as escolhidas."];
  }
  if (input.primarySolutionId && !input.solutionIds.includes(input.primarySolutionId)) {
    fieldErrors.primarySolutionId = ["A solução principal precisa estar entre as escolhidas."];
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos do artigo.", { fieldErrors });
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

/** Grava as associações (categorias, tags, soluções): apaga tudo e reinsere o conjunto novo. */
async function replaceAssociations(
  tx: Transaction,
  postId: string,
  input: Pick<
    PostFormInput,
    "categoryIds" | "primaryCategoryId" | "tagIds" | "solutionIds" | "primarySolutionId"
  >,
): Promise<void> {
  await tx.delete(postCategories).where(eq(postCategories.postId, postId));
  await tx.delete(postTags).where(eq(postTags.postId, postId));
  await tx.delete(postSolutions).where(eq(postSolutions.postId, postId));

  const categoryIds = [...new Set(input.categoryIds)];
  const tagIds = [...new Set(input.tagIds)];
  const solutionIds = [...new Set(input.solutionIds)];

  if (categoryIds.length > 0) {
    await tx.insert(postCategories).values(
      categoryIds.map((categoryId) => ({
        postId,
        categoryId,
        isPrimary: categoryId === input.primaryCategoryId,
      })),
    );
  }
  if (tagIds.length > 0) {
    await tx.insert(postTags).values(tagIds.map((tagId) => ({ postId, tagId })));
  }
  if (solutionIds.length > 0) {
    await tx.insert(postSolutions).values(
      solutionIds.map((solutionId) => ({
        postId,
        solutionId,
        isPrimary: solutionId === input.primarySolutionId,
      })),
    );
  }
}

export type CreatePostInput = PostFormInput & { slug?: string };

export async function createPost(
  { db }: Deps,
  input: CreatePostInput,
): Promise<{ id: string; slug: string }> {
  const { actor } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "post:create");
  validateFields(input);

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

  const prepared = prepareRichBody(input.body);

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(posts)
        .values({
          slug,
          title: input.title.trim(),
          subtitle: input.subtitle?.trim() || null,
          excerpt: input.excerpt?.trim() || null,
          body: prepared.doc,
          bodyText: prepared.text,
          readingMinutes: prepared.readingMinutes,
          format: input.format ?? null,
          coverMediaId: input.coverMediaId ?? null,
          authorId: input.authorId,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          ogMediaId: input.ogMediaId ?? null,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({ id: posts.id, slug: posts.slug });
      if (!row) throw new Error("Falha ao gravar o artigo.");

      await replaceAssociations(tx, row.id, input);
      await recordAudit(tx, {
        actorId: actor.id,
        action: "post.created",
        entityType: "post",
        entityId: row.id,
        metadata: {},
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Slug já em uso.", {
        fieldErrors: { slug: ["Já existe um artigo com este endereço."] },
      });
    }
    throw error;
  }
}

export type UpdatePostInput = PostFormInput & { postId: string; expectedVersion: number };

export async function updatePost(
  { db }: Deps,
  input: UpdatePostInput,
): Promise<{ id: string; slug: string; version: number }> {
  const { actor, postId } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  validateFields(input);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Artigo inexistente.");

    const hideExistence = actor.role === "AUTHOR" && existing.createdBy !== actor.id;
    assertCan(
      actor,
      "post:edit",
      {
        ownerId: existing.createdBy,
        status: existing.status as PostStatus,
        hasBeenPublished: existing.firstPublishedAt !== null,
      },
      { hideExistence },
    );
    if (existing.version !== input.expectedVersion) {
      throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");
    }

    const prepared = prepareRichBody(input.body);
    const [updated] = await tx
      .update(posts)
      .set({
        title: input.title.trim(),
        subtitle: input.subtitle?.trim() || null,
        excerpt: input.excerpt?.trim() || null,
        body: prepared.doc,
        bodyText: prepared.text,
        readingMinutes: prepared.readingMinutes,
        format: input.format ?? null,
        coverMediaId: input.coverMediaId ?? null,
        authorId: input.authorId,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        ogMediaId: input.ogMediaId ?? null,
        updatedBy: actor.id,
        version: existing.version + 1,
      })
      .where(and(eq(posts.id, postId), eq(posts.version, input.expectedVersion)))
      .returning({ id: posts.id, slug: posts.slug, version: posts.version });
    if (!updated) throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");

    await replaceAssociations(tx, postId, input);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "post.updated",
      entityType: "post",
      entityId: postId,
      metadata: {},
      requestId: input.requestId,
    });
    return updated;
  });
}

export type DeletePostInput = {
  actor: Actor | null | undefined;
  postId: string;
  requestId?: string;
};

/** Exclusão definitiva: só rascunho NUNCA publicado (a regra vive em `deletableDraft`, em
 * `server/permissions`). Junções (categorias/tags/soluções) somem em cascata (FK `ON DELETE
 * CASCADE`); a mídia referenciada não é apagada. */
export async function deletePost({ db }: Deps, input: DeletePostInput): Promise<void> {
  const { actor, postId } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(posts)
      .where(eq(posts.id, postId))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Artigo inexistente.");

    const hideExistence = actor.role === "AUTHOR" && existing.createdBy !== actor.id;
    assertCan(
      actor,
      "post:delete-draft",
      {
        ownerId: existing.createdBy,
        status: existing.status as PostStatus,
        hasBeenPublished: existing.firstPublishedAt !== null,
      },
      { hideExistence },
    );

    await tx.delete(posts).where(eq(posts.id, postId));
    await recordAudit(tx, {
      actorId: actor.id,
      action: "post.deleted",
      entityType: "post",
      entityId: postId,
      metadata: {},
      requestId: input.requestId,
    });
  });
}

/** Para a tela de edição. `NOT_FOUND` também quando um AUTHOR olha o artigo de outra pessoa
 * (não revela existência); FORBIDDEN se é o dono mas o artigo já saiu do rascunho (`post:edit`
 * só permite AUTHOR em DRAFT — depois disso, só ADMIN/EDITOR editam). */
export async function getPostForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
  postId: string,
): Promise<PostForEdit> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const found = await findPostForEdit(db, postId);
  if (!found) throw new AppError("NOT_FOUND", "Artigo inexistente.");

  const hideExistence = actor.role === "AUTHOR" && found.post.createdBy !== actor.id;
  assertCan(
    actor,
    "post:edit",
    {
      ownerId: found.post.createdBy,
      status: found.post.status as PostStatus,
      hasBeenPublished: found.post.firstPublishedAt !== null,
    },
    { hideExistence },
  );
  return found;
}

export async function listPostsForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  options: { page?: number; status?: PostStatus } = {},
): Promise<Page<PostSummaryForAdmin>> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const { page } = boundedPaging(options.page ?? 1, 20);
  return listPostsForAdminQuery(db, {
    page,
    ownerId: actor.role === "AUTHOR" ? actor.id : undefined,
    status: options.status,
  });
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export function createPostForRoute(input: CreatePostInput): Promise<{ id: string; slug: string }> {
  return createPost({ db: getDb() }, input);
}

export function updatePostForRoute(
  input: UpdatePostInput,
): Promise<{ id: string; slug: string; version: number }> {
  return updatePost({ db: getDb() }, input);
}

export function deletePostForRoute(input: DeletePostInput): Promise<void> {
  return deletePost({ db: getDb() }, input);
}

export function getPostForEditForRoute(
  actor: Actor | null | undefined,
  postId: string,
): Promise<PostForEdit> {
  return getPostForEdit({ db: getDb() }, actor, postId);
}

export function listPostsForAdminForRoute(
  actor: Actor | null | undefined,
  options?: { page?: number; status?: PostStatus },
): Promise<Page<PostSummaryForAdmin>> {
  return listPostsForAdmin({ db: getDb() }, actor, options);
}

import { getStorage } from "@/server/storage";

/** URL e texto alternativo da imagem de capa, para a pré-visualização no formulário de edição. */
export async function getPostCoverForRoute(
  mediaId: string,
): Promise<{ url: string; alt: string } | null> {
  const info = await loadMediaInfo(getDb(), mediaId);
  if (!info) return null;
  return { url: getStorage().publicUrl(info.storageKey), alt: info.altText ?? "" };
}
