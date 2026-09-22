"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import { updateSettingsForRoute } from "@/features/settings/application/settings-crud";
import { SOCIAL_PLATFORMS } from "@/features/settings/domain/settings-schema";
import { requireAdminSession } from "@/server/auth/admin-guard";

export type SettingsMutated = { id: number };

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function readSocial(formData: FormData): Record<string, unknown> {
  const social: Record<string, unknown> = {};
  for (const platform of SOCIAL_PLATFORMS) {
    const value = str(formData, `social_${platform}`);
    if (value !== "") social[platform] = value;
  }
  return social;
}

export async function updateSettingsAction(
  _prevState: ActionResult<SettingsMutated> | null,
  formData: FormData,
): Promise<ActionResult<SettingsMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const row = await updateSettingsForRoute({
      actor,
      legalName: str(formData, "legalName"),
      cnpj: str(formData, "cnpj"),
      address: str(formData, "address"),
      phone: str(formData, "phone"),
      email: str(formData, "email"),
      whatsapp: str(formData, "whatsapp"),
      social: readSocial(formData),
    });
    revalidatePath("/admin/configuracoes");
    revalidateTag("site-settings", "max");
    return ok({ id: row.id });
  } catch (error) {
    return fail(toActionError(error));
  }
}
