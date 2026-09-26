import "server-only";
import { env } from "@/server/env";
import { createLogEmailPort } from "./log-adapter";
import { createResendEmailPort } from "./resend-adapter";
import type { EmailPort } from "./port";

export type { EmailMessage, EmailPort } from "./port";

const globalForEmail = globalThis as unknown as { __dmEmail?: EmailPort };

/** E-mail configurado para este ambiente: Resend quando há chave, senão o adaptador de log. */
export function getEmail(): EmailPort {
  if (!globalForEmail.__dmEmail) {
    const config = env().EMAIL;
    globalForEmail.__dmEmail =
      config.driver === "resend" ? createResendEmailPort(config) : createLogEmailPort();
  }
  return globalForEmail.__dmEmail;
}
