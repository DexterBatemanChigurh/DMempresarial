"use client";

import { useActionState, useState } from "react";
import { deleteTagAction, mergeTagsAction } from "@/app/admin/(painel)/categorias/actions";
import { Button, FormMessage, SelectField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export type TagRow = { id: string; slug: string; name: string; postCount: number };

export function TagItem({ tag, others }: { tag: TagRow; others: TagRow[] }) {
  const [mode, setMode] = useState<"view" | "delete" | "merge">("view");

  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await deleteTagAction(prevState, formData);
    if (result.ok) setMode("view");
    return result;
  }, null);

  const [mergeState, mergeFormAction, merging] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await mergeTagsAction(prevState, formData);
    if (result.ok) setMode("view");
    return result;
  }, null);

  return (
    <li className="space-y-sm border border-border p-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <p className="font-sans font-semibold text-text">{tag.name}</p>
          <p className="font-sans text-caption text-text-secondary">/{tag.slug}</p>
          <p className="mt-xs font-sans text-caption text-text-muted">
            {tag.postCount > 0
              ? `Em uso: ${tag.postCount} artigo(s)`
              : "Não usada em nenhum artigo."}
          </p>
        </div>
        {mode === "view" ? (
          <div className="flex flex-wrap gap-xs">
            {others.length > 0 ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode("merge")}>
                Mesclar
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="tertiary"
              disabled={tag.postCount > 0}
              onClick={() => setMode("delete")}
            >
              Excluir
            </Button>
          </div>
        ) : null}
      </div>

      {mode === "delete" ? (
        <form
          action={deleteFormAction}
          className="flex items-center gap-sm border-t border-border pt-sm"
        >
          <input type="hidden" name="id" value={tag.id} />
          {deleteState && !deleteState.ok ? (
            <FormMessage tone="error">{deleteState.error.message}</FormMessage>
          ) : (
            <span className="font-sans text-caption text-text-secondary">Excluir de vez?</span>
          )}
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            loading={deleting}
            loadingLabel="Excluindo…"
          >
            Confirmar exclusão
          </Button>
          <Button type="button" size="sm" variant="tertiary" onClick={() => setMode("view")}>
            Cancelar
          </Button>
        </form>
      ) : null}

      {mode === "merge" ? (
        <form action={mergeFormAction} className="space-y-sm border-t border-border pt-sm">
          <input type="hidden" name="fromId" value={tag.id} />
          {mergeState && !mergeState.ok ? (
            <FormMessage tone="error">{mergeState.error.message}</FormMessage>
          ) : null}
          <SelectField
            id={`merge-tag-${tag.id}`}
            name="toId"
            label={`Mover artigos marcados com “${tag.name}” para:`}
            placeholder="Selecione"
            required
            options={others.map((o) => ({ value: o.id, label: o.name }))}
          />
          <div className="flex gap-xs">
            <Button type="submit" size="sm" loading={merging} loadingLabel="Mesclando…">
              Confirmar mesclagem
            </Button>
            <Button type="button" size="sm" variant="tertiary" onClick={() => setMode("view")}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}
    </li>
  );
}
