"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createUserForRoute,
  setDisabledForRoute,
  setRoleForRoute,
} from "@/features/users/application/user-crud";
import type { Role } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export type UserCreated = { id: string; email: string; temporaryPassword: string };

export async function createUserAction(
  _prevState: ActionResult<UserCreated> | null,
  formData: FormData,
): Promise<ActionResult<UserCreated>> {
  try {
    const { actor } = await requireAdminSession();
    const created = await createUserForRoute({
      actor,
      name: str(formData, "name"),
      email: str(formData, "email"),
      role: str(formData, "role") as Role,
    });
    revalidatePath("/admin/usuarios");
    return ok(created);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function setRoleAction(
  _prevState: ActionResult<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const userId = str(formData, "userId");
    await setRoleForRoute({ actor, userId, role: str(formData, "role") as Role });
    revalidatePath("/admin/usuarios");
    return ok({ userId });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function setDisabledAction(
  _prevState: ActionResult<{ userId: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ userId: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const userId = str(formData, "userId");
    const disabled = str(formData, "disabled") === "true";
    await setDisabledForRoute({ actor, userId, disabled });
    revalidatePath("/admin/usuarios");
    return ok({ userId });
  } catch (error) {
    return fail(toActionError(error));
  }
}
