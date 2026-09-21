import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { solutions } from "./catalog";
import { createdAt, maxLen, pk, slugCheck, tsvector, tz, updatedAt } from "./_helpers";
import { postFormat, postStatus } from "./enums";
import { media } from "./media";
import { specialists } from "./people";
import { editorial, seoChecks, seoColumns } from "./seo";
import { categories, tags } from "./taxonomy";

/**
 * Artigos (docs/03, partes 6, 9 e 19). O corpo é um documento Tiptap em JSON: NUNCA se guarda
 * HTML. `body_text` é o texto plano derivado (a aplicação preenche ao salvar) e alimenta a
 * busca e o tempo de leitura. Só `PUBLISHED` é visível ao público.
 */
export const posts = pgTable(
  "posts",
  {
    id: pk(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    excerpt: text("excerpt"),
    body: jsonb("body")
      .notNull()
      .default(sql`'{"type":"doc","content":[]}'::jsonb`),
    bodyText: text("body_text").notNull().default(""),
    format: postFormat("format"),
    coverMediaId: uuid("cover_media_id").references(() => media.id, { onDelete: "set null" }),
    // Autor = especialista (D5). RESTRICT: não se apaga quem tem artigos.
    authorId: uuid("author_id")
      .notNull()
      .references(() => specialists.id, { onDelete: "restrict" }),
    status: postStatus("status").notNull().default("DRAFT"),
    publishedAt: tz("published_at"),
    // Primeira publicação: nunca é apagada. Um artigo que já foi público só pode ser arquivado.
    firstPublishedAt: tz("first_published_at"),
    scheduledFor: tz("scheduled_for"),
    archivedAt: tz("archived_at"),
    readingMinutes: integer("reading_minutes").notNull().default(0),
    // Busca sem acento (função f_unaccent, migration 0002). Nunca é escrita pela aplicação.
    searchVector: tsvector("search_vector").generatedAlwaysAs(
      sql`setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(title, ''))), 'A') || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(subtitle, '') || ' ' || coalesce(excerpt, ''))), 'B') || setweight(to_tsvector('portuguese', public.f_unaccent(body_text)), 'C')`,
    ),
    ...seoColumns(),
    ...editorial(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    slugCheck("posts", t.slug),
    maxLen("posts", t.title, 200),
    maxLen("posts", t.subtitle, 300),
    maxLen("posts", t.excerpt, 400),
    ...seoChecks("posts", t),
    check("posts_reading_minutes_nonneg", sql`${t.readingMinutes} >= 0`),
    // Coerência estado × datas: o banco recusa um "publicado" sem data de publicação, etc.
    check(
      "posts_status_dates",
      sql`(${t.status} <> 'PUBLISHED' OR (${t.publishedAt} IS NOT NULL AND ${t.firstPublishedAt} IS NOT NULL))
        AND (${t.status} <> 'SCHEDULED' OR ${t.scheduledFor} IS NOT NULL)
        AND (${t.status} <> 'ARCHIVED' OR ${t.archivedAt} IS NOT NULL)`,
    ),
    // Lista pública e busca.
    index("posts_public_idx")
      .on(t.publishedAt.desc())
      .where(sql`${t.status} = 'PUBLISHED'`),
    index("posts_scheduled_idx")
      .on(t.scheduledFor)
      .where(sql`${t.status} = 'SCHEDULED'`),
    index("posts_author_idx").on(t.authorId),
    index("posts_search_idx").using("gin", t.searchVector),
  ],
);

/** Um artigo pode ter várias categorias, com exatamente UMA primária (usada em URL e trilha). */
export const postCategories = pgTable(
  "post_categories",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.categoryId] }),
    // No máximo uma categoria primária por artigo (que exista ao publicar é regra de domínio).
    uniqueIndex("post_categories_one_primary_uq")
      .on(t.postId)
      .where(sql`${t.isPrimary}`),
    index("post_categories_category_idx").on(t.categoryId),
  ],
);

export const postTags = pgTable(
  "post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "restrict" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] }), index("post_tags_tag_idx").on(t.tagId)],
);

/** Solução relacionada; no máximo uma primária define o CTA contextual do artigo. */
export const postSolutions = pgTable(
  "post_solutions",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    solutionId: uuid("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "restrict" }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [
    primaryKey({ columns: [t.postId, t.solutionId] }),
    uniqueIndex("post_solutions_one_primary_uq")
      .on(t.postId)
      .where(sql`${t.isPrimary}`),
    index("post_solutions_solution_idx").on(t.solutionId),
  ],
);
