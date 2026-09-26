"use client";

import { useActionState, useState } from "react";
import { eraseLeadAction, transitionLeadAction } from "@/app/admin/(painel)/leads/actions";
import { Button, FormMessage } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import { LEAD_STATUS_LABEL, LEAD_TRANSITION_LABEL } from "./labels";

type Status = keyof typeof LEAD_STATUS_LABEL;
type Result = ActionResult<{ id: string }>;

export function LeadActions({
  id,
  status,
  transitions,
  canErase,
}: {
  id: string;
  status: Status;
  transitions: readonly Status[];
  canErase: boolean;
}) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(
    transitionLeadAction,
    null,
  );
  const [eraseState, eraseFormAction, erasing] = useActionState<Result | null, FormData>(
    eraseLeadAction,
    null,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-lg border border-border p-lg">
      <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
        Estado: {LEAD_STATUS_LABEL[status]}
      </p>
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      {transitions.length > 0 ? (
        <form action={formAction} className="flex flex-col items-start gap-sm">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="from" value={status} />
          {transitions.map((to) => (
            <Button
              key={to}
              type="submit"
              name="to"
              value={to}
              size="sm"
              variant="secondary"
              loading={pending}
              loadingLabel="Aplicando…"
            >
              {LEAD_TRANSITION_LABEL[to]}
            </Button>
          ))}
        </form>
      ) : (
        <p className="font-sans text-caption text-text-secondary">Estado final.</p>
      )}

      {canErase ? (
        <div className="border-t border-border pt-lg">
          {eraseState && !eraseState.ok ? (
            <FormMessage tone="error" className="mb-sm">
              {eraseState.error.message}
            </FormMessage>
          ) : null}
          {confirming ? (
            <form action={eraseFormAction} className="space-y-sm">
              <input type="hidden" name="id" value={id} />
              <p className="font-sans text-caption text-text-secondary">
                Apaga de vez os dados desta pessoa (pedido de exclusão, LGPD). A auditoria guarda só
                que houve a exclusão.
              </p>
              <div className="flex flex-wrap gap-sm">
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  loading={erasing}
                  loadingLabel="Excluindo…"
                >
                  Confirmar exclusão
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="tertiary"
                  onClick={() => setConfirming(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button type="button" size="sm" variant="tertiary" onClick={() => setConfirming(true)}>
              Excluir dados do lead
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
