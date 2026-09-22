"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createSpecialistForRoute,
  deleteSpecialistForRoute,
  updateSpecialistForRoute,
} from "@/features/people/application/specialist-crud";
import {
  transitionSpecialistForRoute,
  type SpecialistStatus,
} from "@/features/people/application/specialist-service";
import { requireAdminSession } from "@/server/auth/admin-guard";

/**
 * Server Actions do CRUD de especialistas (docs/03, parte 9). Mesma convenção de
 * `artigos/actions.ts`: cada uma revalida sessão e permissão no servidor.
 */
export type SpecialistMutated = { id: string; slug: string; version?: number };

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

function readSpecialistForm(formData: FormData) {
  const kindRaw = str(formData, "kind");
  return {
    name: str(formData, "name"),
    roleTitle: optionalStr(formData, "roleTitle"),
    summary: optionalStr(formData, "summary"),
    bio: JSON.parse(str(formData, "bio") || "null"),
    photoMediaId: optionalStr(formData, "photoMediaId"),
    kind: kindRaw === "GUEST" ? ("GUEST" as const) : ("TEAM" as const),
    seoTitle: optionalStr(formData, "seoTitle"),
    seoDescription: optionalStr(formData, "seoDescription"),
    ogMediaId: null,
    solutionIds: list(formData, "solutionIds"),
    categoryIds: list(formData, "categoryIds"),
  };
}

function invalidate(tags: string[]) {
  revalidatePath("/admin/especialistas");
  revalidatePath("/admin/especialistas/[id]", "page");
  for (const tag of tags) revalidateTag(tag, "max");
}

export async function createSpecialistAction(
  _prevState: ActionResult<SpecialistMutated> | null,
  formData: FormData,
): Promise<ActionResult<SpecialistMutated>> {
  let created: { id: string; slug: string };
  try {
    const { actor } = await requireAdminSession();
    created = await createSpecialistForRoute({
      actor,
      slug: optionalStr(formData, "slug") ?? undefined,
      ...readSpecialistForm(formData),
    });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["specialists"]);
  redirect(`/admin/especialistas/${created.id}`);
}

export async function updateSpecialistAction(
  _prevState: ActionResult<SpecialistMutated> | null,
  formData: FormData,
): Promise<ActionResult<SpecialistMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const updated = await updateSpecialistForRoute({
      actor,
      id,
      expectedVersion,
      ...readSpecialistForm(formData),
    });
    invalidate([`specialist:${updated.slug}`, "specialists"]);
    return ok(updated);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteSpecialistAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let id: string;
  try {
    const { actor } = await requireAdminSession();
    id = str(formData, "id");
    await deleteSpecialistForRoute({ actor, id });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["specialists"]);
  redirect("/admin/especialistas");
}

export async function transitionSpecialistAction(
  _prevState: ActionResult<SpecialistMutated> | null,
  formData: FormData,
): Promise<ActionResult<SpecialistMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const specialistId = str(formData, "specialistId");
    const to = str(formData, "to") as SpecialistStatus;
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const result = await transitionSpecialistForRoute({ actor, specialistId, to, expectedVersion });
    invalidate(result.invalidateTags);
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}
