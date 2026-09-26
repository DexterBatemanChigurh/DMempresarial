"use client";

import { useActionState, useState } from "react";
import {
  createRedirectAction,
  deleteRedirectAction,
} from "@/app/admin/(painel)/redirecionamentos/actions";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export function NewRedirectForm() {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ fromPath: string; toPath: string }> | null,
    FormData
  >(createRedirectAction, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-lg border border-border p-lg">
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {state?.ok ? (
        <FormMessage tone="success">
          {state.data.fromPath} agora leva a {state.data.toPath}.
        </FormMessage>
      ) : null}
      <div className="grid gap-lg md:grid-cols-2">
        <TextField
          id="fromPath"
          label="De (endereço antigo)"
          required
          placeholder="/blog/nome-antigo"
          hint="Artigo, solução ou especialista."
          error={fieldErrors?.fromPath?.[0]}
        />
        <TextField
          id="toPath"
          label="Para (endereço novo)"
          required
          placeholder="/blog/nome-novo"
          hint="Caminho do próprio site."
          error={fieldErrors?.toPath?.[0]}
        />
      </div>
      <Button type="submit" size="sm" loading={pending} loadingLabel="Criando…">
        Criar redirecionamento
      </Button>
    </form>
  );
}

export function DeleteRedirectButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ fromPath: string }> | null,
    FormData
  >(deleteRedirectAction, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" size="sm" variant="tertiary" onClick={() => setConfirming(true)}>
        Remover
      </Button>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-sm">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        loading={pending}
        loadingLabel="Removendo…"
      >
        Confirmar
      </Button>
      <Button type="button" size="sm" variant="tertiary" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </form>
  );
}
