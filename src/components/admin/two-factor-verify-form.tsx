"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, FormMessage, TextField } from "@/components/ui";
import { authClient } from "./auth-client";
import { twoFactorErrorMessage } from "./auth-messages";

export function TwoFactorVerifyForm({ next }: { next: string }) {
  const router = useRouter();
  const [useBackup, setUseBackup] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const code = String(new FormData(event.currentTarget).get("code") ?? "").trim();
    setPending(true);
    setError(null);
    const { error: failure } = useBackup
      ? await authClient.twoFactor.verifyBackupCode({ code })
      : await authClient.twoFactor.verifyTotp({ code });
    setPending(false);
    if (failure) return setError(twoFactorErrorMessage(failure, useBackup ? "backup" : "totp"));
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-lg" noValidate>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <TextField
        key={useBackup ? "backup" : "totp"}
        id="code"
        name="code"
        label={useBackup ? "Código de backup" : "Código do app autenticador"}
        hint={
          useBackup
            ? "Cada código de backup vale uma única vez."
            : "Os 6 números que aparecem no app."
        }
        inputMode={useBackup ? "text" : "numeric"}
        autoComplete="one-time-code"
        required
      />
      <Button
        type="submit"
        size="lg"
        loading={pending}
        loadingLabel="Verificando…"
        className="w-full"
      >
        Verificar
      </Button>
      <Button
        type="button"
        variant="tertiary"
        onClick={() => {
          setUseBackup((value) => !value);
          setError(null);
        }}
      >
        {useBackup ? "Usar o app autenticador" : "Usar um código de backup"}
      </Button>
    </form>
  );
}
