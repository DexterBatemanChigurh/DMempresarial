"use client";

import { useActionState, useState } from "react";
import { eraseSubscriberAction } from "@/app/admin/(painel)/leads/actions";
import { Button, FormMessage } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

/** Exclusão definitiva de um assinante (pedido de eliminação, LGPD), com confirmação. */
export function SubscriberEraseButton({ id }: { id: string }) {
  const [state, formAction, pending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(eraseSubscriberAction, null);
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <Button type="button" size="sm" variant="tertiary" onClick={() => setConfirming(true)}>
        Excluir
      </Button>
    );
  }
  return (
    <form action={formAction} className="flex flex-wrap items-center gap-sm">
      <input type="hidden" name="id" value={id} />
      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        loading={pending}
        loadingLabel="Excluindo…"
      >
        Confirmar exclusão
      </Button>
      <Button type="button" size="sm" variant="tertiary" onClick={() => setConfirming(false)}>
        Cancelar
      </Button>
    </form>
  );
}
