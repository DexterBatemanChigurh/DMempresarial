import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, text, unique, uuid } from "drizzle-orm/pg-core";
import { createdAt, maxLen, pk, slugCheck, tz, updatedAt } from "./_helpers";
import { publishStatus, solutionItemKind, solutionType } from "./enums";
import { editorial, publishStatusCheck, seoChecks, seoColumns } from "./seo";

/**
 * Soluções: consultorias e serviços numa só entidade (docs/03, parte 6 e ADR-003). O `type`
 * distingue; `/servicos` é só uma visão filtrada (docs/01, D1). Não há campo de "resultado": a DM não promete
 * resultado; objetivos vivem em `solution_items` (kind GOAL).
 */
export const solutions = pgTable(
  "solutions",
  {
    id: pk(),
    type: solutionType("type").notNull(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    // Uma frase que começa pelo problema (Blueprint 1, seção 08).
    summary: text("summary").notNull(),
    // Texto rico (JSON do Tiptap). Nulos até o editor preencher.
    context: jsonb("context"),
    approach: jsonb("approach"),
    isFeatured: boolean("is_featured").notNull().default(false),
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
    slugCheck("solutions", t.slug),
    maxLen("solutions", t.title, 160),
    maxLen("solutions", t.summary, 280),
    publishStatusCheck("solutions", t),
    ...seoChecks("solutions", t),
    index("solutions_public_idx")
      .on(t.position)
      .where(sql`${t.status} = 'PUBLISHED'`),
  ],
);

/** Situações atendidas, etapas do processo e objetivos: listas ordenadas e consultáveis. */
export const solutionItems = pgTable(
  "solution_items",
  {
    id: pk(),
    solutionId: uuid("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    kind: solutionItemKind("kind").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    body: text("body"),
  },
  (t) => [
    unique("solution_items_order_uq").on(t.solutionId, t.kind, t.position),
    maxLen("solution_items", t.title, 160),
    maxLen("solution_items", t.body, 600),
  ],
);
