import "server-only";
import type { EmailMessage, EmailPort } from "./port";

/**
 * Adaptador Resend (docs/03, parte 42) pela API HTTP — sem SDK. Lança em qualquer resposta que
 * não seja 2xx: quem chama decide (o lead fica com `notified_at` nulo, a inscrição continua
 * PENDING). O erro nunca carrega o corpo da mensagem, que pode ter dado pessoal.
 */
const ENDPOINT = "https://api.resend.com/emails";
const TIMEOUT_MS = 10_000;

export class EmailDeliveryError extends Error {
  constructor(readonly status: number) {
    super(`Resend recusou o envio (HTTP ${status}).`);
    this.name = "EmailDeliveryError";
  }
}

export function createResendEmailPort(
  config: { apiKey: string; from: string },
  fetchImpl: typeof fetch = fetch,
): EmailPort {
  return {
    async send(message: EmailMessage) {
      const response = await fetchImpl(ENDPOINT, {
        method: "POST",
        headers: {
          authorization: `Bearer ${config.apiKey}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          from: config.from,
          to: [message.to],
          subject: message.subject,
          text: message.text,
          ...(message.replyTo ? { reply_to: message.replyTo } : {}),
          ...(message.headers ? { headers: message.headers } : {}),
        }),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!response.ok) throw new EmailDeliveryError(response.status);
    },
  };
}
