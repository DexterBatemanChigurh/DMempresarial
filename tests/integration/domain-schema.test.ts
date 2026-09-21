import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { BASE_CATEGORIES, CONFIRMED_ADDRESS, seedBase } from "../../scripts/lib/db-seed.mts";
import { createFixtures, EMAIL_DOMAIN, pgErrorCode, SQLSTATE, uniq } from "./fixtures";
import { testAdminUrl, testAppUrl } from "./helpers";

const fx = createFixtures();
const app = createDatabase(testAppUrl(), { max: 2 });
const { q } = fx;

let authorId: string;
beforeAll(async () => {
  await fx.cleanup();
  authorId = (await fx.specialist()).id;
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await app.close();
});

const code = pgErrorCode;

describe("slugs e formato", () => {
  it("o banco recusa slug fora do padrão (maiúscula, espaço, hífen duplo, longo demais)", async () => {
    for (const bad of ["Slug Ruim", "a--b", "-a", "a-", "gestão", "a".repeat(81), ""]) {
      expect(
        await code(() => q("insert into categories (slug, name) values ($1, 'x')", [bad])),
        JSON.stringify(bad),
      ).toBe(SQLSTATE.check);
    }
  });

  it("slug repetido no mesmo tipo é recusado; formato válido passa", async () => {
    const slug = uniq("slug-");
    await q("insert into categories (slug, name) values ($1, 'a')", [slug]);
    expect(
      await code(() => q("insert into categories (slug, name) values ($1, 'b')", [slug])),
    ).toBe(SQLSTATE.unique);
  });
});

describe("estados e datas (o banco recusa incoerência)", () => {
  const insert = (status: string, extra = "") =>
    q(
      `insert into posts (slug, title, author_id, status ${extra ? "," + extra.split("=")[0] : ""})
       values ($1, 't', $2, $3::post_status ${extra ? "," + extra.split("=")[1] : ""})`,
      [uniq("st-"), authorId, status],
    );

  it("PUBLISHED exige published_at e first_published_at", async () => {
    expect(await code(() => insert("PUBLISHED"))).toBe(SQLSTATE.check);
    expect(await code(() => insert("PUBLISHED", "published_at=now()"))).toBe(SQLSTATE.check);
  });

  it("SCHEDULED exige scheduled_for; ARCHIVED exige archived_at", async () => {
    expect(await code(() => insert("SCHEDULED"))).toBe(SQLSTATE.check);
    expect(await code(() => insert("ARCHIVED"))).toBe(SQLSTATE.check);
  });

  it("estado coerente é aceito", async () => {
    expect(await code(() => insert("DRAFT"))).toBeNull();
    expect(
      await code(() => insert("SCHEDULED", "scheduled_for=now() + interval '1 day'")),
    ).toBeNull();
  });

  it("solução, especialista e página seguem a mesma regra (3 estados)", async () => {
    expect(
      await code(() =>
        q(
          "insert into solutions (type, slug, title, summary, status) values ('SERVICO', $1, 't', 's', 'PUBLISHED')",
          [uniq("s-")],
        ),
      ),
    ).toBe(SQLSTATE.check);
    expect(
      await code(() =>
        q("insert into specialists (slug, name, status) values ($1, 'n', 'ARCHIVED')", [
          uniq("e-"),
        ]),
      ),
    ).toBe(SQLSTATE.check);
  });

  it("autor CONVIDADO nunca é publicado; da equipe, sim", async () => {
    const guest = () =>
      q(
        "insert into specialists (slug, name, kind, status, published_at) values ($1, 'n', 'GUEST', 'PUBLISHED', now())",
        [uniq("g-")],
      );
    expect(await code(guest)).toBe(SQLSTATE.check);
    const team = () =>
      q(
        "insert into specialists (slug, name, kind, status, published_at) values ($1, 'n', 'TEAM', 'PUBLISHED', now())",
        [uniq("t-")],
      );
    expect(await code(team)).toBeNull();
  });
});

describe("relacionamentos e integridade referencial", () => {
  it("no máximo UMA categoria e UMA solução primárias por artigo", async () => {
    const post = await fx.post({ authorId, categoryId: null });
    const [a, b] = [await fx.category(), await fx.category()];
    await q("insert into post_categories values ($1, $2, true)", [post.id, a.id]);
    expect(
      await code(() => q("insert into post_categories values ($1, $2, true)", [post.id, b.id])),
    ).toBe(SQLSTATE.unique);
    expect(
      await code(() => q("insert into post_categories values ($1, $2, false)", [post.id, b.id])),
    ).toBeNull();

    const [s1, s2] = [await fx.solution(), await fx.solution()];
    await q("insert into post_solutions values ($1, $2, true)", [post.id, s1.id]);
    expect(
      await code(() => q("insert into post_solutions values ($1, $2, true)", [post.id, s2.id])),
    ).toBe(SQLSTATE.unique);
  });

  it("não apaga categoria em uso nem autor com artigos (RESTRICT)", async () => {
    const category = await fx.category();
    const author = await fx.specialist();
    await fx.post({ authorId: author.id, categoryId: category.id });
    expect(await code(() => q("delete from categories where id = $1", [category.id]))).toBe(
      SQLSTATE.foreignKey,
    );
    expect(await code(() => q("delete from specialists where id = $1", [author.id]))).toBe(
      SQLSTATE.foreignKey,
    );
  });

  it("apagar o artigo leva junto categorias, tags e soluções vinculadas (CASCADE)", async () => {
    const post = await fx.post({ authorId });
    const solution = await fx.solution();
    await q("insert into post_solutions values ($1, $2, false)", [post.id, solution.id]);
    await q("delete from posts where id = $1", [post.id]);
    const [countRow] = await q<{ n: string }>(
      "select count(*) as n from post_categories where post_id = $1",
      [post.id],
    );
    expect(Number(countRow?.n)).toBe(0);
  });

  it("um usuário corresponde a no máximo um especialista", async () => {
    const user = await fx.user("AUTHOR");
    await fx.specialist({ userId: user.id });
    expect(await code(() => fx.specialist({ userId: user.id }))).toBe(SQLSTATE.unique);
  });

  it("solução: itens ordenados sem posição repetida por tipo", async () => {
    const solution = await fx.solution();
    const item = (kind: string, position: number) =>
      q(
        "insert into solution_items (solution_id, kind, position, title) values ($1, $2::solution_item_kind, $3, 't')",
        [solution.id, kind, position],
      );
    await item("STEP", 1);
    expect(await code(() => item("STEP", 1))).toBe(SQLSTATE.unique);
    expect(await code(() => item("GOAL", 1))).toBeNull();
  });
});

describe("mídia", () => {
  const insert = (over: Record<string, string | number>) => {
    const v = {
      mime: "image/webp",
      bytes: 10,
      w: 10,
      h: 10,
      sha: "b".repeat(64),
      fx: 0.5,
      ...over,
    };
    return q(
      "insert into media (storage_key, mime, bytes, width, height, sha256, focal_x) values ($1, $2, $3, $4, $5, $6, $7)",
      [uniq("m/"), v.mime, v.bytes, v.w, v.h, v.sha, v.fx],
    );
  };

  it("aceita só JPEG, PNG, WebP e AVIF (SVG e execução ficam de fora)", async () => {
    for (const ok of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
      expect(await code(() => insert({ mime: ok })), ok).toBeNull();
    }
    for (const bad of ["image/svg+xml", "application/pdf", "text/html", "image/gif"]) {
      expect(await code(() => insert({ mime: bad })), bad).toBe(SQLSTATE.check);
    }
  });

  it("recusa tamanho/dimensão inválidos, hash malformado e ponto focal fora de 0..1", async () => {
    expect(await code(() => insert({ bytes: 0 }))).toBe(SQLSTATE.check);
    expect(await code(() => insert({ w: 0 }))).toBe(SQLSTATE.check);
    expect(await code(() => insert({ sha: "XYZ" }))).toBe(SQLSTATE.check);
    expect(await code(() => insert({ fx: 1.5 }))).toBe(SQLSTATE.check);
  });
});

describe("leads e newsletter", () => {
  const lead = (over: { email?: string; message?: string } = {}) =>
    q(
      "insert into leads (name, email, message, consent_at, consent_version) values ('N', $1, $2, now(), 'v1')",
      [over.email ?? `lead-${uniq()}${EMAIL_DOMAIN}`, over.message ?? "Mensagem"],
    );

  it("lead exige e-mail válido e mensagem dentro do limite", async () => {
    expect(await code(() => lead())).toBeNull();
    for (const email of ["sem-arroba", "a@b", "a b@c.d", "@x.com", ""]) {
      expect(await code(() => lead({ email })), email).toBe(SQLSTATE.check);
    }
    expect(await code(() => lead({ message: "x".repeat(5001) }))).toBe(SQLSTATE.check);
    expect(await code(() => lead({ message: "x".repeat(5000) }))).toBeNull();
  });

  it("lead exige consentimento registrado", async () => {
    expect(
      await code(() =>
        q("insert into leads (name, email, message) values ('N', $1, 'm')", [
          `c-${uniq()}${EMAIL_DOMAIN}`,
        ]),
      ),
    ).toBe("23502");
  });

  it("assinante: e-mail único sem diferença de caixa; ACTIVE exige confirmação; UNSUBSCRIBED, data", async () => {
    const email = `Sub-${uniq()}${EMAIL_DOMAIN}`;
    const insert = (address: string, status = "PENDING", extra = "") =>
      q(
        `insert into newsletter_subscribers (email, status, consent_at, consent_version ${extra ? "," + extra.split("=")[0] : ""})
         values ($1, $2::subscriber_status, now(), 'v1' ${extra ? "," + extra.split("=")[1] : ""})`,
        [address, status],
      );
    await insert(email);
    expect(await code(() => insert(email.toLowerCase()))).toBe(SQLSTATE.unique);
    expect(await code(() => insert(`a-${uniq()}${EMAIL_DOMAIN}`, "ACTIVE"))).toBe(SQLSTATE.check);
    expect(await code(() => insert(`b-${uniq()}${EMAIL_DOMAIN}`, "UNSUBSCRIBED"))).toBe(
      SQLSTATE.check,
    );
    expect(
      await code(() => insert(`c-${uniq()}${EMAIL_DOMAIN}`, "ACTIVE", "confirmed_at=now()")),
    ).toBeNull();
  });

  it("o role de aplicação lê e grava leads, mas não altera o esquema", async () => {
    await app.pool.query(
      "insert into leads (name, email, message, consent_at, consent_version) values ('N', $1, 'm', now(), 'v1')",
      [`app-${uniq()}${EMAIL_DOMAIN}`],
    );
    expect(await code(() => app.pool.query("alter table leads add column x int"))).toBe("42501");
  });
});

describe("redirecionamentos", () => {
  const insert = (from: string, to: string, status = 301) =>
    q("insert into redirects (from_path, to_path, status_code) values ($1, $2, $3)", [
      from,
      to,
      status,
    ]);

  it("só aceita caminhos internos: nunca outro site, nunca laço", async () => {
    const a = `/blog/${uniq("r-")}`;
    expect(await code(() => insert(a, `/blog/${uniq("r-")}`))).toBeNull();
    expect(await code(() => insert(`/blog/${uniq("r-")}`, "https://evil.example/x"))).toBe(
      SQLSTATE.check,
    );
    expect(await code(() => insert(`/blog/${uniq("r-")}`, "//evil.example/x"))).toBe(
      SQLSTATE.check,
    );
    expect(await code(() => insert("blog/sem-barra", "/blog/x"))).toBe(SQLSTATE.check);
    expect(await code(() => insert("/blog/com espaço", "/blog/x"))).toBe(SQLSTATE.check);
    expect(await code(() => insert(a, a))).toBe(SQLSTATE.check);
    expect(await code(() => insert(`/blog/${uniq("r-")}`, "/blog/x", 302))).toBe(SQLSTATE.check);
  });

  it("um endereço antigo aponta para um único destino", async () => {
    const from = `/blog/${uniq("r-")}`;
    await insert(from, "/blog/x");
    expect(await code(() => insert(from, "/blog/y"))).toBe(SQLSTATE.unique);
  });
});

describe("configurações e seed", () => {
  it("site_settings é uma linha única", async () => {
    expect(await code(() => q("insert into site_settings (id) values (2)"))).toBe(SQLSTATE.check);
  });

  it("o seed cria as 7 categorias confirmadas e o endereço real, e só isso", async () => {
    const slugs = await q<{ slug: string }>("select slug from categories where slug = any($1)", [
      BASE_CATEGORIES.map((c) => c.slug),
    ]);
    expect(slugs.map((r) => r.slug).sort()).toEqual(BASE_CATEGORIES.map((c) => c.slug).sort());
    const [settings] = await q<{ address: string; phone: string | null; email: string | null }>(
      "select address, phone, email from site_settings where id = 1",
    );
    expect(settings).toEqual({ address: CONFIRMED_ADDRESS, phone: null, email: null });
  });

  it("é idempotente e NUNCA sobrescreve edições de quem administra", async () => {
    await q("update categories set name = 'Nome editado' where slug = 'gestao'");
    await q("update site_settings set phone = '000' where id = 1");
    await seedBase(testAdminUrl());
    await seedBase(testAdminUrl());
    const [countRow] = await q<{ n: string }>(
      "select count(*) as n from categories where slug = 'gestao'",
    );
    expect(Number(countRow?.n)).toBe(1);
    const [cat] = await q<{ name: string }>("select name from categories where slug = 'gestao'");
    expect(cat!.name).toBe("Nome editado");
    const [settings] = await q<{ phone: string }>("select phone from site_settings where id = 1");
    expect(settings!.phone).toBe("000");
    await q("update categories set name = 'Gestão' where slug = 'gestao'");
    await q("update site_settings set phone = null where id = 1");
  });
});

describe("auditoria só-inserção (audit_logs)", () => {
  it("o role de aplicação insere e lê, mas NÃO altera, apaga nem trunca", async () => {
    const marker = uniq("audit-");
    await app.pool.query(
      "insert into audit_logs (action, entity_type, entity_id) values ('teste', 'teste', $1)",
      [marker],
    );
    const read = await app.pool.query("select action from audit_logs where entity_id = $1", [
      marker,
    ]);
    expect(read.rowCount).toBe(1);

    expect(
      await code(() =>
        app.pool.query("update audit_logs set action = 'x' where entity_id = $1", [marker]),
      ),
    ).toBe(SQLSTATE.insufficientPrivilege);
    expect(
      await code(() => app.pool.query("delete from audit_logs where entity_id = $1", [marker])),
    ).toBe(SQLSTATE.insufficientPrivilege);
    expect(await code(() => app.pool.query("truncate audit_logs"))).toBe(
      SQLSTATE.insufficientPrivilege,
    );
    await q("delete from audit_logs where entity_id = $1", [marker]);
  });
});

describe("busca de texto (Postgres full-text, sem acento)", () => {
  const search = async (term: string) =>
    (
      await q<{ slug: string }>(
        `select slug from posts where slug like $1 and search_vector @@ websearch_to_tsquery('portuguese', public.f_unaccent($2))`,
        [`${"it-dom-"}%`, term],
      )
    ).map((r) => r.slug);

  it("acha com ou sem acento e por flexão de número (empresa ≈ empresas)", async () => {
    const post = await fx.post({
      authorId,
      title: "Gestão financeira de pequenas empresas",
      bodyText: "Como organizar o caixa da sua empresa",
    });
    for (const term of ["gestao", "GESTÃO", "financeira", "empresa", "caixa", "organizar caixa"]) {
      expect(await search(term), term).toContain(post.slug);
    }
    expect(await search("astronomia")).not.toContain(post.slug);
  });

  it("o vetor é gerado pelo banco: a aplicação não pode escrevê-lo", async () => {
    const post = await fx.post({ authorId });
    expect(
      await code(() =>
        q("update posts set search_vector = to_tsvector('x') where id = $1", [post.id]),
      ),
    ).toBe("428C9");
  });
});
