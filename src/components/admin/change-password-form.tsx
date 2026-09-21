"use client";

import { useState, type FormEvent } from "react";
import { Button, FormMessage, TextField } from "@/components/ui";
import { authClient } from "./auth-client";
import { passwordChangeErrorMessage } from "./auth-messages";

export function ChangePasswordForm() {
  const [message, setMessage] = useState<{ tone: "error" | "success"; text: string } | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirm") ?? "")) {
      return setMessage({ tone: "error", text: "A confirmação não é igual à nova senha." });
    }
    setPending(true);
    setMessage(null);
    const { error } = await authClient.changePassword({
      currentPassword: String(form.get("currentPassword") ?? ""),
      newPassword,
      // Trocar a senha encerra as sessões nos outros aparelhos.
      revokeOtherSessions: true,
    });
    setPending(false);
    if (error) return setMessage({ tone: "error", text: passwordChangeErrorMessage(error) });
    formElement.reset();
    setMessage({ tone: "success", text: "Senha alterada. As outras sessões foram encerradas." });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-narrow space-y-lg" noValidate>
      {message ? <FormMessage tone={message.tone}>{message.text}</FormMessage> : null}
      <TextField
        id="currentPassword"
        name="currentPassword"
        label="Senha atual"
        type="password"
        autoComplete="current-password"
        required
      />
      <TextField
        id="newPassword"
        name="newPassword"
        label="Nova senha"
        type="password"
        autoComplete="new-password"
        hint="Pelo menos 12 caracteres."
        required
      />
      <TextField
        id="confirm"
        name="confirm"
        label="Repita a nova senha"
        type="password"
        autoComplete="new-password"
        required
      />
      <Button type="submit" loading={pending} loadingLabel="Salvando…">
        Alterar senha
      </Button>
    </form>
  );
}
