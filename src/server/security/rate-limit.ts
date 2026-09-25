import "server-only";
import { sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { rateLimits } from "@/db/schema";

/** Chave por janela fixa: a própria chave muda quando a janela muda, então o contador da janela
 * anterior fica esquecido sozinho (limpeza periódica pode apagar linhas velhas sem risco). */
export function windowedKey(prefix: string, identifier: string, windowMs: number): string {
  const bucket = Math.floor(Date.now() / windowMs);
  return `${prefix}:${identifier}:${bucket}`;
}

/** Incrementa atomicamente (`INSERT ... ON CONFLICT`) e devolve a contagem da janela atual. */
export async function consumeRateLimit(executor: Executor, key: string): Promise<number> {
  const [row] = await executor
    .insert(rateLimits)
    .values({ key })
    .onConflictDoUpdate({
      target: rateLimits.key,
      set: { count: sql`${rateLimits.count} + 1` },
    })
    .returning({ count: rateLimits.count });
  return row?.count ?? 1;
}
