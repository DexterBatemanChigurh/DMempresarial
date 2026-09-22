"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createCategoryForRoute,
  createTagForRoute,
  deleteCategoryForRoute,
  deleteTagForRoute,
  mergeCategoriesForRoute,
  mergeTagsForRoute,
  updateCategoryForRoute,
} from "@/features/taxonomy/application/taxonomy-service";
import { requireAdminSession } from "@/server/auth/admin-guard";

/**
 * Server Actions de categorias e tags (docs/03, parte 7.3). Mesma convenção de `artigos/actions.ts`
 * e `midia/actions.ts`: cada uma revalida sessão e permissão no servidor.
 */
function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function optionalStr(formData: FormData, name: string): string | undefined {
  const value = str(formData, name);
  return value === "" ? undefined : value;
}

export async function createCategoryAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const row = await createCategoryForRoute({
      actor,
      name: str(formData, "name"),
      slug: optionalStr(formData, "slug"),
      description: optionalStr(formData, "description") ?? null,
    });
    revalidatePath("/admin/categorias");
    return ok(row);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function updateCategoryAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    await updateCategoryForRoute({
      actor,
      id,
      name: str(formData, "name"),
      description: optionalStr(formData, "description") ?? null,
    });
    revalidatePath("/admin/categorias");
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteCategoryAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    await deleteCategoryForRoute({ actor, id });
    revalidatePath("/admin/categorias");
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function mergeCategoriesAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const fromId = str(formData, "fromId");
    await mergeCategoriesForRoute({ actor, fromId, toId: str(formData, "toId") });
    revalidatePath("/admin/categorias");
    return ok({ id: fromId });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function createTagAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const row = await createTagForRoute({
      actor,
      name: str(formData, "name"),
      slug: optionalStr(formData, "slug"),
    });
    revalidatePath("/admin/categorias");
    return ok(row);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteTagAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    await deleteTagForRoute({ actor, id });
    revalidatePath("/admin/categorias");
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function mergeTagsAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const fromId = str(formData, "fromId");
    await mergeTagsForRoute({ actor, fromId, toId: str(formData, "toId") });
    revalidatePath("/admin/categorias");
    return ok({ id: fromId });
  } catch (error) {
    return fail(toActionError(error));
  }
}
