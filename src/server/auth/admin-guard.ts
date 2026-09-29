import "server-only";
import { redirect } from "next/navigation";
import type { Actor } from "@/server/permissions";
import { actorFromUser } from "./actor";
import { getSession } from "./session";

export type AdminContext = {
  actor: Actor;
  user: { name: string; email: string };
};

/**
 * Barreira REAL de acesso ao painel, chamada por todo layout, página e ação de admin. O Proxy só
 * faz um redirecionamento otimista por cookie; aqui a sessão é validada no banco e a conta
 * desativada é recusada (docs/03, partes 10 e 11). Sem 2FA por decisão do usuário (28/09): o
 * segundo fator volta numa fase futura.
 */
export async function requireAdminSession(): Promise<AdminContext> {
  const session = await getSession();
  const actor = actorFromUser(session?.user);
  if (!session || !actor) redirect("/admin/login");

  return { actor, user: { name: session.user.name, email: session.user.email } };
}
