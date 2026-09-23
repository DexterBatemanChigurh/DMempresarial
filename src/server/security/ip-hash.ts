import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
import { env } from "@/server/env";

/** IP do cliente a partir do cabeçalho que a hospedagem/proxy define (o Node não vê o socket
 * diretamente atrás de um proxy reverso). `null` se não houver cabeçalho — sem IP, sem rate
 * limit por IP (só por e-mail continua valendo). */
export async function getClientIp(): Promise<string | null> {
  const list = (await headers()).get("x-forwarded-for");
  return list?.split(",")[0]?.trim() || null;
}

/**
 * IP nunca é guardado (docs/03, parte 22): só um HMAC diário, para limite de taxa/dedupe. Muda
 * todo dia (a data entra no HMAC), então não dá para cruzar hashes de dias diferentes e
 * reidentificar alguém — só serve para "é a mesma origem, hoje".
 */
export function hashIpForToday(ip: string, now: Date = new Date()): string {
  const day = now.toISOString().slice(0, 10);
  const secret = env().BETTER_AUTH_SECRET ?? "dev-only-insecure-secret-32-chars!!";
  return createHmac("sha256", secret).update(`${day}:${ip}`).digest("hex");
}
