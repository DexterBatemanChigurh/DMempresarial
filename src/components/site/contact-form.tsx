"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  Button,
  CheckboxField,
  FormMessage,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/ui";
import { CONTACT_PAGE } from "@/content/dm";
import type { ActionResult } from "@/lib/result";

type Props = {
  action: (
    prevState: ActionResult<{ ok: true }> | null,
    formData: FormData,
  ) => Promise<ActionResult<{ ok: true }>>;
  formToken: string;
};

const FIELDS = ["segment", "name", "company", "email", "phone", "message"] as const;
type Field = (typeof FIELDS)[number];

/**
 * Formulário de contato (docs/03 §22), em três blocos lógicos numa página só: quem escreve
 * (nome, empresa), a situação (texto livre + tema opcional) e como responder (e-mail, WhatsApp).
 * A situação vem antes dos canais porque é a pergunta que a página promete; o tema é opcional e
 * vem depois dela, para ninguém ter de se diagnosticar antes de contar o que acontece.
 * Obrigatórios: nome, e-mail, WhatsApp, mensagem e consentimento — validados no SERVIDOR (o
 * navegador só ajuda). O campo isca (`empresa_confirmacao`) fica fora da tela por CSS, não por
 * `display:none`/`hidden` (alguns bots pulam esses dois de propósito) — ainda assim
 * `aria-hidden`+`tabIndex=-1`. `formToken` vem pronto do servidor. Campos controlados: o React
 * limpa o <form> após cada envio, e um erro não pode apagar o que foi digitado. Com erro, o foco
 * vai ao primeiro campo inválido. Sucesso redireciona para /contato/obrigado (a ação faz o
 * `redirect`).
 */
export function ContactForm({ action, formToken }: Props) {
  const [state, formAction, pending] = useActionState<ActionResult<{ ok: true }> | null, FormData>(
    action,
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const [values, setValues] = useState<Record<Field, string>>(
    () => Object.fromEntries(FIELDS.map((f) => [f, ""])) as Record<Field, string>,
  );
  const bind = (name: Field) => ({
    value: values[name],
    onChange: (event: { target: { value: string } }) =>
      setValues((prev) => ({ ...prev, [name]: event.target.value })),
  });
  const hasFieldErrors = Boolean(fieldErrors && Object.keys(fieldErrors).length > 0);
  const formRef = useRef<HTMLFormElement>(null);

  // Depois de um envio com erro, leva o foco ao primeiro campo inválido (teclado e leitor de
  // tela não ficam perdidos; no celular o campo aparece na tela).
  useEffect(() => {
    if (!hasFieldErrors) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state, hasFieldErrors]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2xl" noValidate>
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

      {state && !state.ok ? (
        <FormMessage tone="error">
          {hasFieldErrors
            ? "Confira os campos destacados abaixo."
            : state.error.code === "VALIDATION"
              ? "Não conseguimos confirmar o envio. Tente de novo em instantes; se esta página estiver aberta há muito tempo, recarregue-a. O que você escreveu foi mantido."
              : state.error.message ||
                "Não foi possível enviar sua mensagem neste momento. Tente novamente."}
        </FormMessage>
      ) : null}

      <fieldset className="space-y-md">
        <legend className="font-serif text-h4 font-medium text-text">Quem está escrevendo?</legend>
        <TextField
          id="name"
          label="Seu nome"
          required
          autoComplete="name"
          error={fieldErrors?.name?.[0]}
          {...bind("name")}
        />
        <TextField id="company" label="Empresa" autoComplete="organization" {...bind("company")} />
      </fieldset>

      <fieldset className="space-y-md">
        <legend className="font-serif text-h4 font-medium text-text">
          O que está acontecendo?
        </legend>
        <TextareaField
          id="message"
          label="Conte a situação com as suas palavras"
          hint="Pode ser em poucas linhas: o que está acontecendo, o que preocupa ou o que você gostaria de resolver."
          required
          rows={6}
          error={fieldErrors?.message?.[0]}
          {...bind("message")}
        />
        <SelectField
          id="segment"
          label="Tema da conversa"
          hint="Opcional. Se não souber qual é, pode deixar em branco."
          placeholder="Sem escolha por enquanto"
          options={CONTACT_PAGE.subjects}
          {...bind("segment")}
        />
      </fieldset>

      <fieldset className="space-y-md">
        <legend className="font-serif text-h4 font-medium text-text">
          Como podemos responder?
        </legend>
        <div className="grid gap-md sm:grid-cols-2">
          <TextField
            id="email"
            label="E-mail"
            type="email"
            required
            autoComplete="email"
            placeholder="nome@empresa.com.br"
            error={fieldErrors?.email?.[0]}
            {...bind("email")}
          />
          <TextField
            id="phone"
            label="WhatsApp"
            hint="Com DDD."
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            placeholder="(34) 90000-0000"
            error={fieldErrors?.phone?.[0]}
            {...bind("phone")}
          />
        </div>
      </fieldset>

      <div className="space-y-md">
        <CheckboxField id="consent" required error={fieldErrors?.consent?.[0]}>
          Concordo com o uso destes dados para a DM entrar em contato comigo, conforme a{" "}
          <Link
            href="/politica-de-privacidade"
            className="-my-md inline-block py-md text-link underline underline-offset-4"
          >
            Política de Privacidade
          </Link>
          .
        </CheckboxField>
        <Button type="submit" loading={pending} loadingLabel="Enviando sua mensagem…" size="lg">
          Enviar mensagem →
        </Button>
      </div>
    </form>
  );
}
