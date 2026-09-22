"use client";

import { useActionState, useRef, useState } from "react";
import { uploadMediaAction, type UploadedMedia } from "@/app/admin/(painel)/midia/actions";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

/**
 * Formulário de envio de imagem. Progressivo: funciona sem JavaScript (a Server Action recebe o
 * `FormData` direto); com JavaScript, `useActionState` mostra o estado sem recarregar a página.
 */
export function MediaUploadForm({ onUploaded }: { onUploaded?: (media: UploadedMedia) => void }) {
  const [state, formAction, pending] = useActionState<ActionResult<UploadedMedia> | null, FormData>(
    async (prevState, formData) => {
      const result = await uploadMediaAction(prevState, formData);
      if (result.ok) {
        formRef.current?.reset();
        onUploaded?.(result.data);
      }
      return result;
    },
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="max-w-narrow space-y-lg"
      aria-label="Enviar imagem"
    >
      {state && !state.ok ? (
        <FormMessage tone="error" title="Não foi possível enviar.">
          {state.error.message}
          {state.error.fieldErrors?.file ? ` ${state.error.fieldErrors.file.join(" ")}` : ""}
        </FormMessage>
      ) : null}
      {state?.ok ? <FormMessage tone="success" title="Imagem enviada." /> : null}

      <div>
        <label
          htmlFor="media-file"
          className="mb-xs block font-sans text-sm font-semibold text-text"
        >
          Arquivo
        </label>
        <input
          id="media-file"
          name="file"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          required
          onChange={(event) => setFileName(event.currentTarget.files?.[0]?.name ?? null)}
          className="block w-full font-sans text-sm text-text file:mr-md file:rounded-control file:border file:border-field-border file:bg-surface-raised file:px-md file:py-xs file:font-sans file:text-sm file:font-semibold"
        />
        <p className="mt-xs font-sans text-caption text-text-secondary">
          JPEG, PNG, WebP ou AVIF, até 10 MB. {fileName ? `Selecionado: ${fileName}` : ""}
        </p>
      </div>

      <TextField
        id="media-alt"
        name="altText"
        label="Texto alternativo"
        hint="Descreva a imagem para quem usa leitor de tela. Pode preencher depois, mas é obrigatório antes de publicar onde a imagem for usada."
      />
      <TextField
        id="media-caption"
        name="caption"
        label="Legenda"
        hint="Opcional. Aparece abaixo da imagem quando usada em um artigo."
      />

      <Button type="submit" loading={pending} loadingLabel="Enviando…">
        Enviar imagem
      </Button>
    </form>
  );
}
