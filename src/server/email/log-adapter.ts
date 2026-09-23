import "server-only";
import { logger } from "@/server/logging/logger";
import type { EmailMessage, EmailPort } from "./port";

const log = logger.child({ module: "email" });

/** Nunca envia de verdade — só registra que enviaria. Sem provedor real escolhido ainda
 * (docs/03, seção 34, decisão aberta). Nunca loga o corpo: pode ser a mensagem pessoal do lead. */
export function createLogEmailPort(): EmailPort {
  return {
    async send(message: EmailMessage) {
      log.info("e-mail que seria enviado (adaptador de log, sem provedor real)", {
        to: message.to,
        subject: message.subject,
      });
    },
  };
}
