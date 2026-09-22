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
import { MediaPicker } from "@/components/admin/media/media-picker";
import type { ActionResult } from "@/lib/result";
import type { PostFormOptions } from "@/features/content/application/post-form-options";
import type { PostMutated } from "@/app/admin/(painel)/artigos/actions";

const FORMAT_OPTIONS = [
  { value: "ANALISE", label: "Análise" },
  { value: "LEITURA_DE_MERCADO", label: "Leitura de mercado" },
  { value: "CONCEITO_APLICADO", label: "Conceito aplicado" },
  { value: "CASO", label: "Caso" },
  { value: "OPINIAO", label: "Opinião" },
  { value: "REGIONAL", label: "Regional" },
];

export type PostFormValues = {
  slug?: string;
  title: string;
  subtitle: string;
  excerpt: string;
  body: unknown;
  format: string;
  coverMediaId: string | null;
  coverUrl: string | null;
  coverAlt: string;
  authorId: string;
  seoTitle: string;
  seoDescription: string;
  categoryIds: string[];
  primaryCategoryId: string | null;
  tagIds: string[];
  solutionIds: string[];
  primarySolutionId: string | null;
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: ActionResult<PostMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<PostMutated>>;
  initial: PostFormValues;
  options: PostFormOptions;
  postId?: string;
  version?: number;
  onSaved?: (result: PostMutated) => void;
};

export function PostForm({ mode, action, initial, options, postId, version, onSaved }: Props) {
  const [currentVersion, setCurrentVersion] = useState(version);
  const [state, formAction, pending] = useActionState<ActionResult<PostMutated> | null, FormData>(
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
  const [cover, setCover] = useState<{ mediaId: string; url: string; alt: string } | null>(
    initial.coverMediaId && initial.coverUrl
      ? { mediaId: initial.coverMediaId, url: initial.coverUrl, alt: initial.coverAlt }
      : null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-xl">
      {postId ? <input type="hidden" name="postId" value={postId} /> : null}
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

      <TextField
        id="title"
        label="Título"
        required
        defaultValue={initial.title}
        error={fieldErrors?.title?.[0]}
      />
      <TextField
        id="subtitle"
        label="Subtítulo"
        defaultValue={initial.subtitle}
        error={fieldErrors?.subtitle?.[0]}
      />
      <TextareaField
        id="excerpt"
        label="Resumo"
        hint="Aparece na listagem do blog e em compartilhamentos."
        defaultValue={initial.excerpt}
        error={fieldErrors?.excerpt?.[0]}
      />

      <SelectField
        id="authorId"
        label="Autor"
        required
        placeholder="Selecione"
        defaultValue={initial.authorId}
        error={fieldErrors?.authorId?.[0]}
        options={options.specialists.map((s) => ({
          value: s.id,
          label: `${s.name}${s.kind === "GUEST" ? " (convidado)" : ""}${s.status !== "PUBLISHED" ? ` — ${s.status === "DRAFT" ? "rascunho" : "arquivado"}` : ""}`,
        }))}
      />

      <SelectField
        id="format"
        label="Formato editorial"
        placeholder="Nenhum"
        defaultValue={initial.format}
        options={FORMAT_OPTIONS}
      />

      <fieldset className="space-y-sm">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">Imagem de capa</legend>
        {cover ? (
          <div className="flex items-start gap-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={cover.url}
              alt={cover.alt}
              className="h-24 w-32 border border-border object-cover"
            />
            <Button type="button" variant="tertiary" size="sm" onClick={() => setCover(null)}>
              Remover capa
            </Button>
          </div>
        ) : (
          <p className="font-sans text-caption text-text-secondary">Nenhuma imagem escolhida.</p>
        )}
        <MediaPicker onPick={(image) => setCover(image)} />
        <input type="hidden" name="coverMediaId" value={cover?.mediaId ?? ""} />
        <p className="font-sans text-caption text-text-secondary">
          O texto alternativo da capa é o texto alternativo cadastrado na biblioteca de mídia.
        </p>
      </fieldset>

      <fieldset className="space-y-xs">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">Categorias</legend>
        <p className="mb-xs font-sans text-caption text-text-secondary">
          Marque as categorias do artigo e escolha uma como principal.
        </p>
        {fieldErrors?.primaryCategoryId ? (
          <FormMessage tone="error">{fieldErrors.primaryCategoryId[0]}</FormMessage>
        ) : null}
        <ul className="space-y-xs">
          {options.categories.map((c) => (
            <li key={c.id} className="flex items-center gap-md">
              <CheckboxField
                id={`category-${c.id}`}
                name="categoryIds"
                value={c.id}
                defaultChecked={initial.categoryIds.includes(c.id)}
              >
                {c.name}
              </CheckboxField>
              <label className="flex items-center gap-xs font-sans text-caption text-text-secondary">
                <input
                  type="radio"
                  name="primaryCategoryId"
                  value={c.id}
                  defaultChecked={initial.primaryCategoryId === c.id}
                  className="size-5 accent-link"
                />
                Principal
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="space-y-xs">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">Tags</legend>
        <ul className="flex flex-wrap gap-md">
          {options.tags.map((t) => (
            <li key={t.id}>
              <CheckboxField
                id={`tag-${t.id}`}
                name="tagIds"
                value={t.id}
                defaultChecked={initial.tagIds.includes(t.id)}
              >
                {t.name}
              </CheckboxField>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="space-y-xs">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">
          Solução relacionada
        </legend>
        <p className="mb-xs font-sans text-caption text-text-secondary">
          Define o CTA contextual do artigo. No máximo uma principal.
        </p>
        {fieldErrors?.primarySolutionId ? (
          <FormMessage tone="error">{fieldErrors.primarySolutionId[0]}</FormMessage>
        ) : null}
        <ul className="space-y-xs">
          {options.solutions.map((s) => (
            <li key={s.id} className="flex items-center gap-md">
              <CheckboxField
                id={`solution-${s.id}`}
                name="solutionIds"
                value={s.id}
                defaultChecked={initial.solutionIds.includes(s.id)}
              >
                {s.title}
              </CheckboxField>
              <label className="flex items-center gap-xs font-sans text-caption text-text-secondary">
                <input
                  type="radio"
                  name="primarySolutionId"
                  value={s.id}
                  defaultChecked={initial.primarySolutionId === s.id}
                  className="size-5 accent-link"
                />
                Principal
              </label>
            </li>
          ))}
        </ul>
      </fieldset>

      <RichTextEditor
        label="Corpo do artigo"
        name="body"
        initialValue={initial.body}
        error={fieldErrors?.body?.[0]}
      />

      <fieldset className="space-y-md border-t border-border pt-lg">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">SEO</legend>
        <TextField
          id="seoTitle"
          label="Título para SEO"
          hint="Opcional. Sem preencher, o site usa o título do artigo."
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
        {mode === "create" ? "Criar artigo" : "Salvar alterações"}
      </Button>
    </form>
  );
}
