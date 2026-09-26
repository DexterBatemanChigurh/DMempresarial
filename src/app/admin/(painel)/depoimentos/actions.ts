"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createTestimonialForRoute,
  deleteTestimonialForRoute,
  TESTIMONIALS_TAG,
  transitionTestimonialForRoute,
  updateTestimonialForRoute,
} from "@/features/proof/application/testimonial-crud";
import type { TestimonialSource, TestimonialStatus } from "@/features/proof/domain/proof";
import { requireAdminSession } from "@/server/auth/admin-guard";

/** Server Actions dos depoimentos. Sessão e permissão revalidadas no servidor em cada uma. */
export type TestimonialMutated = { id: string; version?: number };

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readForm(formData: FormData) {
  const rating = str(formData, "rating");
  return {
    authorName: str(formData, "authorName"),
    authorDetail: str(formData, "authorDetail") || null,
    quote: str(formData, "quote"),
    rating: rating === "" ? null : Number(rating),
    source: (str(formData, "source") === "MANUAL" ? "MANUAL" : "GOOGLE") as TestimonialSource,
    givenAt: str(formData, "givenAt") || null,
    position: Number(str(formData, "position") || "0"),
  };
}

function invalidate() {
  revalidatePath("/admin/depoimentos");
  revalidatePath("/admin/depoimentos/[id]", "page");
  revalidateTag(TESTIMONIALS_TAG, "max");
}

export async function createTestimonialAction(
  _prevState: ActionResult<TestimonialMutated> | null,
  formData: FormData,
): Promise<ActionResult<TestimonialMutated>> {
  let created: { id: string };
  try {
    const { actor } = await requireAdminSession();
    created = await createTestimonialForRoute({ actor, ...readForm(formData) });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate();
  redirect(`/admin/depoimentos/${created.id}`);
}

export async function updateTestimonialAction(
  _prevState: ActionResult<TestimonialMutated> | null,
  formData: FormData,
): Promise<ActionResult<TestimonialMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const updated = await updateTestimonialForRoute({
      actor,
      id: str(formData, "id"),
      expectedVersion: Number(str(formData, "expectedVersion")),
      ...readForm(formData),
    });
    invalidate();
    return ok(updated);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function transitionTestimonialAction(
  _prevState: ActionResult<TestimonialMutated> | null,
  formData: FormData,
): Promise<ActionResult<TestimonialMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const result = await transitionTestimonialForRoute({
      actor,
      id: str(formData, "id"),
      to: str(formData, "to") as TestimonialStatus,
      expectedVersion: Number(str(formData, "expectedVersion")),
    });
    invalidate();
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteTestimonialAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    await deleteTestimonialForRoute({ actor, id: str(formData, "id") });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate();
  redirect("/admin/depoimentos");
}
