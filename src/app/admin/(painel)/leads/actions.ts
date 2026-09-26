"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  eraseLeadForRoute,
  eraseSubscriberForRoute,
  parseLeadStatus,
  transitionLeadForRoute,
} from "@/features/conversion/application/conversion-admin";
import { requireAdminSession } from "@/server/auth/admin-guard";

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function transitionLeadAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    const from = parseLeadStatus(str(formData, "from"));
    const to = parseLeadStatus(str(formData, "to"));
    if (!from || !to) return fail({ code: "VALIDATION", message: "Estado inválido." });
    await transitionLeadForRoute({ actor, id, from, to });
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${id}`);
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function eraseLeadAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    await eraseLeadForRoute({ actor, id: str(formData, "id") });
  } catch (error) {
    return fail(toActionError(error));
  }
  revalidatePath("/admin/leads");
  redirect("/admin/leads");
}

export async function eraseSubscriberAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    await eraseSubscriberForRoute({ actor, id });
    revalidatePath("/admin/newsletter");
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}
