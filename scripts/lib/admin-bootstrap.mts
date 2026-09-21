// Criação do PRIMEIRO administrador (docs/03, parte 10). Não existe senha padrão em lugar
// nenhum: a senha vem de variável de ambiente ou é gerada aleatoriamente e mostrada uma única
// vez. Usa o mesmo algoritmo de hash da biblioteca de login (scrypt), então o login funciona.
import { randomInt, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import pg from "pg";

// Sem caracteres ambíguos (0/O, 1/l/I) para facilitar a digitação do primeiro acesso.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const MIN_PASSWORD_LENGTH = 12;

export function generatePassword(length = 24): string {
  return Array.from({ length }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
}

export type NewAdmin = { email: string; name: string; password: string };

export async function createFirstAdmin(
  adminUrl: string,
  input: NewAdmin,
  options: { allowAdditional?: boolean } = {},
): Promise<{ id: string }> {
  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) throw new Error("E-mail inválido.");
  if (input.name.trim() === "") throw new Error("Nome obrigatório.");
  if (input.password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }

  const client = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 10_000 });
  await client.connect();
  try {
    await client.query("begin");
    if (!options.allowAdditional) {
      const existing = await client.query("select 1 from users where role = 'ADMIN' limit 1");
      if (existing.rowCount) {
        throw new Error("Já existe um administrador. Crie novos usuários pelo painel.");
      }
    }
    const id = randomUUID();
    const hash = await hashPassword(input.password);
    await client.query(
      "insert into users (id, name, email, email_verified, role) values ($1, $2, $3, true, 'ADMIN')",
      [id, input.name.trim(), email],
    );
    await client.query(
      "insert into accounts (id, account_id, provider_id, user_id, password) values ($1, $2, 'credential', $2, $3)",
      [randomUUID(), id, hash],
    );
    await client.query(
      "insert into audit_logs (actor_user_id, action, entity_type, entity_id, metadata) values (null, 'user.bootstrap_admin', 'user', $1, '{}'::jsonb)",
      [id],
    );
    await client.query("commit");
    return { id };
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}
