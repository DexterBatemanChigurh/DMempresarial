"use client";

import { useActionState, useRef } from "react";
import { createCategoryAction } from "@/app/admin/(painel)/categorias/actions";
import { Button, FormMessage, TextField, TextareaField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export function NewCategoryForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await createCategoryAction(prevState, formData);
    if (result.ok) formRef.current?.reset();
    return result;
  }, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form ref={formRef} action={formAction} className="space-y-sm">
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      <TextField
        id="new-category-name"
        name="name"
        label="Nome"
        required
        error={fieldErrors?.name?.[0]}
      />
      <TextField
        id="new-category-slug"
        name="slug"
        label="Endereço (slug)"
        hint="Deixe em branco para gerar a partir do nome."
        error={fieldErrors?.slug?.[0]}
      />
      <TextareaField
        id="new-category-description"
        name="description"
        label="Descrição"
        error={fieldErrors?.description?.[0]}
      />
      <Button type="submit" size="sm" loading={pending} loadingLabel="Criando…">
        Criar categoria
      </Button>
    </form>
  );
}
