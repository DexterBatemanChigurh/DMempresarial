"use client";

import { useActionState, useRef } from "react";
import { createTagAction } from "@/app/admin/(painel)/categorias/actions";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export function NewTagForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await createTagAction(prevState, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-sm">
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      <TextField
        id="new-tag-name"
        name="name"
        label="Nome"
        required
        error={fieldErrors?.name?.[0]}
      />
      <Button type="submit" size="sm" loading={pending} loadingLabel="Criando…">
        Criar tag
      </Button>
    </form>
  );
}
