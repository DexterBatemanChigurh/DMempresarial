"use client";

import { useActionState } from "react";
import { Button, CheckboxField, FormMessage, TextareaField, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

type Props = {
  action: (
    prevState: ActionResult<{ ok: true }> | null,
    formData: FormData,
  ) => Promise<ActionResult<{ ok: true }>>;
  formToken: string;
};

/**
 * Formulário de contato de verdade (docs/03 §22): 3 campos obrigatórios (nome, e-mail, mensagem)
 * + opcionais + consentimento por último. O campo isca (`empresa_confirmacao`) fica fora da
 * tela por CSS, não por `display:none`/`hidden` (alguns bots pulam esses dois de propósito) —
 * ainda assim marcado `aria-hidden`+`tabIndex=-1` para nunca aparecer a quem usa teclado/leitor
 * de tela. `formToken` vem pronto do servidor (minted em cada carregamento da página).
 */
export function ContactForm({ action, formToken }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult<{ ok: true }> | null, FormData>(
    action,
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <form action={formAction} className="space-y-lg">
      <input type="hidden" name="formToken" value={formToken} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor="empresa_confirmacao">Não preencha este campo</label>
        <input
          id="empresa_confirmacao"
          name="empresa_confirmacao"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}

      <TextField
        id="name"
        label="Nome"
        required
        autoComplete="name"
        error={fieldErrors?.name?.[0]}
      />
      <TextField
        id="email"
        label="E-mail"
        type="email"
        required
        autoComplete="email"
        error={fieldErrors?.email?.[0]}
      />
      <TextareaField id="message" label="Mensagem" required error={fieldErrors?.message?.[0]} />
      <TextField id="phone" label="Telefone" type="tel" autoComplete="tel" />
      <TextField id="company" label="Empresa" autoComplete="organization" />
      <TextField id="jobTitle" label="Cargo" />
      <CheckboxField id="consent" required error={fieldErrors?.consent?.[0]}>
        Concordo com o uso destes dados para a DM entrar em contato comigo.
      </CheckboxField>

      <Button type="submit" loading={pending} size="lg">
        Enviar mensagem
      </Button>
    </form>
  );
}
