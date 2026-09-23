import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import { socialSchema } from "../domain/settings-schema";
import {
  getSiteSettings,
  upsertSiteSettings,
  type SiteSettingsRow,
} from "../infrastructure/settings-repository";

/**
 * Dados reais da DM (linha única, docs/03 parte 7): endereço, contato, redes. Todo campo é
 * anulável até a DM fornecer — nulo aqui é "esta seção some da tela pública", não um erro. Só
 * ADMIN (`settings:manage`).
 */
type Deps = { db: Database };

const LIMITS = { legalName: 160, cnpj: 20, address: 300, phone: 30, email: 254, whatsapp: 30 };

function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

export type UpdateSettingsInput = {
  actor: Actor | null | undefined;
  legalName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  social: Record<string, unknown>;
  requestId?: string;
};

export async function updateSettings(
  { db }: Deps,
  input: UpdateSettingsInput,
): Promise<SiteSettingsRow> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "settings:manage");

  const fieldErrors: Record<string, string[]> = {};
  if (input.legalName.length > LIMITS.legalName) {
    fieldErrors.legalName = [`No máximo ${LIMITS.legalName} caracteres.`];
  }
  if (input.cnpj.length > LIMITS.cnpj) fieldErrors.cnpj = [`No máximo ${LIMITS.cnpj} caracteres.`];
  if (input.address.length > LIMITS.address) {
    fieldErrors.address = [`No máximo ${LIMITS.address} caracteres.`];
  }
  if (input.phone.length > LIMITS.phone)
    fieldErrors.phone = [`No máximo ${LIMITS.phone} caracteres.`];
  if (input.email.trim() !== "" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(input.email.trim())) {
    fieldErrors.email = ["E-mail inválido."];
  }
  if (input.email.length > LIMITS.email)
    fieldErrors.email = [`No máximo ${LIMITS.email} caracteres.`];
  if (input.whatsapp.length > LIMITS.whatsapp) {
    fieldErrors.whatsapp = [`No máximo ${LIMITS.whatsapp} caracteres.`];
  }

  const socialParsed = socialSchema.safeParse(input.social);
  if (!socialParsed.success) {
    fieldErrors.social = ["Uma ou mais URLs de rede social são inválidas."];
  }

  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
  }

  return db.transaction(async (tx) => {
    const row = await upsertSiteSettings(tx, {
      legalName: emptyToNull(input.legalName),
      cnpj: emptyToNull(input.cnpj),
      address: emptyToNull(input.address),
      phone: emptyToNull(input.phone),
      email: emptyToNull(input.email),
      whatsapp: emptyToNull(input.whatsapp),
      social: socialParsed.success ? socialParsed.data : {},
      updatedBy: actor.id,
    });

    await recordAudit(tx, {
      actorId: actor.id,
      action: "settings.updated",
      entityType: "site_settings",
      entityId: "1",
      requestId: input.requestId,
    });

    return row;
  });
}

/** Leitura pública (rodapé, JSON-LD): sem sessão, sem checagem de permissão — é a mesma
 * informação institucional que qualquer visitante já vê no rodapé. */
export async function getPublicSettings({ db }: Deps): Promise<SiteSettingsRow | null> {
  return getSiteSettings(db);
}

export async function getSettingsForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<SiteSettingsRow | null> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "settings:manage");
  return getSiteSettings(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { cacheLife, cacheTag } from "next/cache";

export const updateSettingsForRoute = (input: UpdateSettingsInput) =>
  updateSettings({ db: getDb() }, input);
export const getSettingsForEditForRoute = (actor: Actor | null | undefined) =>
  getSettingsForEdit({ db: getDb() }, actor);

export async function getPublicSettingsForRoute() {
  "use cache";
  cacheTag("site-settings");
  cacheLife("max");
  return getPublicSettings({ db: getDb() });
}
