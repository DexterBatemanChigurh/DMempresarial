"use client";

import { useActionState } from "react";
import { Button, FormMessage, SelectField, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { UserCreated } from "@/app/admin/(painel)/usuarios/actions";

type Props = {
  action: (
    prevState: ActionResult<UserCreated> | null,
    formData: FormData,
  ) => Promise<ActionResult<UserCreated>>;
};

/** Sem senha padrão: a temporária só aparece nesta tela, uma única vez, logo após criar. */
export function CreateUserForm({ action }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult<UserCreated> | null, FormData>(
    action,
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <div className="space-y-md">
      <h2>Criar usuário</h2>
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {state?.ok ? (
        <FormMessage tone="success">
          Conta criada para {state.data.email}. Senha temporária (mostrada só agora, copie e repasse
          com segurança): <strong>{state.data.temporaryPassword}</strong>
        </FormMessage>
      ) : null}
      <form action={formAction} className="space-y-md">
        <TextField
          id="name"
          label="Nome"
          required
          autoComplete="off"
          error={fieldErrors?.name?.[0]}
        />
        <TextField
          id="email"
          label="E-mail"
          type="email"
          required
          autoComplete="off"
          error={fieldErrors?.email?.[0]}
        />
        <SelectField
          id="role"
          label="Papel"
          defaultValue="AUTHOR"
          options={[
            { value: "ADMIN", label: "ADMIN" },
            { value: "EDITOR", label: "EDITOR" },
            { value: "AUTHOR", label: "AUTHOR" },
          ]}
          error={fieldErrors?.role?.[0]}
        />
        <Button type="submit" loading={pending}>
          Criar usuário
        </Button>
      </form>
    </div>
  );
}
