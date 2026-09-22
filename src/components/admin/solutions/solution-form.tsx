"use client";

import { useActionState, useState } from "react";
import {
  Button,
  CheckboxField,
  FormMessage,
  SelectField,
  TextField,
  TextareaField,
} from "@/components/ui";
import { RichTextEditor } from "@/components/admin/rich-text/rich-text-editor";
import { SolutionItemsField } from "./solution-items-field";
import type { ActionResult } from "@/lib/result";
import type { SolutionMutated } from "@/app/admin/(painel)/solucoes/actions";

export type SolutionFormValues = {
  slug?: string;
  type: "CONSULTORIA" | "SERVICO";
  title: string;
  summary: string;
  context: unknown;
  approach: unknown;
  isFeatured: boolean;
  seoTitle: string;
  seoDescription: string;
  situations: { title: string; body: string | null }[];
  steps: { title: string; body: string | null }[];
  goals: { title: string; body: string | null }[];
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: ActionResult<SolutionMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<SolutionMutated>>;
  initial: SolutionFormValues;
  solutionId?: string;
  version?: number;
  onSaved?: (result: SolutionMutated) => void;
};

export function SolutionForm({ mode, action, initial, solutionId, version, onSaved }: Props) {
  const [currentVersion, setCurrentVersion] = useState(version);
  const [state, formAction, pending] = useActionState<
    ActionResult<SolutionMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result.ok) {
      if (result.data.version !== undefined) setCurrentVersion(result.data.version);
      onSaved?.(result.data);
    }
    return result;
  }, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-xl">
      {solutionId ? <input type="hidden" name="id" value={solutionId} /> : null}
      {currentVersion !== undefined ? (
        <input type="hidden" name="expectedVersion" value={currentVersion} />
      ) : null}

      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {mode === "edit" && state?.ok ? (
        <FormMessage tone="success">Alterações salvas.</FormMessage>
      ) : null}

      {mode === "create" ? (
        <TextField
          id="slug"
          label="Endereço (slug)"
          hint="Deixe em branco para gerar a partir do título."
          defaultValue={initial.slug}
          error={fieldErrors?.slug?.[0]}
        />
      ) : null}

      <SelectField
        id="type"
        label="Tipo"
        defaultValue={initial.type}
        options={[
          { value: "CONSULTORIA", label: "Consultoria" },
          { value: "SERVICO", label: "Serviço" },
        ]}
      />
      <TextField
        id="title"
        label="Título"
        required
        defaultValue={initial.title}
        error={fieldErrors?.title?.[0]}
      />
      <TextareaField
        id="summary"
        label="Resumo"
        hint="Uma frase que começa pelo problema."
        required
        defaultValue={initial.summary}
        error={fieldErrors?.summary?.[0]}
      />
      <CheckboxField id="isFeatured" defaultChecked={initial.isFeatured}>
        Destacar esta solução
      </CheckboxField>

      <RichTextEditor
        label="Contexto"
        name="context"
        initialValue={initial.context}
        error={fieldErrors?.context?.[0]}
      />
      <RichTextEditor
        label="Abordagem"
        name="approach"
        initialValue={initial.approach}
        error={fieldErrors?.approach?.[0]}
      />

      {fieldErrors?.items ? <FormMessage tone="error">{fieldErrors.items[0]}</FormMessage> : null}
      <SolutionItemsField
        legend="Situações atendidas"
        prefix="situation"
        initial={initial.situations}
      />
      <SolutionItemsField legend="Etapas do processo" prefix="step" initial={initial.steps} />
      <SolutionItemsField legend="Objetivos" prefix="goal" initial={initial.goals} />

      <fieldset className="space-y-md border-t border-border pt-lg">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">SEO</legend>
        <TextField
          id="seoTitle"
          label="Título para SEO"
          hint="Opcional. Sem preencher, o site usa o título."
          defaultValue={initial.seoTitle}
          error={fieldErrors?.seoTitle?.[0]}
        />
        <TextareaField
          id="seoDescription"
          label="Descrição para SEO"
          hint="Opcional. Sem preencher, o site usa o resumo."
          defaultValue={initial.seoDescription}
          error={fieldErrors?.seoDescription?.[0]}
        />
      </fieldset>

      <Button type="submit" loading={pending} loadingLabel="Salvando…">
        {mode === "create" ? "Criar solução" : "Salvar alterações"}
      </Button>
    </form>
  );
}
