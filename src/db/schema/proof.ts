import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, smallint, text } from "drizzle-orm/pg-core";
import { createdAt, maxLen, pk, tz, updatedAt } from "./_helpers";
import { publishStatus, testimonialSource } from "./enums";
import { editorial, publishStatusCheck } from "./seo";

/**
 * Depoimentos (prova social, docs/01 §20). Só depoimento REAL, com a origem registrada
 * (`GOOGLE` = avaliação pública no Google; `MANUAL` = enviado à DM com autorização). Nunca
 * números inventados: não há campo de "resultado". Só `PUBLISHED` aparece no site.
 */
export const testimonials = pgTable(
  "testimonials",
  {
    id: pk(),
    authorName: text("author_name").notNull(),
    // Cargo/empresa, só quando a pessoa autorizou mostrar.
    authorDetail: text("author_detail"),
    quote: text("quote").notNull(),
    // Nota da avaliação de origem (Google: 1–5). Nula em depoimento manual.
    rating: smallint("rating"),
    source: testimonialSource("source").notNull(),
    // Data da avaliação original.
    givenAt: tz("given_at"),
    position: integer("position").notNull().default(0),
    status: publishStatus("status").notNull().default("DRAFT"),
    publishedAt: tz("published_at"),
    archivedAt: tz("archived_at"),
    ...editorial(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    maxLen("testimonials", t.authorName, 120),
    maxLen("testimonials", t.authorDetail, 120),
    maxLen("testimonials", t.quote, 2000),
    check("testimonials_rating_range", sql`${t.rating} IS NULL OR ${t.rating} BETWEEN 1 AND 5`),
    publishStatusCheck("testimonials", t),
    index("testimonials_public_idx")
      .on(t.position)
      .where(sql`${t.status} = 'PUBLISHED'`),
  ],
);
