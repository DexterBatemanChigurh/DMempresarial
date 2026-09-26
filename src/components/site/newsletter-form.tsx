"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, CheckboxField, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

type Result = ActionResult<{ ok: true }>;

type Props = {
  action: (prevState: Result | null, formData: FormData) => Promise<Result>;
  formToken: string;
  /** De onde veio a inscrição (ex.: `blog`, `artigo`): vai para a coluna `source`. */
  source: string;
};

/**
 * Inscrição na newsletter (docs/01 §23): nome, e-mail e consentimento, sem pop-up. Mesmo desenho
 * anti-bot do formulário de contato (campo isca fora da tela + token de tempo mínimo). A resposta
 * de sucesso é sempre igual, para não revelar se o e-mail já estava inscrito.
 */
export function NewsletterForm({ action, formToken, source }: Props) {
  const [state, formAction, pending] = useActionState<Result | null, FormData>(action, null);
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  if (state?.ok) {
    return (
      <FormMessage tone="success" title="Quase lá">
        Enviamos um link de confirmação para o seu e-mail. A inscrição só vale depois do clique.
      </FormMessage>
    );
  }

  return (
    <form action={formAction} className="space-y-md">
      <input type="hidden" name="formToken" value={formToken} />
      <input type="hidden" name="source" value={source} />
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label htmlFor={`empresa_confirmacao-${source}`}>Não preencha este campo</label>
        <input
          id={`empresa_confirmacao-${source}`}
          name="empresa_confirmacao"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      {state && !state.ok ? <FormMessage tone="error">{state.error.message}</FormMessage> : null}

      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
        <TextField
          id={`newsletter-name-${source}`}
          name="name"
          label="Nome"
          autoComplete="name"
          error={fieldErrors?.name?.[0]}
        />
        <TextField
          id={`newsletter-email-${source}`}
          name="email"
          label="E-mail"
          type="email"
          required
          autoComplete="email"
          error={fieldErrors?.email?.[0]}
        />
      </div>
      <CheckboxField
        id={`newsletter-consent-${source}`}
        name="consent"
        required
        error={fieldErrors?.consent?.[0]}
      >
        Quero receber os conteúdos da DM por e-mail. Posso cancelar a qualquer momento (
        <Link href="/politica-de-privacidade" className="text-link underline underline-offset-4">
          Política de Privacidade
        </Link>
        ).
      </CheckboxField>
      <Button type="submit" variant="secondary" loading={pending}>
        Receber conteúdos
      </Button>
    </form>
  );
}
