"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createPostForRoute,
  deletePostForRoute,
  updatePostForRoute,
} from "@/features/content/application/post-crud";
import {
  changePostSlugForRoute,
  transitionPostForRoute,
} from "@/features/content/application/post-service";
import type { PostStatus } from "@/features/content/domain/post-status";
import { requireAdminSession } from "@/server/auth/admin-guard";

/**
 * Server Actions do CRUD de artigos (docs/03, parte 9). Cada uma revalida sessão e permissão no
 * servidor; o formulário no navegador é conveniência, nunca autorização (mesma convenção de
 * `midia/actions.ts`).
 */
export type PostMutated = { id: string; slug: string; version?: number };

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function optionalStr(formData: FormData, name: string): string | null {
  const value = str(formData, name);
  return value === "" ? null : value;
}

function list(formData: FormData, name: string): string[] {
  return formData.getAll(name).filter((v): v is string => typeof v === "string" && v !== "");
}

const POST_FORMATS = [
  "ANALISE",
  "LEITURA_DE_MERCADO",
  "CONCEITO_APLICADO",
  "CASO",
  "OPINIAO",
  "REGIONAL",
] as const;
type PostFormatValue = (typeof POST_FORMATS)[number];

function parsePostFormat(value: string | null): PostFormatValue | null {
  return value && (POST_FORMATS as readonly string[]).includes(value)
    ? (value as PostFormatValue)
    : null;
}

function readPostForm(formData: FormData) {
  return {
    title: str(formData, "title"),
    subtitle: optionalStr(formData, "subtitle"),
    excerpt: optionalStr(formData, "excerpt"),
    body: JSON.parse(str(formData, "body") || "null"),
    format: parsePostFormat(optionalStr(formData, "format")),
    coverMediaId: optionalStr(formData, "coverMediaId"),
    authorId: str(formData, "authorId"),
    seoTitle: optionalStr(formData, "seoTitle"),
    seoDescription: optionalStr(formData, "seoDescription"),
    ogMediaId: null,
    categoryIds: list(formData, "categoryIds"),
    primaryCategoryId: optionalStr(formData, "primaryCategoryId"),
    tagIds: list(formData, "tagIds"),
    solutionIds: list(formData, "solutionIds"),
    primarySolutionId: optionalStr(formData, "primarySolutionId"),
  };
}

function invalidate(tags: string[]) {
  revalidatePath("/admin/artigos");
  revalidatePath("/admin/artigos/[id]", "page");
  for (const tag of tags) revalidateTag(tag, "max");
}

export async function createPostAction(
  _prevState: ActionResult<PostMutated> | null,
  formData: FormData,
): Promise<ActionResult<PostMutated>> {
  let created: { id: string; slug: string };
  try {
    const { actor } = await requireAdminSession();
    created = await createPostForRoute({
      actor,
      slug: optionalStr(formData, "slug") ?? undefined,
      ...readPostForm(formData),
    });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["posts"]);
  redirect(`/admin/artigos/${created.id}`);
}

export async function updatePostAction(
  _prevState: ActionResult<PostMutated> | null,
  formData: FormData,
): Promise<ActionResult<PostMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const postId = str(formData, "postId");
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const updated = await updatePostForRoute({
      actor,
      postId,
      expectedVersion,
      ...readPostForm(formData),
    });
    invalidate([`post:${updated.slug}`, "posts"]);
    return ok(updated);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deletePostAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let postId: string;
  try {
    const { actor } = await requireAdminSession();
    postId = str(formData, "postId");
    await deletePostForRoute({ actor, postId });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["posts"]);
  redirect("/admin/artigos");
}

export async function transitionPostAction(
  _prevState: ActionResult<PostMutated> | null,
  formData: FormData,
): Promise<ActionResult<PostMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const postId = str(formData, "postId");
    const to = str(formData, "to") as PostStatus;
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const scheduledForRaw = optionalStr(formData, "scheduledFor");
    const result = await transitionPostForRoute({
      actor,
      postId,
      to,
      expectedVersion,
      scheduledFor: scheduledForRaw ? new Date(scheduledForRaw) : null,
    });
    invalidate(result.invalidateTags);
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function changePostSlugAction(
  _prevState: ActionResult<PostMutated> | null,
  formData: FormData,
): Promise<ActionResult<PostMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const postId = str(formData, "postId");
    const newSlug = str(formData, "newSlug");
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const result = await changePostSlugForRoute({ actor, postId, newSlug, expectedVersion });
    invalidate(result.invalidateTags);
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}
