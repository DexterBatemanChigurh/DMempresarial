import "server-only";
import { redirect } from "next/navigation";
import { env } from "@/server/env";
import type { Actor } from "@/server/permissions";
import { actorFromUser } from "./actor";
import { getSession } from "./session";
import { decideAdminAccess } from "./two-factor-policy";

export type AdminContext = {
  actor: Actor;
  user: { name: string; email: string; twoFactorEnabled: boolean };
};

/**
 * Barreira REAL de acesso ao painel, chamada por todo layout, página e ação de admin. O Proxy só
 * faz um redirecionamento otimista por cookie; aqui a sessão é validada no banco, a conta
 * desativada é recusada e o 2FA obrigatório é exigido (docs/03, partes 10 e 11).
 *
 * `allowSetup`: usado só pela tela de segurança, para quem ainda precisa cadastrar o 2FA
 * conseguir chegar até ela sem entrar em laço de redirecionamento.
 */
export async function requireAdminSession(
  options: { allowSetup?: boolean } = {},
): Promise<AdminContext> {
  const session = await getSession();
  const actor = actorFromUser(session?.user);
  if (!session || !actor) redirect("/admin/login");

  const twoFactorEnabled = Boolean(session.user.twoFactorEnabled);
  const decision = decideAdminAccess({
    role: actor.role,
    twoFactorEnabled,
    enforce: env().REQUIRE_2FA,
  });
  if (decision === "setup-2fa" && !options.allowSetup) redirect("/admin/seguranca");

  return {
    actor,
    user: { name: session.user.name, email: session.user.email, twoFactorEnabled },
  };
}
