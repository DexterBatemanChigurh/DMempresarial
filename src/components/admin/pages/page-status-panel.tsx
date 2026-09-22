"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deletePageAction,
  transitionPageAction,
  type PageMutated,
} from "@/app/admin/(painel)/paginas/actions";
import { Button, FormMessage } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { PageStatus } from "@/features/pages/application/page-service";

const STATUS_LABEL: Record<PageStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const TRANSITION_LABEL: Record<PageStatus, string> = {
  DRAFT: "Voltar para rascunho",
  PUBLISHED: "Publicar",
  ARCHIVED: "Arquivar",
};

type Props = {
  pageId: string;
  status: PageStatus;
  version: number;
  targets: PageStatus[];
  canDelete: boolean;
};

export function PageStatusPanel({ pageId, status, version, targets, canDelete }: Props) {
  const router = useRouter();

  const [transitionState, transitionFormAction, transitionPending] = useActionState<
    ActionResult<PageMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await transitionPageAction(prevState, formData);
    if (result.ok) router.refresh();
    return result;
  }, null);

  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deletePageAction, null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const transitionFieldErrors =
    transitionState && !transitionState.ok ? transitionState.error.fieldErrors : undefined;

  return (
    <div className="space-y-lg border border-border p-lg">
      <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
        Status: {STATUS_LABEL[status]}
      </p>

      {transitionState && !transitionState.ok ? (
        <FormMessage tone="error">{transitionState.error.message}</FormMessage>
      ) : null}
      {transitionFieldErrors?.publish ? (
        <FormMessage tone="error" title="Faltam requisitos para publicar">
          <ul className="list-disc pl-lg">
            {transitionFieldErrors.publish.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </FormMessage>
      ) : null}

      {targets.length > 0 ? (
        <form action={transitionFormAction} className="flex flex-wrap gap-sm">
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="expectedVersion" value={version} />
          {targets.map((to) => (
            <Button
              key={to}
              type="submit"
              name="to"
              value={to}
              variant={to === "PUBLISHED" ? "primary" : "secondary"}
              size="sm"
              loading={transitionPending}
              loadingLabel="Aplicando…"
            >
              {TRANSITION_LABEL[to]}
            </Button>
          ))}
        </form>
      ) : (
        <p className="font-sans text-caption text-text-secondary">
          Nenhuma transição de estado disponível para você agora.
        </p>
      )}

      {canDelete ? (
        <div className="border-t border-border pt-lg">
          {deleteState && !deleteState.ok ? (
            <FormMessage tone="error" className="mb-sm">
              {deleteState.error.message}
            </FormMessage>
          ) : null}
          {confirmingDelete ? (
            <form action={deleteFormAction} className="flex items-center gap-sm">
              <input type="hidden" name="id" value={pageId} />
              <span className="font-sans text-caption text-text-secondary">Excluir de vez?</span>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                loading={deleting}
                loadingLabel="Excluindo…"
              >
                Confirmar exclusão
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
              Excluir rascunho
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
