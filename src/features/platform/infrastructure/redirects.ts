import "server-only";
import { eq } from "drizzle-orm";
import type { Executor, Transaction } from "@/db/client";
import { redirects } from "@/db/schema";

export type RedirectTarget = { toPath: string; statusCode: number };

/** Destino de um caminho antigo, se houver. Usado quando a página de conteúdo não acha o slug. */
export async function findRedirect(
  executor: Executor,
  path: string,
): Promise<RedirectTarget | null> {
  const [row] = await executor
    .select({ toPath: redirects.toPath, statusCode: redirects.statusCode })
    .from(redirects)
    .where(eq(redirects.fromPath, path))
    .limit(1);
  return row ?? null;
}

/**
 * Registra `from → to` quando um slug já publicado muda (301 automático).
 *  - remove um redirecionamento que sairia de `to` (renomear de volta não pode formar laço);
 *  - reaponta as correntes (A→B vira A→C quando B passa a C), para nunca haver salto duplo;
 *  - grava (ou atualiza) `from → to`.
 */
export async function addAutoRedirect(
  tx: Transaction,
  input: { from: string; to: string; actorId?: string | null },
): Promise<void> {
  await tx.delete(redirects).where(eq(redirects.fromPath, input.to));
  await tx.update(redirects).set({ toPath: input.to }).where(eq(redirects.toPath, input.from));
  await tx
    .insert(redirects)
    .values({
      fromPath: input.from,
      toPath: input.to,
      origin: "AUTO",
      createdBy: input.actorId ?? null,
    })
    .onConflictDoUpdate({ target: redirects.fromPath, set: { toPath: input.to } });
}
