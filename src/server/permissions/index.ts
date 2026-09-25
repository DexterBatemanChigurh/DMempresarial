import "server-only";
import { AppError } from "@/lib/errors";

export const ROLES = ["ADMIN", "EDITOR", "AUTHOR"] as const;
export type Role = (typeof ROLES)[number];

export const ACTIONS = [
  "post:create",
  "post:edit",
  "post:submit",
  "post:publish",
  "post:archive",
  "post:delete-draft",
  "taxonomy:manage",
  "specialist:manage",
  "specialist:edit-own",
  "solution:manage",
  "page:manage",
  "media:upload",
  "media:manage",
  "media:delete",
  "lead:view",
  "lead:update",
  "lead:export",
  "lead:erase",
  "subscriber:view",
  "user:manage",
  "settings:manage",
  "redirect:manage",
  "audit:view",
] as const;
export type Action = (typeof ACTIONS)[number];

export type PostStatus = "DRAFT" | "REVIEW" | "SCHEDULED" | "PUBLISHED" | "ARCHIVED";

/** Quem está agindo, já resolvido no servidor a partir da sessão (nunca vindo do cliente). */
export type Actor = { id: string; role: Role; disabled?: boolean };

/** Dados do recurso, carregados do banco, necessários às regras de propriedade. */
export type Resource = {
  /** Usuário que criou / a quem pertence o recurso. */
  ownerId?: string | null;
  status?: PostStatus;
  /** Artigo que já esteve publicado alguma vez (não pode ser excluído). */
  hasBeenPublished?: boolean;
};

type Rule = (actor: Actor, resource: Resource | undefined) => boolean;

const always: Rule = () => true;
const isOwner = (actor: Actor, r: Resource | undefined) =>
  r?.ownerId != null && r.ownerId === actor.id;
const isOwnerOfDraft: Rule = (actor, r) => isOwner(actor, r) && r?.status === "DRAFT";
const deletableDraft: Rule = (actor, r) =>
  r?.status === "DRAFT" &&
  r.hasBeenPublished !== true &&
  (actor.role === "ADMIN" || isOwner(actor, r));

// Ausência de entrada = NEGADO. Matriz de referência: docs/03, parte 12.
// Leads e assinantes: somente ADMIN (decisão T-04, padrão recomendado).
const POLICY: Record<Role, Partial<Record<Action, Rule>>> = {
  ADMIN: {
    ...(Object.fromEntries(ACTIONS.map((action) => [action, always])) as Record<Action, Rule>),
    // Nem o ADMIN apaga definitivamente algo que já esteve público (quebraria links e histórico).
    "post:delete-draft": deletableDraft,
  },
  EDITOR: {
    "post:create": always,
    "post:edit": always,
    "post:submit": always,
    "post:publish": always,
    "post:archive": always,
    "taxonomy:manage": always,
    "specialist:manage": always,
    "solution:manage": always,
    "page:manage": always,
    "media:upload": always,
    "media:manage": always,
    "media:delete": always,
    "redirect:manage": always,
  },
  AUTHOR: {
    "post:create": always,
    "post:edit": isOwnerOfDraft,
    "post:submit": isOwnerOfDraft,
    "post:delete-draft": deletableDraft,
    "specialist:edit-own": isOwner,
    "media:upload": always,
    "media:manage": isOwner,
    "media:delete": isOwner,
  },
};

function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

function isAction(value: unknown): value is Action {
  return typeof value === "string" && (ACTIONS as readonly string[]).includes(value);
}

/** `true` só se o papel do ator permite a ação (e, quando exigido, se ele é dono do recurso). */
export function can(actor: Actor | null | undefined, action: Action, resource?: Resource): boolean {
  if (!actor || actor.disabled === true) return false;
  // Valores desconhecidos (inclusive chaves de protótipo como "constructor") negam.
  if (!isRole(actor.role) || !isAction(action) || !actor.id) return false;
  const rule = Object.hasOwn(POLICY[actor.role], action) ? POLICY[actor.role][action] : undefined;
  return rule ? rule(actor, resource) : false;
}

/**
 * Versão que lança. Sem sessão → UNAUTHENTICATED. Sem permissão → FORBIDDEN, ou NOT_FOUND
 * quando `hideExistence` é verdadeiro (não revelar a existência de objeto alheio: BOLA/IDOR).
 */
export function assertCan(
  actor: Actor | null | undefined,
  action: Action,
  resource?: Resource,
  options: { hideExistence?: boolean } = {},
): asserts actor is Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  if (can(actor, action, resource)) return;
  if (options.hideExistence) throw new AppError("NOT_FOUND", `Recurso oculto para ${action}.`);
  throw new AppError("FORBIDDEN", `Papel ${String(actor.role)} não pode ${action}.`);
}
