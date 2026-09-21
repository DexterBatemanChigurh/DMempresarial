import { sql } from "drizzle-orm";
import { check, index, integer, pgTable, real, text } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { createdAt, maxLen, pk } from "./_helpers";
import { mediaStatus } from "./enums";

/**
 * Metadados de imagens. O binário fica no storage de objetos (nunca no Postgres). O `alt_text`
 * é obrigatório para publicar conteúdo que use a imagem como não decorativa (regra de domínio).
 */
export const media = pgTable(
  "media",
  {
    id: pk(),
    storageKey: text("storage_key").notNull().unique(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull(),
    width: integer("width").notNull(),
    height: integer("height").notNull(),
    sha256: text("sha256").notNull(),
    altText: text("alt_text"),
    caption: text("caption"),
    // Ponto focal (0 a 1) para recortes sem cortar o assunto (docs/02, seção 32).
    focalX: real("focal_x").notNull().default(0.5),
    focalY: real("focal_y").notNull().default(0.5),
    status: mediaStatus("status").notNull().default("PENDING"),
    uploadedBy: text("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
  },
  (t) => [
    // Só formatos aceitos pelo pipeline de upload (sem SVG enviado por usuário).
    check(
      "media_mime_allowed",
      sql`${t.mime} IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')`,
    ),
    check("media_bytes_positive", sql`${t.bytes} > 0`),
    check("media_dimensions_positive", sql`${t.width} > 0 AND ${t.height} > 0`),
    check("media_sha256_hex", sql`${t.sha256} ~ '^[0-9a-f]{64}$'`),
    check("media_focal_range", sql`${t.focalX} BETWEEN 0 AND 1 AND ${t.focalY} BETWEEN 0 AND 1`),
    maxLen("media", t.altText, 300),
    maxLen("media", t.caption, 300),
    index("media_status_created_idx").on(t.status, t.createdAt),
  ],
);
