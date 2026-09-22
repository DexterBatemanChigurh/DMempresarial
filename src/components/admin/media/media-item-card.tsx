"use client";

import { useActionState, useState } from "react";
import { deleteMediaAction, updateMediaAction } from "@/app/admin/(painel)/midia/actions";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export type MediaLibraryItem = {
  id: string;
  url: string;
  width: number;
  height: number;
  altText: string | null;
  caption: string | null;
  bytes: number;
  uploadedBy: string | null;
  createdAt: string;
  focalX: number;
  focalY: number;
};

function formatBytes(bytes: number): string {
  return bytes < 1024 * 1024
    ? `${Math.round(bytes / 1024)} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Um item da biblioteca: miniatura + edição de metadados + exclusão. `canManage`/`canDelete`
 * só escondem controles que o servidor recusaria de qualquer forma (a autorização real está nas
 * Server Actions). */
export function MediaItemCard({
  item,
  canManage,
  canDelete,
}: {
  item: MediaLibraryItem;
  canManage: boolean;
  canDelete: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [updateState, updateFormAction, updating] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await updateMediaAction(prevState, formData);
    if (result.ok) setEditing(false);
    return result;
  }, null);
  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteMediaAction, null);

  const deleted = deleteState?.ok === true;
  if (deleted) return null;

  return (
    <li className="border border-border">
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-muted">
        {/* URL de storage já reencodada/redimensionada no servidor (sharp): passar de novo pelo
            otimizador do Next seria trabalho redundante. Mesmo raciocínio do renderizador público
            (components/content/rich-text.tsx). */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.url}
          alt={item.altText ?? ""}
          loading="lazy"
          className="size-full object-cover"
          style={{ objectPosition: `${item.focalX * 100}% ${item.focalY * 100}%` }}
        />
      </div>
      <div className="space-y-xs p-sm">
        <p
          className="truncate font-sans text-caption text-text-secondary"
          title={item.altText ?? "(sem texto alternativo)"}
        >
          {item.altText || "(sem texto alternativo)"}
        </p>
        <p className="font-sans text-caption text-text-muted">
          {item.width}×{item.height} · {formatBytes(item.bytes)}
        </p>

        {editing ? (
          <form action={updateFormAction} className="space-y-sm">
            <input type="hidden" name="id" value={item.id} />
            {updateState && !updateState.ok ? (
              <FormMessage tone="error">{updateState.error.message}</FormMessage>
            ) : null}
            <TextField
              id={`alt-${item.id}`}
              name="altText"
              label="Texto alternativo"
              defaultValue={item.altText ?? ""}
            />
            <TextField
              id={`caption-${item.id}`}
              name="caption"
              label="Legenda"
              defaultValue={item.caption ?? ""}
            />
            <div className="flex gap-sm">
              <TextField
                id={`focal-x-${item.id}`}
                name="focalX"
                label="Ponto focal — horizontal"
                hint="0 (esquerda) a 1 (direita)"
                type="number"
                min={0}
                max={1}
                step={0.05}
                defaultValue={item.focalX}
              />
              <TextField
                id={`focal-y-${item.id}`}
                name="focalY"
                label="Ponto focal — vertical"
                hint="0 (topo) a 1 (base)"
                type="number"
                min={0}
                max={1}
                step={0.05}
                defaultValue={item.focalY}
              />
            </div>
            <div className="flex gap-xs">
              <Button type="submit" size="sm" loading={updating} loadingLabel="Salvando…">
                Salvar
              </Button>
              <Button type="button" size="sm" variant="tertiary" onClick={() => setEditing(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap gap-xs pt-xs">
            {canManage ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)}>
                Editar
              </Button>
            ) : null}
            {canDelete ? (
              confirmingDelete ? (
                <form action={deleteFormAction} className="flex items-center gap-xs">
                  <input type="hidden" name="id" value={item.id} />
                  <span className="font-sans text-caption text-text-secondary">
                    Excluir de vez?
                  </span>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    loading={deleting}
                    loadingLabel="Excluindo…"
                  >
                    Confirmar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="tertiary"
                    onClick={() => setConfirmingDelete(false)}
                  >
                    Cancelar
                  </Button>
                </form>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  onClick={() => setConfirmingDelete(true)}
                >
                  Excluir
                </Button>
              )
            ) : null}
          </div>
        )}
        {deleteState && !deleteState.ok ? (
          <FormMessage tone="error" className="mt-xs">
            {deleteState.error.message}
          </FormMessage>
        ) : null}
      </div>
    </li>
  );
}
