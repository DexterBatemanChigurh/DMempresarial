import "server-only";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { leads } from "@/db/schema";

export type CreateLeadInput = {
  name: string;
  email: string;
  message: string;
  phone: string | null;
  company: string | null;
  jobTitle: string | null;
  segment: string | null;
  website: string | null;
  consentAt: Date;
  consentVersion: string;
  ipHash: string | null;
};

/** Mesmo e-mail + mesma mensagem numa janela curta = duplicado (clique duplo, reenvio). */
export async function findRecentDuplicateLead(
  executor: Executor,
  email: string,
  message: string,
  withinMs: number,
): Promise<boolean> {
  const since = new Date(Date.now() - withinMs);
  const [row] = await executor
    .select({ id: leads.id })
    .from(leads)
    .where(and(eq(leads.email, email), eq(leads.message, message), gte(leads.createdAt, since)))
    .limit(1);
  return row !== undefined;
}

export async function insertLead(
  executor: Executor,
  input: CreateLeadInput,
): Promise<{ id: string }> {
  const [row] = await executor.insert(leads).values(input).returning({ id: leads.id });
  if (!row) throw new Error("Falha ao gravar o lead.");
  return row;
}

/** Heurística simples (docs/03 parte 22): muitos links na mensagem é sinal forte de spam. */
export function countLinks(text: string): number {
  return (text.match(/https?:\/\//gi) ?? []).length;
}

export async function markLeadAsSpam(executor: Executor, id: string): Promise<void> {
  await executor.update(leads).set({ status: "SPAM" }).where(eq(leads.id, id));
}

export async function markLeadNotified(executor: Executor, id: string): Promise<void> {
  await executor
    .update(leads)
    .set({ notifiedAt: sql`now()` })
    .where(eq(leads.id, id));
}
