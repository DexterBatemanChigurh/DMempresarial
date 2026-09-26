"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createManualRedirectForRoute,
  deleteRedirectForRoute,
} from "@/features/platform/application/redirect-admin";
import { requireAdminSession } from "@/server/auth/admin-guard";

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function createRedirectAction(
  _prevState: ActionResult<{ fromPath: string; toPath: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ fromPath: string; toPath: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const created = await createManualRedirectForRoute({
      actor,
      fromPath: str(formData, "fromPath"),
      toPath: str(formData, "toPath"),
    });
    revalidatePath("/admin/redirecionamentos");
    return ok({ fromPath: created.fromPath, toPath: created.toPath });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteRedirectAction(
  _prevState: ActionResult<{ fromPath: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ fromPath: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const deleted = await deleteRedirectForRoute({ actor, id: str(formData, "id") });
    revalidatePath("/admin/redirecionamentos");
    return ok(deleted);
  } catch (error) {
    return fail(toActionError(error));
  }
}
