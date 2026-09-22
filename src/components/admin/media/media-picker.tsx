"use client";

import { useId, useRef, useState } from "react";
import {
  listMediaThumbnailsAction,
  type MediaThumbnail,
} from "@/app/admin/(painel)/midia/list-action";
import { uploadMediaAction, type UploadedMedia } from "@/app/admin/(painel)/midia/actions";
import { Button, FormMessage } from "@/components/ui";

export type PickedImage = { mediaId: string; url: string; alt: string };

/**
 * Seletor de imagem para o editor de texto rico: `<dialog>` nativo (mesma convenção do menu
 * mobile — foco preso e `Esc` fecham de graça), com a biblioteca existente e envio rápido de uma
 * nova imagem sem sair do editor.
 */
export function MediaPicker({ onPick }: { onPick: (image: PickedImage) => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const fileInputId = useId();
  const [items, setItems] = useState<MediaThumbnail[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function open() {
    dialogRef.current?.showModal();
    setError(null);
    if (!items) {
      try {
        setItems(await listMediaThumbnailsAction());
      } catch {
        setError("Não foi possível carregar a biblioteca.");
      }
    }
  }

  function pick(item: MediaThumbnail) {
    onPick({ mediaId: item.id, url: item.url, alt: item.alt });
    dialogRef.current?.close();
  }

  async function uploadAndPick(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setUploading(true);
    setError(null);
    const result = await uploadMediaAction(null, formData);
    setUploading(false);
    if (!result.ok) {
      setError(result.error.message);
      return;
    }
    const uploaded: UploadedMedia = result.data;
    const altText = String(formData.get("altText") ?? "");
    setItems((prev) => [
      {
        id: uploaded.id,
        url: uploaded.url,
        alt: altText,
        width: uploaded.width,
        height: uploaded.height,
      },
      ...(prev ?? []),
    ]);
    onPick({ mediaId: uploaded.id, url: uploaded.url, alt: altText });
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        aria-label="Inserir imagem"
        onClick={open}
        className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border border-field-border bg-surface-raised px-sm font-sans text-sm font-semibold text-text hover:border-text"
      >
        Imagem
      </button>
      <dialog
        ref={dialogRef}
        aria-label="Escolher imagem"
        className="w-full max-w-[640px] border border-border bg-surface p-lg backdrop:bg-tinta/40"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-h3 font-medium text-text">Escolher imagem</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={() => dialogRef.current?.close()}
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-text"
          >
            ×
          </button>
        </div>

        {error ? (
          <FormMessage tone="error" className="mt-md">
            {error}
          </FormMessage>
        ) : null}

        <form
          onSubmit={uploadAndPick}
          className="mt-md flex flex-wrap items-end gap-sm border-b border-border pb-md"
        >
          <div>
            <label
              htmlFor={fileInputId}
              className="mb-xs block font-sans text-sm font-semibold text-text"
            >
              Enviar nova imagem
            </label>
            <input
              id={fileInputId}
              name="file"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/avif"
              required
              className="block font-sans text-sm text-text"
            />
          </div>
          <input type="hidden" name="altText" value="" />
          <Button type="submit" size="sm" loading={uploading} loadingLabel="Enviando…">
            Enviar e usar
          </Button>
        </form>

        <div className="mt-md max-h-96 overflow-auto">
          {items === null ? (
            <p className="font-sans text-caption text-text-secondary">Carregando…</p>
          ) : items.length === 0 ? (
            <p className="font-sans text-caption text-text-secondary">
              Nenhuma imagem na biblioteca ainda.
            </p>
          ) : (
            <ul className="grid grid-cols-3 gap-sm sm:grid-cols-4">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => pick(item)}
                    className="block aspect-square w-full overflow-hidden border border-border focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </dialog>
    </>
  );
}
