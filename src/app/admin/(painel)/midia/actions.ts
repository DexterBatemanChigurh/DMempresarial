"use server";

import { revalidatePath } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  deleteMediaForRoute,
  updateMediaForRoute,
} from "@/features/media/application/manage-media";
import { uploadMediaForRoute } from "@/features/media/application/upload-media";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { getStorage } from "@/server/storage";

/**
 * Server Actions do gerenciador de mídia. Cada uma revalida a sessão E a permissão no servidor
 * (docs/03, parte 11): o formulário no navegador é conveniência, nunca autorização.
 */
export type UploadedMedia = { id: string; url: string; width: number; height: number };

export async function uploadMediaAction(
  _prevState: ActionResult<UploadedMedia> | null,
  formData: FormData,
): Promise<ActionResult<UploadedMedia>> {
  try {
    const { actor } = await requireAdminSession();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return fail({
        code: "VALIDATION",
        message: "Selecione um arquivo.",
        fieldErrors: { file: ["Selecione um arquivo."] },
      });
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const altText = formData.get("altText");
    const caption = formData.get("caption");

    const row = await uploadMediaForRoute({
      actor,
      bytes,
      altText: typeof altText === "string" ? altText : null,
      caption: typeof caption === "string" ? caption : null,
    });
    revalidatePath("/admin/midia");
    return ok({
      id: row.id,
      url: getStorage().publicUrl(row.storageKey),
      width: row.width,
      height: row.height,
    });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function updateMediaAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = String(formData.get("id") ?? "");
    const altText = formData.get("altText");
    const caption = formData.get("caption");
    const focalXRaw = formData.get("focalX");
    const focalYRaw = formData.get("focalY");

    const row = await updateMediaForRoute({
      actor,
      id,
      altText: typeof altText === "string" ? altText : undefined,
      caption: typeof caption === "string" ? caption : undefined,
      focalX: typeof focalXRaw === "string" && focalXRaw !== "" ? Number(focalXRaw) : undefined,
      focalY: typeof focalYRaw === "string" && focalYRaw !== "" ? Number(focalYRaw) : undefined,
    });
    revalidatePath("/admin/midia");
    return ok({ id: row.id });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteMediaAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const { actor } = await requireAdminSession();
    const id = String(formData.get("id") ?? "");
    await deleteMediaForRoute({ actor, id });
    revalidatePath("/admin/midia");
    return ok({ id });
  } catch (error) {
    return fail(toActionError(error));
  }
}
