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
import type { SpecialistFormOptions } from "@/features/people/application/specialist-form-options";
import type { SpecialistMutated } from "@/app/admin/(painel)/especialistas/actions";

export type SpecialistFormValues = {
  slug?: string;
  name: string;
  roleTitle: string;
  summary: string;
  bio: unknown;
  photoMediaId: string | null;
  photoUrl: string | null;
  photoAlt: string;
  kind: "TEAM" | "GUEST";
  seoTitle: string;
  seoDescription: string;
  solutionIds: string[];
  categoryIds: string[];
};

type Props = {
  mode: "create" | "edit";
  action: (
    prevState: ActionResult<SpecialistMutated> | null,
    formData: FormData,
  ) => Promise<ActionResult<SpecialistMutated>>;
  initial: SpecialistFormValues;
  options: SpecialistFormOptions;
  specialistId?: string;
  version?: number;
  onSaved?: (result: SpecialistMutated) => void;
};

export function SpecialistForm({
  mode,
  action,
  initial,
  options,
  specialistId,
  version,
  onSaved,
}: Props) {
  const [currentVersion, setCurrentVersion] = useState(version);
  const [state, formAction, pending] = useActionState<
    ActionResult<SpecialistMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await action(prevState, formData);
    if (result.ok) {
      if (result.data.version !== undefined) setCurrentVersion(result.data.version);
      onSaved?.(result.data);
    }
    return result;
  }, null);
  const [photo, setPhoto] = useState<{ mediaId: string; url: string; alt: string } | null>(
    initial.photoMediaId && initial.photoUrl
      ? { mediaId: initial.photoMediaId, url: initial.photoUrl, alt: initial.photoAlt }
      : null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-xl">
      {specialistId ? <input type="hidden" name="id" value={specialistId} /> : null}
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
          hint="Deixe em branco para gerar a partir do nome."
          defaultValue={initial.slug}
          error={fieldErrors?.slug?.[0]}
        />
      ) : null}

      <TextField
        id="name"
        label="Nome"
        required
        defaultValue={initial.name}
        error={fieldErrors?.name?.[0]}
      />
      <TextField
        id="roleTitle"
        label="Cargo"
        defaultValue={initial.roleTitle}
        error={fieldErrors?.roleTitle?.[0]}
      />
      <TextareaField
        id="summary"
        label="Resumo"
        hint="Aparece na listagem de especialistas."
        defaultValue={initial.summary}
        error={fieldErrors?.summary?.[0]}
      />

      <SelectField
        id="kind"
        label="Tipo"
        defaultValue={initial.kind}
        options={[
          { value: "TEAM", label: "Equipe (tem página pública)" },
          { value: "GUEST", label: "Convidado (assina artigos, sem página pública)" },
        ]}
      />

      <fieldset className="space-y-sm">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">Foto</legend>
        {photo ? (
          <div className="flex items-start gap-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={photo.alt}
              className="size-24 border border-border object-cover"
            />
            <Button type="button" variant="tertiary" size="sm" onClick={() => setPhoto(null)}>
              Remover foto
            </Button>
          </div>
        ) : (
          <p className="font-sans text-caption text-text-secondary">Nenhuma foto escolhida.</p>
        )}
        <MediaPicker onPick={(image) => setPhoto(image)} />
        <input type="hidden" name="photoMediaId" value={photo?.mediaId ?? ""} />
        <p className="font-sans text-caption text-text-secondary">
          Foto real, sem banco de imagens. O texto alternativo é o cadastrado na biblioteca de
          mídia.
        </p>
      </fieldset>

      <fieldset className="space-y-xs">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">
          Áreas de atuação
        </legend>
        <ul className="flex flex-wrap gap-md">
          {options.categories.map((c) => (
            <li key={c.id}>
              <CheckboxField
                id={`category-${c.id}`}
                name="categoryIds"
                value={c.id}
                defaultChecked={initial.categoryIds.includes(c.id)}
              >
                {c.name}
              </CheckboxField>
            </li>
          ))}
        </ul>
      </fieldset>

      <fieldset className="space-y-xs">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">
          Soluções em que atua
        </legend>
        <ul className="flex flex-wrap gap-md">
          {options.solutions.map((s) => (
            <li key={s.id}>
              <CheckboxField
                id={`solution-${s.id}`}
                name="solutionIds"
                value={s.id}
                defaultChecked={initial.solutionIds.includes(s.id)}
              >
                {s.title}
              </CheckboxField>
            </li>
          ))}
        </ul>
      </fieldset>

      <RichTextEditor
        label="Biografia"
        name="bio"
        initialValue={initial.bio}
        error={fieldErrors?.bio?.[0]}
      />

      <fieldset className="space-y-md border-t border-border pt-lg">
        <legend className="mb-xs font-sans text-sm font-semibold text-text">SEO</legend>
        <TextField
          id="seoTitle"
          label="Título para SEO"
          hint="Opcional. Sem preencher, o site usa o nome."
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
        {mode === "create" ? "Criar especialista" : "Salvar alterações"}
      </Button>
    </form>
  );
}
