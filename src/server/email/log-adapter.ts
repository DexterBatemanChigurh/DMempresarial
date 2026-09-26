import "server-only";
import { logger } from "@/server/logging/logger";
import type { EmailMessage, EmailPort } from "./port";

const log = logger.child({ module: "email" });

/** Nunca envia de verdade — só registra que enviaria (desenvolvimento, ou sem RESEND_API_KEY).
 * Nunca loga o corpo: pode ser a mensagem pessoal do lead. */
export function createLogEmailPort(): EmailPort {
  return {
    async send(message: EmailMessage) {
      log.info("e-mail que seria enviado (adaptador de log: RESEND_API_KEY não configurada)", {
        to: message.to,
        subject: message.subject,
      });
    },
  };
}
