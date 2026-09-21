import { sql } from "drizzle-orm";
import { check, jsonb, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, maxLen, pk, tz, updatedAt } from "./_helpers";
import { pageTemplate, publishStatus } from "./enums";
import { editorial, publishStatusCheck, seoChecks, seoColumns } from "./seo";

/**
 * Páginas institucionais (docs/03, parte 9): template em código + `data` validado por um schema
 * Zod por template. NÃO é um page builder: o editor muda texto, não layout. Bloco ausente em
 * `data` = seção ausente (nada de "em breve").
 */
export const pages = pgTable(
  "pages",
  {
    id: pk(),
    // Identificador estável da página (ex.: "home", "about", "privacy").
    key: text("key").notNull().unique(),
    template: pageTemplate("template").notNull(),
    title: text("title").notNull(),
    data: jsonb("data")
      .notNull()
      .default(sql`'{}'::jsonb`),
    status: publishStatus("status").notNull().default("DRAFT"),
    publishedAt: tz("published_at"),
    archivedAt: tz("archived_at"),
    ...seoColumns(),
    ...editorial(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("pages_key_format", sql`${t.key} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`),
    maxLen("pages", t.title, 160),
    publishStatusCheck("pages", t),
    ...seoChecks("pages", t),
  ],
);
