import type { ActionError } from "./errors";

/**
 * Resultado de ações e serviços. Erros esperados voltam como valor (não como exceção);
 * só o inesperado é lançado e vai para o rastreamento de erros.
 */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: ActionError };

export function ok<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

export function fail(error: ActionError): ActionResult<never> {
  return { ok: false, error };
}
