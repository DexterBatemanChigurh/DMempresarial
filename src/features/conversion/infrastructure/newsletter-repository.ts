import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { newsletterSubscribers } from "@/db/schema";

export type CreateSubscriberInput = {
  email: string;
  name: string | null;
  consentAt: Date;
  consentVersion: string;
  confirmTokenHash: string;
  confirmExpiresAt: Date;
  source: string | null;
};

/** Busca assinante por e-mail (case-insensitive via citext). */
export async function findSubscriberByEmail(
  executor: Executor,
  email: string,
): Promise<{
  id: string;
  email: string;
  status: string;
  confirmTokenHash: string | null;
  confirmExpiresAt: Date | null;
} | null> {
  const [row] = await executor
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      status: newsletterSubscribers.status,
      confirmTokenHash: newsletterSubscribers.confirmTokenHash,
      confirmExpiresAt: newsletterSubscribers.confirmExpiresAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.email, email))
    .limit(1);
  return row ?? null;
}

/** Busca assinante por hash do token de confirmação. */
export async function findSubscriberByConfirmTokenHash(
  executor: Executor,
  tokenHash: string,
): Promise<{ id: string; email: string; status: string; confirmExpiresAt: Date | null } | null> {
  const [row] = await executor
    .select({
      id: newsletterSubscribers.id,
      email: newsletterSubscribers.email,
      status: newsletterSubscribers.status,
      confirmExpiresAt: newsletterSubscribers.confirmExpiresAt,
    })
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.confirmTokenHash, tokenHash))
    .limit(1);
  return row ?? null;
}

/** Insere novo assinante em PENDING com token de confirmação. */
export async function insertSubscriber(
  executor: Executor,
  input: CreateSubscriberInput,
): Promise<{ id: string }> {
  const [row] = await executor
    .insert(newsletterSubscribers)
    .values(input)
    .returning({ id: newsletterSubscribers.id });
  if (!row) throw new Error("Falha ao gravar o assinante.");
  return row;
}

/** Confirma assinante: PENDING → ACTIVE, limpa token, registra confirmedAt. */
export async function confirmSubscriber(executor: Executor, id: string): Promise<void> {
  await executor
    .update(newsletterSubscribers)
    .set({
      status: "ACTIVE",
      confirmedAt: sql`now()`,
      confirmTokenHash: null,
      confirmExpiresAt: null,
    })
    .where(eq(newsletterSubscribers.id, id));
}

/** Descadastro: ACTIVE/PENDING → UNSUBSCRIBED, registra unsubscribedAt. */
export async function unsubscribeSubscriber(executor: Executor, id: string): Promise<void> {
  await executor
    .update(newsletterSubscribers)
    .set({
      status: "UNSUBSCRIBED",
      unsubscribedAt: sql`now()`,
      confirmTokenHash: null,
      confirmExpiresAt: null,
    })
    .where(eq(newsletterSubscribers.id, id));
}

/** Reativa assinante: UNSUBSCRIBED/BOUNCED → PENDING (novo token será gerado na aplicação). */
export async function reinitSubscriber(executor: Executor, id: string): Promise<void> {
  await executor
    .update(newsletterSubscribers)
    .set({
      status: "PENDING",
      confirmTokenHash: null,
      confirmExpiresAt: null,
      confirmedAt: null,
      unsubscribedAt: null,
    })
    .where(eq(newsletterSubscribers.id, id));
}

/** Marca assinante como BOUNCED (falha de entrega do provedor de e-mail). */
export async function markSubscriberBounced(executor: Executor, id: string): Promise<void> {
  await executor
    .update(newsletterSubscribers)
    .set({ status: "BOUNCED" })
    .where(eq(newsletterSubscribers.id, id));
}

/** Verifica duplicado recente: mesmo e-mail na janela (para dedupe de clique duplo). */
export async function findRecentDuplicateSubscriber(
  executor: Executor,
  email: string,
  withinMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinMs);
  const [row] = await executor
    .select({ id: newsletterSubscribers.id })
    .from(newsletterSubscribers)
    .where(and(eq(newsletterSubscribers.email, email), gte(newsletterSubscribers.createdAt, since)))
    .limit(1);
  return row !== undefined;
}
