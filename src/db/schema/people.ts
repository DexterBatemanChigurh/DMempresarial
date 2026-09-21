import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgTable, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { solutions } from "./catalog";
import { createdAt, maxLen, pk, slugCheck, tz, updatedAt } from "./_helpers";
import { publishStatus, specialistKind } from "./enums";
import { media } from "./media";
import { editorial, publishStatusCheck, seoChecks, seoColumns } from "./seo";
import { categories } from "./taxonomy";

/**
 * Especialistas E autores (uma só entidade, ADR-003/D5). `GUEST` é autor convidado de fora da
 * DM: aparece como nome no artigo, mas NUNCA tem página pública. Nada aqui é preenchido com
 * dado inventado: formação, certificações e resultados só existem se a pessoa fornecer.
 */
export const specialists = pgTable(
  "specialists",
  {
    id: pk(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    roleTitle: text("role_title"),
    summary: text("summary"),
    bio: jsonb("bio"),
    photoMediaId: uuid("photo_media_id").references(() => media.id, { onDelete: "set null" }),
    kind: specialistKind("kind").notNull().default("TEAM"),
    // Conta do CMS desta pessoa (opcional). Uma conta corresponde a no máximo um especialista.
    userId: text("user_id")
      .unique()
      .references(() => users.id, { onDelete: "set null" }),
    position: integer("position").notNull().default(0),
    status: publishStatus("status").notNull().default("DRAFT"),
    publishedAt: tz("published_at"),
    archivedAt: tz("archived_at"),
    ...seoColumns(),
    ...editorial(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    slugCheck("specialists", t.slug),
    maxLen("specialists", t.name, 120),
    maxLen("specialists", t.roleTitle, 120),
    maxLen("specialists", t.summary, 400),
    publishStatusCheck("specialists", t),
    // Autor convidado não tem página pública.
    check("specialists_guest_not_public", sql`${t.kind} = 'TEAM' OR ${t.status} <> 'PUBLISHED'`),
    ...seoChecks("specialists", t),
    index("specialists_public_idx")
      .on(t.position)
      .where(sql`${t.status} = 'PUBLISHED'`),
  ],
);

/** Em quais soluções cada especialista atua (alimenta "especialistas relacionados"). */
export const specialistSolutions = pgTable(
  "specialist_solutions",
  {
    specialistId: uuid("specialist_id")
      .notNull()
      .references(() => specialists.id, { onDelete: "cascade" }),
    solutionId: uuid("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    position: integer("position").notNull().default(0),
  },
  (t) => [
    primaryKey({ columns: [t.specialistId, t.solutionId] }),
    index("specialist_solutions_solution_idx").on(t.solutionId),
  ],
);

/** Áreas de atuação (categorias editoriais em que a pessoa escreve). */
export const specialistCategories = pgTable(
  "specialist_categories",
  {
    specialistId: uuid("specialist_id")
      .notNull()
      .references(() => specialists.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
  },
  (t) => [
    primaryKey({ columns: [t.specialistId, t.categoryId] }),
    index("specialist_categories_category_idx").on(t.categoryId),
  ],
);
