import type { Metadata } from "next";
import { Heading, Text } from "@/components/ui";
import { getSettingsForEditForRoute } from "@/features/settings/application/settings-crud";
import { SettingsForm, type SettingsFormValues } from "@/components/admin/settings/settings-form";
import { parseSocial } from "@/features/settings/domain/settings-schema";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updateSettingsAction } from "./actions";

export const metadata: Metadata = { title: "Configurações" };

export default async function SettingsPage() {
  const { actor } = await requireAdminSession();
  const row = await getSettingsForEditForRoute(actor);

  const initial: SettingsFormValues = {
    legalName: row?.legalName ?? "",
    cnpj: row?.cnpj ?? "",
    address: row?.address ?? "",
    phone: row?.phone ?? "",
    email: row?.email ?? "",
    whatsapp: row?.whatsapp ?? "",
    social: parseSocial(row?.social),
  };

  return (
    <>
      <Heading as="h1" variant="h1">
        Configurações
      </Heading>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Dados reais da DM: o que ficar em branco some do rodapé e do JSON-LD público, não aparece
        como &ldquo;em breve&rdquo;.
      </Text>
      <SettingsForm action={updateSettingsAction} initial={initial} />
    </>
  );
}
