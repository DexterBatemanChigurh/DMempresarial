import "server-only";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { generatePassword } from "@/lib/password";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, ROLES, type Actor, type Role } from "@/server/permissions";
import { assertKeepsAtLeastOneAdmin, assertNotSelf, UserGuardError } from "../domain/user-rules";
import {
  countActiveAdmins,
  createUserWithPassword,
  findUserByEmail,
  findUserById,
  listUsers,
  setUserDisabled,
  setUserRole,
  type UserSummary,
} from "../infrastructure/user-repository";

/**
 * Gestão de usuários (docs/03, parte 45 / HANDOFF incremento 5): só ADMIN. Nunca apaga — desativa
 * (`disabled_at`) para preservar autoria e auditoria. Sem senha padrão: gera uma temporária,
 * devolvida uma única vez para quem criou mostrar à pessoa.
 */
type Deps = { db: Database };

const GUARD_MESSAGE: Record<UserGuardError["code"], string> = {
  SELF_TARGET: "Você não pode alterar a própria conta por aqui.",
  LAST_ADMIN: "Precisa sobrar pelo menos um ADMIN ativo.",
};

function toGuardError(error: unknown): never {
  if (error instanceof UserGuardError) {
    throw new AppError("DOMAIN_RULE", GUARD_MESSAGE[error.code]);
  }
  throw error;
}

export type CreateUserInput = {
  actor: Actor | null | undefined;
  name: string;
  email: string;
  role: Role;
  requestId?: string;
};

export async function createUser(
  { db }: Deps,
  input: CreateUserInput,
): Promise<{ id: string; email: string; temporaryPassword: string }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "user:manage");

  const fieldErrors: Record<string, string[]> = {};
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();
  if (name === "") fieldErrors.name = ["Nome obrigatório."];
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) fieldErrors.email = ["E-mail inválido."];
  if (!(ROLES as readonly string[]).includes(input.role)) fieldErrors.role = ["Papel inválido."];
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
  }

  if (await findUserByEmail(db, email)) {
    throw new AppError("VALIDATION", "E-mail já cadastrado.", {
      fieldErrors: { email: ["Já existe uma conta com este e-mail."] },
    });
  }

  const id = randomUUID();
  const temporaryPassword = generatePassword();
  const passwordHash = await hashPassword(temporaryPassword);

  return db.transaction(async (tx) => {
    await createUserWithPassword(tx, { id, name, email, role: input.role, passwordHash });
    await recordAudit(tx, {
      actorId: actor.id,
      action: "user.created",
      entityType: "user",
      entityId: id,
      metadata: { role: input.role },
      requestId: input.requestId,
    });
    return { id, email, temporaryPassword };
  });
}

export type SetUserRoleInput = {
  actor: Actor | null | undefined;
  userId: string;
  role: Role;
  requestId?: string;
};

export async function setRole({ db }: Deps, input: SetUserRoleInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "user:manage");

  if (!(ROLES as readonly string[]).includes(input.role)) {
    throw new AppError("VALIDATION", "Confira os campos.", {
      fieldErrors: { role: ["Papel inválido."] },
    });
  }

  const target = await findUserById(db, input.userId);
  if (!target) throw new AppError("NOT_FOUND", "Usuário inexistente.");

  try {
    assertNotSelf(actor.id, input.userId);
    assertKeepsAtLeastOneAdmin({
      targetIsCurrentlyActiveAdmin: target.role === "ADMIN" && target.disabledAt === null,
      activeAdminCount: await countActiveAdmins(db),
      targetWillStayActiveAdmin: input.role === "ADMIN",
    });
  } catch (error) {
    toGuardError(error);
  }

  await db.transaction(async (tx) => {
    await setUserRole(tx, input.userId, input.role);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "user.role_changed",
      entityType: "user",
      entityId: input.userId,
      metadata: { from: target.role, to: input.role },
      requestId: input.requestId,
    });
  });
}

export type SetUserDisabledInput = {
  actor: Actor | null | undefined;
  userId: string;
  disabled: boolean;
  requestId?: string;
};

export async function setDisabled({ db }: Deps, input: SetUserDisabledInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "user:manage");

  const target = await findUserById(db, input.userId);
  if (!target) throw new AppError("NOT_FOUND", "Usuário inexistente.");

  try {
    if (input.disabled) {
      assertNotSelf(actor.id, input.userId);
      assertKeepsAtLeastOneAdmin({
        targetIsCurrentlyActiveAdmin: target.role === "ADMIN" && target.disabledAt === null,
        activeAdminCount: await countActiveAdmins(db),
        targetWillStayActiveAdmin: false,
      });
    }
  } catch (error) {
    toGuardError(error);
  }

  await db.transaction(async (tx) => {
    await setUserDisabled(tx, input.userId, input.disabled);
    await recordAudit(tx, {
      actorId: actor.id,
      action: input.disabled ? "user.disabled" : "user.reactivated",
      entityType: "user",
      entityId: input.userId,
      requestId: input.requestId,
    });
  });
}

export async function listUsersForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<UserSummary[]> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "user:manage");
  return listUsers(db);
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const createUserForRoute = (input: CreateUserInput) => createUser({ db: getDb() }, input);
export const setRoleForRoute = (input: SetUserRoleInput) => setRole({ db: getDb() }, input);
export const setDisabledForRoute = (input: SetUserDisabledInput) =>
  setDisabled({ db: getDb() }, input);
export const listUsersForAdminForRoute = (actor: Actor | null | undefined) =>
  listUsersForAdmin({ db: getDb() }, actor);
