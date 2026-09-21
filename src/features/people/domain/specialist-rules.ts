import { isReservedSlug, isValidSlug } from "@/lib/slug";

/**
 * Publicar o perfil de um especialista exige o mínimo REAL: nome, cargo, foto e resumo (Blueprint
 * 1, seção 11). Formação, experiência e certificações só aparecem se a pessoa as fornecer;
 * nenhuma regra as exige nem as preenche. Autor convidado (`GUEST`) nunca tem página pública.
 */
export type SpecialistBlockerCode =
  | "GUEST_NOT_PUBLISHABLE"
  | "NAME_MISSING"
  | "SLUG_INVALID"
  | "SLUG_RESERVED"
  | "ROLE_TITLE_MISSING"
  | "PHOTO_MISSING"
  | "SUMMARY_MISSING";

export type SpecialistBlocker = { code: SpecialistBlockerCode; message: string };

export type SpecialistForPublish = {
  kind: "TEAM" | "GUEST";
  name: string;
  slug: string;
  roleTitle: string | null;
  summary: string | null;
  photoMediaId: string | null;
};

export function specialistPublishBlockers(person: SpecialistForPublish): SpecialistBlocker[] {
  const blockers: SpecialistBlocker[] = [];
  const add = (code: SpecialistBlockerCode, message: string) => blockers.push({ code, message });

  if (person.kind === "GUEST") {
    add("GUEST_NOT_PUBLISHABLE", "Autor convidado não tem página pública.");
    return blockers;
  }
  if (person.name.trim() === "") add("NAME_MISSING", "Falta o nome.");
  if (!isValidSlug(person.slug)) add("SLUG_INVALID", "O endereço (slug) é inválido.");
  else if (isReservedSlug(person.slug)) add("SLUG_RESERVED", "Este endereço (slug) é reservado.");
  if ((person.roleTitle ?? "").trim() === "") add("ROLE_TITLE_MISSING", "Falta o cargo.");
  if (!person.photoMediaId) add("PHOTO_MISSING", "Falta a foto (real, sem banco de imagens).");
  if ((person.summary ?? "").trim() === "") add("SUMMARY_MISSING", "Falta o resumo.");
  return blockers;
}
