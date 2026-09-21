// Operações administrativas do banco (criação de role, privilégios e migrations).
// Usadas por scripts/db-*.mts e pelo setup dos testes de integração. Sempre com o role DONO
// do banco. Nunca imprime URLs nem senhas.
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

/** Role usado pela aplicação em runtime: DML apenas, sem DDL. */
export const APP_ROLE = "dm_app";

/** Tabelas em que a aplicação só pode INSERIR e LER (sem UPDATE/DELETE/TRUNCATE). */
export const APPEND_ONLY_TABLES = ["audit_logs"] as const;

const MIGRATIONS_FOLDER = fileURLToPath(new URL("../../drizzle", import.meta.url));

export function withDatabase(url: string, database: string): string {
  const parsed = new URL(url);
  parsed.pathname = `/${database}`;
  return parsed.toString();
}

/** URL do role de aplicação para o mesmo servidor/banco da URL administrativa. */
export function appUrlFor(adminUrl: string, appPassword: string, database?: string): string {
  const parsed = new URL(database ? withDatabase(adminUrl, database) : adminUrl);
  parsed.username = APP_ROLE;
  parsed.password = appPassword;
  return parsed.toString();
}

async function withClient<T>(url: string, run: (client: pg.Client) => Promise<T>): Promise<T> {
  const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end().catch(() => undefined);
  }
}

export async function ensureDatabase(adminUrl: string, database: string): Promise<void> {
  await withClient(adminUrl, async (client) => {
    const found = await client.query("select 1 from pg_database where datname = $1", [database]);
    if (found.rowCount === 0)
      await client.query(`create database ${client.escapeIdentifier(database)}`);
  });
}

/**
 * Cria/atualiza o role de aplicação e define os privilégios do banco conectado.
 * Idempotente. Tabelas criadas depois pelo dono herdam DML para `dm_app` (default
 * privileges); DDL e TRUNCATE nunca são concedidos.
 */
export async function bootstrapRoles(adminUrl: string, appPassword: string): Promise<string> {
  if (appPassword.length < 16) {
    throw new Error("DM_APP_DB_PASSWORD deve ter pelo menos 16 caracteres.");
  }
  return withClient(adminUrl, async (client) => {
    const { rows } = await client.query<{ owner: string; db: string }>(
      "select current_user as owner, current_database() as db",
    );
    const { owner, db } = rows[0] ?? { owner: "", db: "" };
    const ident = (name: string) => client.escapeIdentifier(name);
    const password = client.escapeLiteral(appPassword);

    const exists = await client.query("select 1 from pg_roles where rolname = $1", [APP_ROLE]);
    const verb = exists.rowCount === 0 ? "create" : "alter";
    await client.query(
      `${verb} role ${ident(APP_ROLE)} login password ${password} nosuperuser nocreatedb nocreaterole`,
    );

    await client.query("begin");
    try {
      await client.query(`revoke all on database ${ident(db)} from public`);
      await client.query(`grant connect on database ${ident(db)} to ${ident(APP_ROLE)}`);
      await client.query(`revoke create on schema public from public`);
      // Garante o mínimo privilégio também quando o role já existia com algo a mais
      // (desvio manual, restauração de backup): retira o que não deve estar lá.
      await client.query(`revoke create on schema public from ${ident(APP_ROLE)}`);
      await client.query(`grant usage on schema public to ${ident(APP_ROLE)}`);
      await client.query(
        `alter default privileges for role ${ident(owner)} in schema public grant select, insert, update, delete on tables to ${ident(APP_ROLE)}`,
      );
      await client.query(
        `alter default privileges for role ${ident(owner)} in schema public grant usage, select on sequences to ${ident(APP_ROLE)}`,
      );
      await client.query(
        `grant select, insert, update, delete on all tables in schema public to ${ident(APP_ROLE)}`,
      );
      await client.query(
        `grant usage, select on all sequences in schema public to ${ident(APP_ROLE)}`,
      );
      await client.query(
        `revoke truncate, references, trigger on all tables in schema public from ${ident(APP_ROLE)}`,
      );
      // Tabelas append-only: a concessão geral acima devolveria UPDATE/DELETE; retira de novo.
      for (const table of APPEND_ONLY_TABLES) {
        const found = await client.query(
          "select 1 from information_schema.tables where table_schema = 'public' and table_name = $1",
          [table],
        );
        if (found.rowCount) {
          await client.query(
            `revoke update, delete, truncate on table public.${ident(table)} from ${ident(APP_ROLE)}`,
          );
        }
      }
      await client.query("commit");
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
    return db;
  });
}

export async function runMigrations(adminUrl: string): Promise<void> {
  const pool = new pg.Pool({ connectionString: adminUrl, max: 1, connectionTimeoutMillis: 5000 });
  try {
    await migrate(drizzle({ client: pool }), { migrationsFolder: MIGRATIONS_FOLDER });
  } finally {
    await pool.end();
  }
}
