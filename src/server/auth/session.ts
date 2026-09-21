import "server-only";
import { headers } from "next/headers";
import { cache } from "react";
import { AppError } from "@/lib/errors";
import type { Actor } from "@/server/permissions";
import { actorFromUser } from "./actor";
import { getAuth } from "./auth";

/**
 * Sessão e ator do request atual, SEMPRE resolvidos no servidor a partir do cookie
 * (validado no banco). `cache` evita repetir a consulta dentro do mesmo request.
 */
export const getSession = cache(async () => getAuth().api.getSession({ headers: await headers() }));

/** Ator do request, ou `null` sem sessão / conta desativada / papel inválido. */
export async function getActor(): Promise<Actor | null> {
  const session = await getSession();
  return actorFromUser(session?.user);
}

/** Ator obrigatório: sem sessão válida lança `UNAUTHENTICATED`. Use no início de toda ação. */
export async function requireActor(): Promise<Actor> {
  const actor = await getActor();
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  return actor;
}
