import { integer, pgTable, text } from "drizzle-orm/pg-core";
import { createdAt, maxLen, pk, slugCheck, updatedAt } from "./_helpers";

/** Categorias editoriais (indexáveis). Novas categorias não exigem código. */
export const categories = pgTable(
  "categories",
  {
    id: pk(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    description: text("description"),
    position: integer("position").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    slugCheck("categories", t.slug),
    maxLen("categories", t.name, 80),
    maxLen("categories", t.description, 300),
  ],
);

/** Marcação livre. Sem página própria no MVP (evita páginas finas). */
export const tags = pgTable(
  "tags",
  {
    id: pk(),
    slug: text("slug").notNull().unique(),
    name: text("name").notNull(),
    createdAt: createdAt(),
  },
  (t) => [slugCheck("tags", t.slug), maxLen("tags", t.name, 60)],
);
