import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "@/server/env";

/**
 * Token de tempo mínimo assinado (docs/03, parte 22: "honeypot + token de tempo mínimo
 * (assinado)"). Um bot que preenche e envia o formulário em milissegundos é bloqueado sem
 * CAPTCHA: o token carrega o instante em que o formulário foi montado, assinado por HMAC para
 * que o cliente não possa forjar um valor antigo. Reaproveita `BETTER_AUTH_SECRET` (segredo de
 * uso geral da aplicação, não um segredo novo por formulário).
 */
function sign(payload: string): string {
  return createHmac("sha256", env().BETTER_AUTH_SECRET ?? "dev-only-insecure-secret-32-chars!!")
    .update(payload)
    .digest("base64url");
}

export function mintFormToken(now: Date = new Date()): string {
  const issuedAt = String(now.getTime());
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifyFormToken(
  token: string,
  options: { minAgeMs: number; maxAgeMs: number; now?: Date },
): boolean {
  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature || !/^\d+$/.test(issuedAt)) return false;

  const expected = sign(issuedAt);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  const age = (options.now ?? new Date()).getTime() - Number(issuedAt);
  return age >= options.minAgeMs && age <= options.maxAgeMs;
}
