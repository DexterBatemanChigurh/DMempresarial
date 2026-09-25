import "server-only";
import { env } from "@/server/env";

const ALGO = { name: "HMAC", hash: "SHA-256" };

async function getKey(purpose: string): Promise<CryptoKey> {
  const secret = env().SIGNED_TOKEN_SECRET;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret + ":" + purpose),
    ALGO,
    false,
    ["sign", "verify"],
  );
  return keyMaterial;
}

/**
 * Assina um payload (objeto simples) com HMAC-SHA256.
 * O token é `base64url(payload).base64url(signature)`.
 * Não criptografa o payload — só garante integridade e autenticidade.
 */
export async function signToken(
  payload: Record<string, unknown>,
  purpose: string,
): Promise<string> {
  const key = await getKey(purpose);
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(ALGO, key, new TextEncoder().encode(encodedPayload));
  return `${encodedPayload}.${base64url(signature)}`;
}

/**
 * Verifica e decodifica um token assinado.
 * Retorna o payload se válido, `null` se inválido/expirado/adulterado.
 */
export async function verifyToken(
  token: string,
  purpose: string,
): Promise<Record<string, unknown> | null> {
  try {
    const [encodedPayload, encodedSig] = token.split(".");
    if (!encodedPayload || !encodedSig || token.split(".").length !== 2) return null;

    const key = await getKey(purpose);
    const valid = await crypto.subtle.verify(
      ALGO,
      key,
      base64urlToBytes(encodedSig) as BufferSource,
      new TextEncoder().encode(encodedPayload),
    );
    if (!valid) return null;

    const payload = JSON.parse(new TextDecoder().decode(base64urlToBytes(encodedPayload)));
    if (payload.exp && Date.now() > payload.exp) return null;
    if (payload.nbf && Date.now() < payload.nbf) return null;

    return payload;
  } catch {
    return null;
  }
}

/** Cria token de confirmação de newsletter (expira em 48h, uso único). */
export async function createNewsletterConfirmToken(email: string): Promise<string> {
  return signToken(
    { email, purpose: "newsletter:confirm", exp: Date.now() + 48 * 60 * 60 * 1000 },
    "newsletter:confirm",
  );
}

/** Cria token de descadastro de newsletter (sem expiração longa, uso único). */
export async function createNewsletterUnsubscribeToken(email: string): Promise<string> {
  return signToken(
    { email, purpose: "newsletter:unsubscribe", exp: Date.now() + 365 * 24 * 60 * 60 * 1000 },
    "newsletter:unsubscribe",
  );
}

function base64url(input: string | ArrayBuffer): string {
  const bytes =
    input instanceof ArrayBuffer ? new Uint8Array(input) : new TextEncoder().encode(input);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function base64urlToBytes(input: string): Uint8Array {
  const padded =
    input.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (input.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
