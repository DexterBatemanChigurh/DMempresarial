import "server-only";
import type { Executor } from "@/db/client";
import { Depoimento } from "../domain/proof";

/**
 * Repositório de depoimentos/prova social.
 * Por enquanto usa dados em memória (seed) — futuramente tabela `depoimentos` no banco.
 */
export async function listPublishedDepoimentos(_executor: Executor): Promise<Depoimento[]> {
  // TODO: substituir por query real quando tabela `depoimentos` existir
  const { DEPOIMENTOS_SEED } = await import("../domain/proof");
  return DEPOIMENTOS_SEED.filter((d) => d.visivel).sort((a, b) => a.ordem - b.ordem);
}

export async function countPublishedDepoimentos(_executor: Executor): Promise<number> {
  const { DEPOIMENTOS_SEED } = await import("../domain/proof");
  return DEPOIMENTOS_SEED.filter((d) => d.visivel).length;
}

export type { Depoimento } from "../domain/proof";
