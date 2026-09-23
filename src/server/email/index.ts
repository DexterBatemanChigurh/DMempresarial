import "server-only";
import { createLogEmailPort } from "./log-adapter";
import type { EmailPort } from "./port";

export type { EmailMessage, EmailPort } from "./port";

const globalForEmail = globalThis as unknown as { __dmEmail?: EmailPort };

/** E-mail configurado para este ambiente. Hoje sempre o adaptador de log (sem provedor real). */
export function getEmail(): EmailPort {
  globalForEmail.__dmEmail ??= createLogEmailPort();
  return globalForEmail.__dmEmail;
}
