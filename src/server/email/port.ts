/**
 * Interface de envio de e-mail (docs/03, parte 42). Adaptadores: log (desenvolvimento, nunca
 * envia) e Resend (`resend-adapter.ts`); a escolha vem da configuração (`email/index.ts`).
 */
export type EmailMessage = {
  to: string;
  subject: string;
  text: string;
  /** Resposta vai para outro endereço (ex.: o e-mail de quem mandou o lead). */
  replyTo?: string;
  /** Cabeçalhos extras (ex.: `List-Unsubscribe`). */
  headers?: Record<string, string>;
};

export type EmailPort = {
  /** Lança se não conseguir enviar — quem chama decide o que fazer (ex.: deixar `notified_at`
   * nulo para o cron tentar de novo). */
  send(message: EmailMessage): Promise<void>;
};
