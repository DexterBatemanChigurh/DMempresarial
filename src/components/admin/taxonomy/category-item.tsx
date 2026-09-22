"use client";

import { useActionState, useState } from "react";
import {
  deleteCategoryAction,
  mergeCategoriesAction,
  updateCategoryAction,
} from "@/app/admin/(painel)/categorias/actions";
import { Button, FormMessage, SelectField, TextField, TextareaField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  postCount: number;
  specialistCount: number;
};

function usageLabel(row: CategoryRow): string {
  const parts: string[] = [];
  if (row.postCount > 0) parts.push(`${row.postCount} artigo(s)`);
  if (row.specialistCount > 0) parts.push(`${row.specialistCount} especialista(s)`);
  return parts.length > 0
    ? `Em uso: ${parts.join(", ")}`
    : "Não usada em nenhum artigo ou especialista.";
}

export function CategoryItem({
  category,
  others,
}: {
  category: CategoryRow;
  others: CategoryRow[];
}) {
  const [mode, setMode] = useState<"view" | "edit" | "delete" | "merge">("view");
  const inUse = category.postCount > 0 || category.specialistCount > 0;

  const [updateState, updateFormAction, updating] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await updateCategoryAction(prevState, formData);
    if (result.ok) setMode("view");
    return result;
  }, null);

  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await deleteCategoryAction(prevState, formData);
    if (result.ok) setMode("view");
    return result;
  }, null);

  const [mergeState, mergeFormAction, merging] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await mergeCategoriesAction(prevState, formData);
    if (result.ok) setMode("view");
    return result;
  }, null);

  return (
    <li className="space-y-sm border border-border p-md">
      <div className="flex flex-wrap items-start justify-between gap-sm">
        <div>
          <p className="font-sans font-semibold text-text">{category.name}</p>
          <p className="font-sans text-caption text-text-secondary">/{category.slug}</p>
          {category.description ? (
            <p className="mt-xs font-sans text-body-sm text-text-secondary">
              {category.description}
            </p>
          ) : null}
          <p className="mt-xs font-sans text-caption text-text-muted">{usageLabel(category)}</p>
        </div>
        {mode === "view" ? (
          <div className="flex flex-wrap gap-xs">
            <Button type="button" size="sm" variant="secondary" onClick={() => setMode("edit")}>
              Editar
            </Button>
            {others.length > 0 ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => setMode("merge")}>
                Mesclar
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="tertiary"
              disabled={inUse}
              onClick={() => setMode("delete")}
            >
              Excluir
            </Button>
          </div>
        ) : null}
      </div>

      {mode === "edit" ? (
        <form action={updateFormAction} className="space-y-sm border-t border-border pt-sm">
          <input type="hidden" name="id" value={category.id} />
          {updateState && !updateState.ok ? (
            <FormMessage tone="error">{updateState.error.message}</FormMessage>
          ) : null}
          <TextField
            id={`name-${category.id}`}
            name="name"
            label="Nome"
            defaultValue={category.name}
          />
          <TextareaField
            id={`description-${category.id}`}
            name="description"
            label="Descrição"
            defaultValue={category.description ?? ""}
          />
          <div className="flex gap-xs">
            <Button type="submit" size="sm" loading={updating} loadingLabel="Salvando…">
              Salvar
            </Button>
            <Button type="button" size="sm" variant="tertiary" onClick={() => setMode("view")}>
              Cancelar
            </Button>
          </div>
        </form>
      ) : null}

      {mode === "delete" ? (
        <form
          action={deleteFormAction}
          className="flex items-center gap-sm border-t border-border pt-sm"
        >
          <input type="hidden" name="id" value={category.id} />
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
          <input type="hidden" name="fromId" value={category.id} />
          {mergeState && !mergeState.ok ? (
            <FormMessage tone="error">{mergeState.error.message}</FormMessage>
          ) : null}
          <SelectField
            id={`merge-${category.id}`}
            name="toId"
            label={`Mover artigos e especialistas de “${category.name}” para:`}
            placeholder="Selecione"
            required
            options={others.map((o) => ({ value: o.id, label: o.name }))}
          />
          <p className="font-sans text-caption text-text-secondary">
            “{category.name}” some depois: o que estiver marcado com ela passa a ficar marcado com a
            categoria escolhida.
          </p>
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
