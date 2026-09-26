"use server";

import { redirect } from "next/navigation";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  confirmNewsletterForRoute,
  subscribeNewsletterForRoute,
  unsubscribeNewsletterForRoute,
} from "@/features/conversion/application/newsletter";
import { getClientIp } from "@/server/security/ip-hash";

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

/** Inscrição (docs/01 §23): nome, e-mail e consentimento. A resposta é sempre a mesma para não
 * revelar se o e-mail já estava na lista. */
export async function subscribeNewsletterAction(
  _prevState: ActionResult<{ ok: true }> | null,
  formData: FormData,
): Promise<ActionResult<{ ok: true }>> {
  try {
    await subscribeNewsletterForRoute({
      name: str(formData, "name") || undefined,
      email: str(formData, "email"),
      consent: str(formData, "consent") === "on",
      honeypot: str(formData, "empresa_confirmacao"),
      formToken: str(formData, "formToken"),
      ip: await getClientIp(),
      source: str(formData, "source").slice(0, 100) || undefined,
    });
    return ok({ ok: true });
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function confirmNewsletterAction(formData: FormData): Promise<void> {
  let status: "sucesso" | "erro" = "sucesso";
  try {
    await confirmNewsletterForRoute(str(formData, "token"));
  } catch {
    status = "erro";
  }
  // `redirect` fora do try: ele funciona lançando uma exceção, que o catch engoliria.
  redirect(`/newsletter/confirmacao?status=${status}`);
}

export async function unsubscribeNewsletterAction(formData: FormData): Promise<void> {
  let status: "sucesso" | "erro" = "sucesso";
  try {
    await unsubscribeNewsletterForRoute(str(formData, "token"));
  } catch {
    status = "erro";
  }
  redirect(`/newsletter/descadastro?status=${status}`);
}
