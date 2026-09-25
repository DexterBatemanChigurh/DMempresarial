import { randomUUID } from "node:crypto";
import pg from "pg";
import { testAdminUrl } from "./helpers";

/**
 * Fixtures de teste: inserem com o role DONO (contornam o que o role de aplicação não pode) e
 * são apagadas por prefixo, para que uma execução nunca deixe lixo para a próxima.
 */
export const PREFIX = "it-dom-";
export const EMAIL_DOMAIN = "@dom-it.example.test";

export type Role = "ADMIN" | "EDITOR" | "AUTHOR";

export const uniq = (label = "") => `${PREFIX}${label}${randomUUID().slice(0, 8)}`;

const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});
export { doc };

export function createFixtures() {
  const owner = new pg.Pool({ connectionString: testAdminUrl(), max: 3 });

  const q = async <T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params: unknown[] = [],
  ) => (await owner.query<T>(text, params)).rows;

  return {
    owner,
    q,

    async user(role: Role) {
      const id = `${PREFIX}u-${randomUUID().slice(0, 8)}`;
      await q(
        "insert into users (id, name, email, role, email_verified) values ($1, $2, $3, $4, true)",
        [id, `Teste ${role}`, `${id}${EMAIL_DOMAIN}`, role],
      );
      return { id, role };
    },

    async specialist(over: { kind?: "TEAM" | "GUEST"; status?: string; userId?: string } = {}) {
      const slug = uniq("esp-");
      const status = over.status ?? "DRAFT";
      const [row] = await q<{ id: string }>(
        `insert into specialists (slug, name, kind, status, user_id, published_at, role_title, summary)
         values ($1, $2, $3, $4::publish_status, $5, ${status === "PUBLISHED" ? "now()" : "null"}, $6, $7) returning id`,
        [
          slug,
          `Pessoa ${slug}`,
          over.kind ?? "TEAM",
          status,
          over.userId ?? null,
          "Cargo",
          "Resumo",
        ],
      );
      return { id: row!.id, slug };
    },

    async category(slug = uniq("cat-")) {
      const [row] = await q<{ id: string }>(
        "insert into categories (slug, name) values ($1, $2) returning id",
        [slug, `Categoria ${slug}`],
      );
      return { id: row!.id, slug };
    },

    async tag(slug = uniq("tag-")) {
      const [row] = await q<{ id: string }>(
        "insert into tags (slug, name) values ($1, $2) returning id",
        [slug, `Tag ${slug}`],
      );
      return { id: row!.id, slug };
    },

    async media(over: { alt?: string | null } = {}) {
      const key = uniq("media/");
      const [row] = await q<{ id: string }>(
        `insert into media (storage_key, mime, bytes, width, height, sha256, alt_text, status)
         values ($1, 'image/webp', 1000, 800, 600, $2, $3, 'READY') returning id`,
        [key, "a".repeat(64), over.alt === undefined ? "Texto alternativo" : over.alt],
      );
      return { id: row!.id };
    },

    async solution(over: { status?: string; type?: string } = {}) {
      const slug = uniq("sol-");
      const status = over.status ?? "DRAFT";
      const [row] = await q<{ id: string }>(
        `insert into solutions (type, slug, title, summary, status, published_at)
         values ($1::solution_type, $2, $3, $4, $5::publish_status, ${status === "PUBLISHED" ? "now()" : "null"}) returning id`,
        [over.type ?? "CONSULTORIA", slug, `Solução ${slug}`, "Resumo da solução", status],
      );
      return { id: row!.id, slug };
    },

    async page(over: { key?: string; template?: string; status?: string; data?: unknown } = {}) {
      const key = over.key ?? uniq("pag-");
      const status = over.status ?? "DRAFT";
      const [row] = await q<{ id: string }>(
        `insert into pages (key, template, title, data, status, published_at)
         values ($1, $2::page_template, $3, $4::jsonb, $5::publish_status, ${status === "PUBLISHED" ? "now()" : "null"}) returning id`,
        [key, over.template ?? "LEGAL", `Página ${key}`, JSON.stringify(over.data ?? {}), status],
      );
      return { id: row!.id, key };
    },

    /** Artigo pronto para publicar (categoria primária, texto). Ajuste por `over`. */
    async post(over: {
      authorId: string;
      createdBy?: string | null;
      status?: string;
      title?: string;
      body?: unknown;
      bodyText?: string;
      categoryId?: string | null;
      coverMediaId?: string | null;
      publishedAt?: string | null;
      scheduledFor?: string | null;
      slug?: string;
    }) {
      const slug = over.slug ?? uniq("post-");
      const status = over.status ?? "DRAFT";
      const publishedAt =
        over.publishedAt ?? (status === "PUBLISHED" ? new Date().toISOString() : null);
      const text = over.bodyText ?? "Texto do artigo de teste";
      const [row] = await q<{ id: string; version: number }>(
        `insert into posts (slug, title, body, body_text, author_id, created_by, status, published_at,
                            first_published_at, scheduled_for, archived_at, cover_media_id)
         values ($1, $2, $3::jsonb, $4, $5, $6, $7::post_status, $8::timestamptz, $8::timestamptz, $9::timestamptz,
                 ${status === "ARCHIVED" ? "now()" : "null"}, $10) returning id, version`,
        [
          slug,
          over.title ?? `Título ${slug}`,
          JSON.stringify(over.body ?? doc(text)),
          text,
          over.authorId,
          over.createdBy ?? null,
          status,
          publishedAt,
          over.scheduledFor ?? null,
          over.coverMediaId ?? null,
        ],
      );
      // A categoria primária é regra de publicação; só some quando o teste pede `categoryId: null`.
      if (over.categoryId !== null) {
        const categoryId = over.categoryId ?? (await this.category()).id;
        await q(
          "insert into post_categories (post_id, category_id, is_primary) values ($1, $2, true)",
          [row!.id, categoryId],
        );
      }
      return { id: row!.id, slug, version: row!.version };
    },

    async cleanup() {
      await q("delete from audit_logs where actor_user_id like $1 or entity_id like $1", [
        `${PREFIX}%`,
      ]);
      await q("delete from audit_logs where entity_type = 'post' and metadata->>'from' like $1", [
        `${PREFIX}%`,
      ]);
      await q("delete from redirects where from_path like $1 or to_path like $1", [
        `/blog/${PREFIX}%`,
      ]);
      await q("delete from leads where email like $1", [`%${EMAIL_DOMAIN}`]);
      await q("delete from newsletter_subscribers where email like $1", [`%${EMAIL_DOMAIN}`]);
      // Contador de rate limit dos formulários públicos e do upload de mídia: sem dado sensível,
      // seguro limpar entre execuções (banco de teste dedicado).
      await q("delete from rate_limits where key like 'lead:%' or key like 'media:upload:%'");
      await q("delete from posts where slug like $1", [`${PREFIX}%`]);
      await q("delete from specialists where slug like $1", [`${PREFIX}%`]);
      await q("delete from solutions where slug like $1", [`${PREFIX}%`]);
      await q("delete from categories where slug like $1", [`${PREFIX}%`]);
      await q("delete from tags where slug like $1", [`${PREFIX}%`]);
      await q("delete from pages where key like $1", [`${PREFIX}%`]);
      await q("delete from media where storage_key like $1", [`${PREFIX}%`]);
      // Mídia de upload real usa chave `aaaa/mm/<uuid>.webp` (nunca prefixada); identificada pelo
      // dono. Precisa rodar ANTES de apagar os usuários (a FK vira NULL em cascata e perderíamos o rastro).
      await q("delete from media where uploaded_by like $1", [`${PREFIX}%`]);
      await q("delete from users where id like $1", [`${PREFIX}%`]);
    },

    async close() {
      await owner.end();
    },
  };
}

/** Executa uma consulta e devolve o código SQLSTATE do erro (ou null se não houve erro). */
export async function pgErrorCode(run: () => Promise<unknown>): Promise<string | null> {
  try {
    await run();
    return null;
  } catch (error) {
    for (let current: unknown = error, depth = 0; current && depth < 5; depth++) {
      const code = (current as { code?: unknown }).code;
      if (typeof code === "string" && /^[0-9A-Z]{5}$/.test(code)) return code;
      current = (current as { cause?: unknown }).cause;
    }
    return "SEM_CODIGO";
  }
}

export const SQLSTATE = {
  unique: "23505",
  check: "23514",
  /**
   * Recusa por chave estrangeira. O PostgreSQL 17 responde 23503 (foreign_key_violation) e o 18
   * responde 23001 (restrict_violation) para `ON DELETE RESTRICT`. O comportamento é o mesmo (a
   * exclusão é recusada); código de aplicação que traduza este erro deve aceitar os dois.
   */
  foreignKey: ["23503", "23001"],
  insufficientPrivilege: "42501",
} as const;
