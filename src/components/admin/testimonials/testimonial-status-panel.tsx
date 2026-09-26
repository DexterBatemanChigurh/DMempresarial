"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteTestimonialAction,
  transitionTestimonialAction,
  type TestimonialMutated,
} from "@/app/admin/(painel)/depoimentos/actions";
import { Button, FormMessage } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { TestimonialStatus } from "@/features/proof/domain/proof";

const STATUS_LABEL: Record<TestimonialStatus, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Oculto",
};
const TRANSITION_LABEL: Record<TestimonialStatus, string> = {
  DRAFT: "Voltar para rascunho",
  PUBLISHED: "Publicar",
  ARCHIVED: "Ocultar do site",
};

type Props = {
  testimonialId: string;
  status: TestimonialStatus;
  version: number;
  targets: readonly TestimonialStatus[];
};

export function TestimonialStatusPanel({ testimonialId, status, version, targets }: Props) {
  const router = useRouter();
  const [transitionState, transitionFormAction, transitionPending] = useActionState<
    ActionResult<TestimonialMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await transitionTestimonialAction(prevState, formData);
    if (result.ok) router.refresh();
    return result;
  }, null);
  const [deleteState, deleteFormAction, deleting] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deleteTestimonialAction, null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <div className="space-y-lg border border-border p-lg">
      <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
        Status: {STATUS_LABEL[status]}
      </p>
      {transitionState && !transitionState.ok ? (
        <FormMessage tone="error">{transitionState.error.message}</FormMessage>
      ) : null}

      <form action={transitionFormAction} className="flex flex-wrap gap-sm">
        <input type="hidden" name="id" value={testimonialId} />
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

      <div className="border-t border-border pt-lg">
        {deleteState && !deleteState.ok ? (
          <FormMessage tone="error" className="mb-sm">
            {deleteState.error.message}
          </FormMessage>
        ) : null}
        {confirmingDelete ? (
          <form action={deleteFormAction} className="flex flex-wrap items-center gap-sm">
            <input type="hidden" name="id" value={testimonialId} />
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
            Excluir
          </Button>
        )}
      </div>
    </div>
  );
}
