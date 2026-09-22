"use client";

import { useActionState, useState } from "react";
import { Button, FormMessage, SelectField, TextField, TextareaField } from "@/components/ui";
import { RichTextEditor } from "@/components/admin/rich-text/rich-text-editor";
import { ValuesField } from "./values-field";
import { EMPTY_DOC } from "@/lib/rich-text";
import {
  PAGE_TEMPLATES,
  PAGE_TEMPLATE_LABEL,
  type PageTemplate,
} from "@/features/pages/domain/page-schemas";
import type { ActionResult } from "@/lib/result";
import type { PageMutated } from "@/app/admin/(painel)/paginas/actions";

export type PageFormValues = {
  key?: string;
  template: PageTemplate;
  title: string;
  data: Record<string, unknown>;
  seoTitle: string;
  seoDescription: string;
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: ActionResult<PageMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<PageMutated>>;
  initial: PageFormValues;
  pageId?: string;
  version?: number;
  onSaved?: (result: PageMutated) => void;
};

function rich(data: Record<string, unknown>, field: string): unknown {
  return data[field] ?? EMPTY_DOC;
}
function text(data: Record<string, unknown>, field: string): string {
  const value = data[field];
  return typeof value === "string" ? value : "";
}
function values(data: Record<string, unknown>): { name: string; practice: string }[] {
  const raw = data.values;
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v): v is { name?: unknown; practice?: unknown } => typeof v === "object" && v !== null)
    .map((v) => ({
      name: typeof v.name === "string" ? v.name : "",
      practice: typeof v.practice === "string" ? v.practice : "",
    }));
}

export function PageForm({ mode, action, initial, pageId, version, onSaved }: Props) {
  const [template, setTemplate] = useState<PageTemplate>(initial.template);
  const [currentVersion, setCurrentVersion] = useState(version);
  const [state, formAction, pending] = useActionState<ActionResult<PageMutated> | null, FormData>(
    async (prevState, formData) => {
      const result = await action(prevState, formData);
      if (result.ok) {
        if (result.data.version !== undefined) setCurrentVersion(result.data.version);
        onSaved?.(result.data);
      }
      return result;
    },
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const data = template === initial.template ? initial.data : {};

  return (
    <form action={formAction} className="space-y-xl">
      {pageId ? <input type="hidden" name="id" value={pageId} /> : null}
      {currentVersion !== undefined ? (
        <input type="hidden" name="expectedVersion" value={currentVersion} />
      ) : null}
      <input type="hidden" name="template" value={template} />

      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {mode === "edit" && state?.ok ? (
        <FormMessage tone="success">Alterações salvas.</FormMessage>
      ) : null}

      {mode === "create" ? (
        <>
          <TextField
            id="key"
            name="key"
            label="Identificador (key)"
            required
            hint="Estável, nunca muda depois de criada (ex.: about, contact, privacy)."
            error={fieldErrors?.key?.[0]}
          />
          <SelectField
            id="templateSelect"
            label="Template"
            value={template}
            onChange={(event) => setTemplate(event.target.value as PageTemplate)}
            options={PAGE_TEMPLATES.map((t) => ({ value: t, label: PAGE_TEMPLATE_LABEL[t] }))}
          />
        </>
      ) : (
        <p className="font-sans text-sm text-text-secondary">
          Template: <span className="font-semibold text-text">{PAGE_TEMPLATE_LABEL[template]}</span>{" "}
          (não muda depois de criada)
        </p>
      )}

      <TextField
        id="title"
        label="Título"
        required
        defaultValue={initial.title}
        error={fieldErrors?.title?.[0]}
      />

      {template === "HOME" ? (
        <>
          <TextField
            id="headline"
            name="headline"
            label="Frase de efeito (hero)"
            defaultValue={text(data, "headline")}
          />
          <RichTextEditor
            label="Descrição (hero)"
            name="description"
            initialValue={rich(data, "description")}
          />
          <RichTextEditor
            label="Como a DM pensa"
            name="howWeThink"
            initialValue={rich(data, "howWeThink")}
          />
        </>
      ) : null}

      {template === "ABOUT" ? (
        <>
          <RichTextEditor
            label="Quem somos"
            name="whoWeAre"
            initialValue={rich(data, "whoWeAre")}
          />
          <RichTextEditor
            label="Como pensamos"
            name="howWeThink"
            initialValue={rich(data, "howWeThink")}
          />
          <RichTextEditor
            label="Como trabalhamos"
            name="howWeWork"
            initialValue={rich(data, "howWeWork")}
          />
          <ValuesField initial={values(data)} />
        </>
      ) : null}

      {template === "CONTACT" ? (
        <RichTextEditor label="Texto de convite" name="intro" initialValue={rich(data, "intro")} />
      ) : null}

      {template === "LEGAL" ? (
        <RichTextEditor label="Texto da página" name="body" initialValue={rich(data, "body")} />
      ) : null}

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
          defaultValue={initial.seoDescription}
          error={fieldErrors?.seoDescription?.[0]}
        />
      </fieldset>

      <Button type="submit" loading={pending} loadingLabel="Salvando…">
        {mode === "create" ? "Criar página" : "Salvar alterações"}
      </Button>
    </form>
  );
}
