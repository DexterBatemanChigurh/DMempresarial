"use server";

import { redirect } from "next/navigation";
import { toActionError } from "@/lib/errors";
import { fail, type ActionResult } from "@/lib/result";
import { submitLeadForRoute } from "@/features/conversion/application/submit-lead";
import { getClientIp } from "@/server/security/ip-hash";

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

export async function submitLeadAction(
  _prevState: ActionResult<{ ok: true }> | null,
  formData: FormData,
): Promise<ActionResult<{ ok: true }>> {
  try {
    await submitLeadForRoute({
      name: str(formData, "name"),
      email: str(formData, "email"),
      message: str(formData, "message"),
      phone: str(formData, "phone") || undefined,
      company: str(formData, "company") || undefined,
      jobTitle: str(formData, "jobTitle") || undefined,
      segment: str(formData, "segment") || undefined,
      website: str(formData, "website") || undefined,
      consent: str(formData, "consent") === "on",
      // Campo isca: qualquer nome plausível de verdade, nunca mostrado a gente (escondido por CSS).
      honeypot: str(formData, "empresa_confirmacao"),
      formToken: str(formData, "formToken"),
      ip: await getClientIp(),
    });
  } catch (error) {
    return fail(toActionError(error));
  }
  redirect("/contato/obrigado");
}
