"use client";

import { useActionState } from "react";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { SettingsMutated } from "@/app/admin/(painel)/configuracoes/actions";
import { SOCIAL_PLATFORMS, type Social } from "@/features/settings/domain/settings-schema";

const SOCIAL_LABEL: Record<(typeof SOCIAL_PLATFORMS)[number], string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

export type SettingsFormValues = {
  legalName: string;
  cnpj: string;
  address: string;
  phone: string;
  email: string;
  whatsapp: string;
  social: Social;
};

type Props = {
  action: (
    prevState: ActionResult<SettingsMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<SettingsMutated>>;
  initial: SettingsFormValues;
};

/**
 * Dados reais da DM (linha única, docs/03 parte 7). Todo campo é opcional de propósito: o que
 * fica em branco some da tela pública e do JSON-LD, nunca é preenchido com placeholder.
 */
export function SettingsForm({ action, initial }: Props) {
  const [state, formAction, pending] = useActionState<
    ActionResult<SettingsMutated> | null,
    FormData
  >(action, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-xl">
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {state?.ok ? <FormMessage tone="success">Alterações salvas.</FormMessage> : null}

      <TextField
        id="legalName"
        label="Razão social"
        defaultValue={initial.legalName}
        error={fieldErrors?.legalName?.[0]}
      />
      <TextField
        id="cnpj"
        label="CNPJ"
        defaultValue={initial.cnpj}
        error={fieldErrors?.cnpj?.[0]}
      />
      <TextField
        id="address"
        label="Endereço"
        defaultValue={initial.address}
        error={fieldErrors?.address?.[0]}
      />
      <TextField
        id="phone"
        label="Telefone"
        defaultValue={initial.phone}
        error={fieldErrors?.phone?.[0]}
      />
      <TextField
        id="email"
        label="E-mail"
        type="email"
        defaultValue={initial.email}
        error={fieldErrors?.email?.[0]}
      />
      <TextField
        id="whatsapp"
        label="WhatsApp"
        defaultValue={initial.whatsapp}
        error={fieldErrors?.whatsapp?.[0]}
      />

      <fieldset className="space-y-md">
        <legend>Redes sociais</legend>
        {SOCIAL_PLATFORMS.map((platform) => (
          <TextField
            key={platform}
            id={`social_${platform}`}
            label={SOCIAL_LABEL[platform]}
            hint="URL completa, começando com https://"
            defaultValue={initial.social[platform] ?? ""}
          />
        ))}
      </fieldset>
      {fieldErrors?.social ? <FormMessage tone="error">{fieldErrors.social[0]}</FormMessage> : null}

      <Button type="submit" loading={pending}>
        Salvar configurações
      </Button>
    </form>
  );
}
