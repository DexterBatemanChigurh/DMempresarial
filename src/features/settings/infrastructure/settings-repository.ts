import "server-only";
import { eq } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { siteSettings } from "@/db/schema";

export type SiteSettingsRow = typeof siteSettings.$inferSelect;

/** Linha única (id = 1). Se ainda não foi semeada, devolve null — o formulário trata como vazio. */
export async function getSiteSettings(executor: Executor): Promise<SiteSettingsRow | null> {
  const [row] = await executor.select().from(siteSettings).where(eq(siteSettings.id, 1)).limit(1);
  return row ?? null;
}

export type UpsertSiteSettingsInput = {
  legalName: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  social: Record<string, unknown>;
  updatedBy: string;
};

/** `id = 1` é fixo (checagem no banco); insere na primeira vez, atualiza depois. */
export async function upsertSiteSettings(
  executor: Executor,
  input: UpsertSiteSettingsInput,
): Promise<SiteSettingsRow> {
  const [row] = await executor
    .insert(siteSettings)
    .values({ id: 1, ...input })
    .onConflictDoUpdate({
      target: siteSettings.id,
      set: {
        legalName: input.legalName,
        cnpj: input.cnpj,
        address: input.address,
        phone: input.phone,
        email: input.email,
        whatsapp: input.whatsapp,
        social: input.social,
        updatedBy: input.updatedBy,
        updatedAt: new Date(),
      },
    })
    .returning();
  if (!row) throw new Error("Falha ao gravar as configurações.");
  return row;
}
