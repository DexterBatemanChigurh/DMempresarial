import { sql } from "drizzle-orm";
import { check, index, jsonb, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createdAt, maxLen, pk, updatedAt } from "./_helpers";
import { redirectOrigin } from "./enums";

/**
 * Redirecionamentos (slug antigo → novo). Resolvidos quando a página de conteúdo não acha o
 * slug (não no Proxy). Criados automaticamente quando um slug publicado muda (docs/03, parte 20).
 */
export const redirects = pgTable(
  "redirects",
  {
    id: pk(),
    fromPath: text("from_path").notNull().unique(),
    toPath: text("to_path").notNull(),
    statusCode: smallint("status_code").notNull().default(301),
    origin: redirectOrigin("origin").notNull().default("AUTO"),
    createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    // Caminhos internos absolutos, sem espaço e sem "//" no início (evita redirecionar para outro site).
    check(
      "redirects_from_path",
      sql`${t.fromPath} ~ '^/[^[:space:]]*$' AND ${t.fromPath} !~ '^//'`,
    ),
    check("redirects_to_path", sql`${t.toPath} ~ '^/[^[:space:]]*$' AND ${t.toPath} !~ '^//'`),
    check("redirects_no_self_loop", sql`${t.fromPath} <> ${t.toPath}`),
    check("redirects_status_code", sql`${t.statusCode} IN (301, 308)`),
    maxLen("redirects", t.fromPath, 300),
    maxLen("redirects", t.toPath, 300),
  ],
);

/**
 * Dados reais da DM (linha única). TODOS anuláveis até a DM fornecer: campo nulo = some da tela
 * e do JSON-LD. Nada aqui é inventado (docs/03, parte 7).
 */
export const siteSettings = pgTable(
  "site_settings",
  {
    id: smallint("id").primaryKey().default(1),
    legalName: text("legal_name"),
    cnpj: text("cnpj"),
    address: text("address"),
    phone: text("phone"),
    email: text("email"),
    whatsapp: text("whatsapp"),
    social: jsonb("social")
      .notNull()
      .default(sql`'{}'::jsonb`),
    updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("site_settings_singleton", sql`${t.id} = 1`),
    maxLen("site_settings", t.legalName, 160),
    maxLen("site_settings", t.cnpj, 20),
    maxLen("site_settings", t.address, 300),
    maxLen("site_settings", t.phone, 30),
    maxLen("site_settings", t.email, 254),
    maxLen("site_settings", t.whatsapp, 30),
  ],
);

/**
 * Trilha de auditoria (append-only). Escrita na MESMA transação da mudança. O role de aplicação
 * só tem INSERT e SELECT (sem UPDATE/DELETE/TRUNCATE): nem um bug consegue reescrever a história.
 * `metadata` guarda o mínimo (nomes de campos e estados de/para), nunca o conteúdo.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    at: timestamp("at", { withTimezone: true }).defaultNow().notNull(),
    actorUserId: text("actor_user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata")
      .notNull()
      .default(sql`'{}'::jsonb`),
    requestId: text("request_id"),
  },
  (t) => [
    maxLen("audit_logs", t.action, 60),
    maxLen("audit_logs", t.entityType, 40),
    maxLen("audit_logs", t.entityId, 64),
    maxLen("audit_logs", t.requestId, 64),
    index("audit_logs_at_idx").on(t.at.desc()),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_actor_idx").on(t.actorUserId, t.at.desc()),
  ],
);
