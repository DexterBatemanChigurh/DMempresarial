"use client";

import { useActionState, useState } from "react";
import { Button, FormMessage, SelectField, TextField, TextareaField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { TestimonialMutated } from "@/app/admin/(painel)/depoimentos/actions";

export type TestimonialFormValues = {
  authorName: string;
  authorDetail: string;
  quote: string;
  rating: string;
  source: "GOOGLE" | "MANUAL";
  givenAt: string;
  position: string;
};

type Result = ActionResult<TestimonialMutated>;

type Props = {
  mode: "create" | "edit";
  action: (prevState: Result | null, formData: FormData) => Promise<Result>;
  initial: TestimonialFormValues;
  testimonialId?: string;
  version?: number;
};

export function TestimonialForm({ mode, action, initial, testimonialId, version }: Props) {
  const [currentVersion, setCurrentVersion] = useState(version);
  const [state, formAction, pending] = useActionState<Result | null, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (result.ok && result.data.version !== undefined) setCurrentVersion(result.data.version);
      return result;
    },
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-xl">
      {testimonialId ? <input type="hidden" name="id" value={testimonialId} /> : null}
      {currentVersion !== undefined ? (
        <input type="hidden" name="expectedVersion" value={currentVersion} />
      ) : null}

      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {mode === "edit" && state?.ok ? (
        <FormMessage tone="success">Alterações salvas.</FormMessage>
      ) : null}

      <FormMessage tone="info">
        Só depoimento real, com autorização de quem escreveu. Não resuma nem melhore o texto
        original.
      </FormMessage>

      <TextField
        id="authorName"
        label="Quem escreveu"
        required
        defaultValue={initial.authorName}
        error={fieldErrors?.authorName?.[0]}
      />
      <TextField
        id="authorDetail"
        label="Cargo e empresa (opcional)"
        hint="Só se a pessoa autorizou mostrar."
        defaultValue={initial.authorDetail}
        error={fieldErrors?.authorDetail?.[0]}
      />
      <TextareaField
        id="quote"
        label="Depoimento"
        required
        rows={6}
        defaultValue={initial.quote}
        error={fieldErrors?.quote?.[0]}
      />
      <div className="grid gap-lg sm:grid-cols-2">
        <SelectField
          id="source"
          label="Origem"
          defaultValue={initial.source}
          options={[
            { value: "GOOGLE", label: "Avaliação no Google" },
            { value: "MANUAL", label: "Enviado à DM" },
          ]}
          error={fieldErrors?.source?.[0]}
        />
        <SelectField
          id="rating"
          label="Nota (opcional)"
          placeholder="Sem nota"
          defaultValue={initial.rating}
          options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} de 5` }))}
          error={fieldErrors?.rating?.[0]}
        />
        <TextField
          id="givenAt"
          label="Data (opcional)"
          type="date"
          hint="O site mostra só mês e ano."
          defaultValue={initial.givenAt}
          error={fieldErrors?.givenAt?.[0]}
        />
        <TextField
          id="position"
          label="Ordem"
          type="number"
          min={0}
          max={10000}
          hint="Menor aparece primeiro."
          defaultValue={initial.position}
          error={fieldErrors?.position?.[0]}
        />
      </div>

      <Button type="submit" loading={pending} loadingLabel="Salvando…">
        {mode === "create" ? "Criar depoimento" : "Salvar alterações"}
      </Button>
    </form>
  );
}
