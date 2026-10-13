import "server-only";
import { createHmac } from "node:crypto";
import { AppError } from "@/lib/errors";
import { env } from "@/server/env";

export type SecretPurpose = "ip-hash" | "form-token";

/**
 * Chave própria de cada finalidade, derivada de `BETTER_AUTH_SECRET` por HMAC com um rótulo
 * (separação de domínio): um valor produzido para uma finalidade nunca vale em outra, e as chaves
 * não revelam o segredo de sessão. Sem o segredo configurado FALHA — nunca há chave padrão
 * embutida no código (em production o `env()` já exige a variável).
 */
export function deriveSecret(purpose: SecretPurpose): Buffer {
  const secret = env().BETTER_AUTH_SECRET;
  if (!secret) throw new AppError("UNEXPECTED", "BETTER_AUTH_SECRET não está configurada.");
  return createHmac("sha256", secret).update(`dm-empresarial:${purpose}`).digest();
}
