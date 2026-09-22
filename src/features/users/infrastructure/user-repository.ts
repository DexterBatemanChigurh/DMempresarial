import "server-only";
import { count, desc, eq, ne, sql } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { accounts, users } from "@/db/schema";
import type { Role } from "@/server/permissions";

export type UserSummary = {
  id: string;
  name: string;
  email: string;
  role: Role;
  disabledAt: Date | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
};

const SUMMARY_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  disabledAt: users.disabledAt,
  twoFactorEnabled: users.twoFactorEnabled,
  createdAt: users.createdAt,
};

export async function listUsers(executor: Executor): Promise<UserSummary[]> {
  return executor.select(SUMMARY_COLUMNS).from(users).orderBy(desc(users.createdAt));
}

export async function findUserById(executor: Executor, id: string): Promise<UserSummary | null> {
  const [row] = await executor.select(SUMMARY_COLUMNS).from(users).where(eq(users.id, id)).limit(1);
  return row ?? null;
}

export async function findUserByEmail(
  executor: Executor,
  email: string,
): Promise<{ id: string } | null> {
  const [row] = await executor
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.trim().toLowerCase()))
    .limit(1);
  return row ?? null;
}

/** ADMIN com conta ativa (nunca desativada), exceto opcionalmente um id (para simular "e se"). */
export async function countActiveAdmins(executor: Executor, excludingId?: string): Promise<number> {
  const conditions = [eq(users.role, "ADMIN"), sql`${users.disabledAt} is null`];
  if (excludingId) conditions.push(ne(users.id, excludingId));
  const [row] = await executor
    .select({ n: count() })
    .from(users)
    .where(sql.join(conditions, sql` and `));
  return row?.n ?? 0;
}

export type CreateUserInput = {
  id: string;
  name: string;
  email: string;
  role: Role;
  passwordHash: string;
};

/** Cria o usuário e a credencial de senha na mesma transação (mesmo desenho do bootstrap). */
export async function createUserWithPassword(
  executor: Executor,
  input: CreateUserInput,
): Promise<void> {
  await executor.insert(users).values({
    id: input.id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    emailVerified: true,
    role: input.role,
  });
  await executor.insert(accounts).values({
    id: crypto.randomUUID(),
    accountId: input.id,
    providerId: "credential",
    userId: input.id,
    password: input.passwordHash,
  });
}

export async function setUserRole(executor: Executor, id: string, role: Role): Promise<void> {
  await executor.update(users).set({ role }).where(eq(users.id, id));
}

export async function setUserDisabled(
  executor: Executor,
  id: string,
  disabled: boolean,
): Promise<void> {
  await executor
    .update(users)
    .set({ disabledAt: disabled ? new Date() : null })
    .where(eq(users.id, id));
}
