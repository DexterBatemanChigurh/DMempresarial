import { sql } from "drizzle-orm";
import { check, customType, timestamp, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";

/** Chave primária uuid gerada pelo banco. URLs públicas usam SLUG, nunca o id. */
export const pk = () => uuid("id").primaryKey().defaultRandom();

export const createdAt = () =>
  timestamp("created_at", { withTimezone: true }).defaultNow().notNull();

export const updatedAt = () =>
  timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull();

export const tz = (name: string) => timestamp(name, { withTimezone: true });

/** E-mail sem diferença de caixa (extensão citext, migration 0000). */
export const citext = customType<{ data: string }>({ dataType: () => "citext" });

/** Vetor de busca de texto (Postgres full-text search). */
export const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

// Slug: minúsculas ASCII com hífen, até 80 caracteres (docs/03, parte 6, invariante 1).
const SLUG_REGEX = "'^[a-z0-9]+(-[a-z0-9]+)*$'";

export function slugCheck(table: string, column: AnyPgColumn) {
  return check(
    `${table}_slug_format`,
    sql`${column} ~ ${sql.raw(SLUG_REGEX)} AND char_length(${column}) <= 80`,
  );
}

/** Limite de tamanho no próprio banco: defesa em profundidade além da validação Zod. */
export function maxLen(table: string, column: AnyPgColumn, max: number) {
  return check(
    `${table}_${column.name}_max_len`,
    sql`char_length(${column}) <= ${sql.raw(String(max))}`,
  );
}
