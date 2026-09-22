/**
 * Trava de segurança sem base explícita nos docs, mas necessária: sem ela um ADMIN consegue
 * desativar a própria conta ou rebaixar o último ADMIN e travar o painel para sempre (ninguém
 * mais consegue gerenciar usuários). Puro: recebe os dados já carregados.
 */
export type UserGuardCode = "SELF_TARGET" | "LAST_ADMIN";
export class UserGuardError extends Error {
  constructor(readonly code: UserGuardCode) {
    super(code);
  }
}

export function assertNotSelf(actorId: string, targetId: string): void {
  if (actorId === targetId) throw new UserGuardError("SELF_TARGET");
}

export function assertKeepsAtLeastOneAdmin(input: {
  targetIsCurrentlyActiveAdmin: boolean;
  activeAdminCount: number;
  targetWillStayActiveAdmin: boolean;
}): void {
  if (
    input.targetIsCurrentlyActiveAdmin &&
    !input.targetWillStayActiveAdmin &&
    input.activeAdminCount <= 1
  ) {
    throw new UserGuardError("LAST_ADMIN");
  }
}
