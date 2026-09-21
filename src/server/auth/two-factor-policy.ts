import type { Role } from "@/server/permissions";

/**
 * Política de segundo fator (decisão T-05, docs/03): ADMIN e EDITOR precisam ter 2FA ativo para
 * usar o painel, pois administram conteúdo público e, na fase de leads, dados pessoais. AUTHOR
 * não (só escreve rascunhos). Puro: a leitura da configuração e o redirecionamento ficam fora.
 */
const ROLES_REQUIRING_2FA: readonly Role[] = ["ADMIN", "EDITOR"];

export function requiresTwoFactor(role: Role): boolean {
  return ROLES_REQUIRING_2FA.includes(role);
}

export type AccessDecision = "allow" | "setup-2fa";

/** Decide se o ator pode usar o painel ou deve antes configurar o 2FA. */
export function decideAdminAccess(input: {
  role: Role;
  twoFactorEnabled: boolean;
  enforce: boolean;
}): AccessDecision {
  if (!input.enforce) return "allow";
  if (requiresTwoFactor(input.role) && !input.twoFactorEnabled) return "setup-2fa";
  return "allow";
}
