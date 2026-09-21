import { ROLES, type Actor, type Role } from "@/server/permissions";

/**
 * Converte o usuário da sessão no `Actor` usado por `can(...)`. Puro e testável.
 * Devolve `null` (nunca um ator com privilégio) quando o usuário está desativado, o papel é
 * desconhecido ou falta o id: a autorização falha fechada.
 */
export type SessionUser = {
  id?: unknown;
  role?: unknown;
  disabledAt?: unknown;
};

export function actorFromUser(user: SessionUser | null | undefined): Actor | null {
  if (!user) return null;
  if (typeof user.id !== "string" || user.id === "") return null;
  if (user.disabledAt !== null && user.disabledAt !== undefined) return null;
  const role = user.role;
  if (typeof role !== "string" || !(ROLES as readonly string[]).includes(role)) return null;
  return { id: user.id, role: role as Role };
}
