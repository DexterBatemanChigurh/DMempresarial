import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { AppError } from "@/lib/errors";
import { env } from "@/server/env";
import { logger } from "@/server/logging/logger";
import * as schema from "./schema";

/**
 * Único ponto que abre conexão com o banco. Só a camada infrastructure dos módulos e o código
 * de servidor importam este módulo (imposto por ESLint): UI e páginas nunca falam com o banco.
 */

export type Database = NodePgDatabase<typeof schema>;

export type DatabaseHandle = {
  db: Database;
  pool: Pool;
  close: () => Promise<void>;
};

const log = logger.child({ module: "db" });

/** Cria um pool com limites conservadores (ambiente serverless tem poucas conexões). */
export function createDatabase(url: string, options: { max?: number } = {}): DatabaseHandle {
  const pool = new Pool({
    connectionString: url,
    max: options.max ?? 5,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
  });
  // Sem este handler, um erro em conexão ociosa derruba o processo.
  pool.on("error", (error) => log.error("Erro em conexão ociosa do pool", { error }));
  return { db: drizzle({ client: pool, schema }), pool, close: () => pool.end() };
}

// Reaproveita o pool entre recarregamentos de módulo (HMR em desenvolvimento).
const globalForDb = globalThis as unknown as { __dmDatabase?: DatabaseHandle };

/** Banco da aplicação, no role `dm_app` (sem privilégio de DDL). */
export function getDb(): Database {
  if (!globalForDb.__dmDatabase) {
    const url = env().DATABASE_URL;
    if (!url) throw new AppError("UNEXPECTED", "DATABASE_URL não está configurada.");
    globalForDb.__dmDatabase = createDatabase(url);
  }
  return globalForDb.__dmDatabase.db;
}
