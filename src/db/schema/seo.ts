import { sql } from "drizzle-orm";
import { check, integer, text, uuid, type AnyPgColumn } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { maxLen } from "./_helpers";
import { media } from "./media";

/** Campos de SEO controlados pelo editor; o site usa fallbacks automáticos quando vazios. */
export const seoColumns = () => ({
  seoTitle: text("seo_title"),
  seoDescription: text("seo_description"),
  ogMediaId: uuid("og_media_id").references(() => media.id, { onDelete: "set null" }),
});

export function seoChecks(
  table: string,
  t: { seoTitle: AnyPgColumn; seoDescription: AnyPgColumn },
) {
  return [maxLen(table, t.seoTitle, 70), maxLen(table, t.seoDescription, 160)];
}

/** Bloqueio otimista + rastro de quem criou/alterou (docs/03, parte 16). */
export const editorial = () => ({
  version: integer("version").notNull().default(1),
  createdBy: text("created_by").references(() => users.id, { onDelete: "set null" }),
  updatedBy: text("updated_by").references(() => users.id, { onDelete: "set null" }),
});

/** Coerência entre estado e datas para entidades de 3 estados (DRAFT/PUBLISHED/ARCHIVED). */
export function publishStatusCheck(
  table: string,
  t: { status: AnyPgColumn; publishedAt: AnyPgColumn; archivedAt: AnyPgColumn },
) {
  return check(
    `${table}_status_dates`,
    sql`(${t.status} <> 'PUBLISHED' OR ${t.publishedAt} IS NOT NULL) AND (${t.status} <> 'ARCHIVED' OR ${t.archivedAt} IS NOT NULL)`,
  );
}
