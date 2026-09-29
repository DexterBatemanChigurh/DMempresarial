"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, FormMessage, TextField } from "@/components/ui";
import { authClient } from "./auth-client";
import { loginErrorMessage } from "./auth-messages";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true);
    setError(null);
    const { error: failure } = await authClient.signIn.email({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
    setPending(false);

    if (failure) return setError(loginErrorMessage(failure));
    router.replace(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-lg" noValidate>
      {error ? <FormMessage tone="error">{error}</FormMessage> : null}
      <TextField
        id="email"
        name="email"
        label="E-mail"
        type="email"
        autoComplete="username"
        required
      />
      <TextField
        id="password"
        name="password"
        label="Senha"
        type="password"
        autoComplete="current-password"
        required
      />
      <Button type="submit" size="lg" loading={pending} loadingLabel="Entrando…" className="w-full">
        Entrar
      </Button>
    </form>
  );
}
