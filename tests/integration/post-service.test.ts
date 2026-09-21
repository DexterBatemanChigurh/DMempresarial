import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  availableTransitions,
  changePostSlug,
  transitionPost,
} from "@/features/content/application/post-service";
import {
  findPublishedPostBySlug,
  listPublishedPosts,
  listPublishedPostSlugs,
  searchPublishedPosts,
} from "@/features/content/infrastructure/post-repository";
import {
  findPublishedSolutionBySlug,
  listPublishedSolutions,
} from "@/features/catalog/infrastructure/solution-repository";
import {
  findPublishedSpecialistBySlug,
  listPublishedSpecialists,
} from "@/features/people/infrastructure/specialist-repository";
import { findRedirect } from "@/features/platform/infrastructure/redirects";
import type { Actor } from "@/server/permissions";
import { createFixtures, doc, PREFIX, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor, author: Actor, otherAuthor: Actor;
let specialistId: string;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([
    fx.user("ADMIN"),
    fx.user("EDITOR"),
    fx.user("AUTHOR"),
    fx.user("AUTHOR"),
  ]);
  [admin, editor, author, otherAuthor] = users as [Actor, Actor, Actor, Actor];
  specialistId = (await fx.specialist()).id;
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

/** Artigo pronto para publicar, criado por `createdBy` (padrão: o autor do teste). */
const mk = (over: Partial<Parameters<typeof fx.post>[0]> = {}) =>
  fx.post({ authorId: specialistId, createdBy: author.id, ...over });

const rowOf = async (id: string) =>
  (
    await q<{
      status: string;
      version: number;
      published_at: Date | null;
      first_published_at: Date | null;
      scheduled_for: Date | null;
    }>(
      "select status, version, published_at, first_published_at, scheduled_for from posts where id = $1",
      [id],
    )
  )[0]!;

const audits = (id: string) =>
  q<{ action: string; actor_user_id: string; metadata: { from: string; to: string } }>(
    "select action, actor_user_id, metadata from audit_logs where entity_id = $1 order by at",
    [id],
  );

describe("permissões por papel na transição", () => {
  it("sem sessão → UNAUTHENTICATED", async () => {
    const post = await mk();
    await expect(
      transitionPost(deps, {
        actor: null,
        postId: post.id,
        to: "REVIEW",
        expectedVersion: post.version,
      }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("o AUTHOR envia o PRÓPRIO rascunho para revisão (com auditoria)", async () => {
    const post = await mk();
    const result = await transitionPost(deps, {
      actor: author,
      postId: post.id,
      to: "REVIEW",
      expectedVersion: post.version,
    });
    expect(result).toMatchObject({ status: "REVIEW", version: post.version + 1 });
    const log = await audits(post.id);
    expect(log).toHaveLength(1);
    expect(log[0]).toMatchObject({
      action: "post.review",
      actor_user_id: author.id,
      metadata: { from: "DRAFT", to: "REVIEW" },
    });
  });

  it("o AUTHOR NÃO publica nem o próprio artigo (FORBIDDEN, e nada muda)", async () => {
    const post = await mk();
    await expect(
      transitionPost(deps, {
        actor: author,
        postId: post.id,
        to: "PUBLISHED",
        expectedVersion: post.version,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(await rowOf(post.id)).toMatchObject({ status: "DRAFT", version: post.version });
    expect(await audits(post.id)).toHaveLength(0);
  });

  it("artigo de OUTRA pessoa: o AUTHOR recebe NOT_FOUND (não revela que existe), nada muda", async () => {
    const post = await mk();
    await expect(
      transitionPost(deps, {
        actor: otherAuthor,
        postId: post.id,
        to: "REVIEW",
        expectedVersion: post.version,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await rowOf(post.id)).toMatchObject({ status: "DRAFT" });
  });

  it("id inexistente → NOT_FOUND", async () => {
    await expect(
      transitionPost(deps, {
        actor: editor,
        postId: "00000000-0000-4000-8000-000000000000",
        to: "PUBLISHED",
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("EDITOR e ADMIN publicam; o resultado traz as tags de cache a invalidar", async () => {
    const a = await mk({ status: "REVIEW" });
    const published = await transitionPost(deps, {
      actor: editor,
      postId: a.id,
      to: "PUBLISHED",
      expectedVersion: a.version,
    });
    expect(published.status).toBe("PUBLISHED");
    expect(published.publishedAt).toBeInstanceOf(Date);
    expect(published.invalidateTags).toEqual(
      expect.arrayContaining([`post:${a.slug}`, "posts", "sitemap"]),
    );
    const row = await rowOf(a.id);
    expect(row.first_published_at).not.toBeNull();

    const b = await mk();
    await expect(
      transitionPost(deps, {
        actor: admin,
        postId: b.id,
        to: "PUBLISHED",
        expectedVersion: b.version,
      }),
    ).resolves.toMatchObject({ status: "PUBLISHED" });
  });

  it("arquivar e restaurar são de EDITOR/ADMIN; o AUTHOR não arquiva o próprio artigo publicado", async () => {
    const post = await mk({ status: "REVIEW" });
    const published = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: post.version,
    });
    await expect(
      transitionPost(deps, {
        actor: author,
        postId: post.id,
        to: "ARCHIVED",
        expectedVersion: published.version,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });

    const archived = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "ARCHIVED",
      expectedVersion: published.version,
    });
    expect(archived.status).toBe("ARCHIVED");
    const restored = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "DRAFT",
      expectedVersion: archived.version,
    });
    expect(restored.status).toBe("DRAFT");
    // A primeira publicação nunca se perde: o artigo continua "já publicado" (não pode ser excluído).
    expect((await rowOf(post.id)).first_published_at).not.toBeNull();
  });
});

describe("máquina de estados e pré-requisitos", () => {
  it("recusa transições que não existem (DRAFT→ARCHIVED, PUBLISHED→DRAFT)", async () => {
    const draft = await mk();
    await expect(
      transitionPost(deps, {
        actor: admin,
        postId: draft.id,
        to: "ARCHIVED",
        expectedVersion: draft.version,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });

    const pub = await mk({ status: "PUBLISHED" });
    await expect(
      transitionPost(deps, {
        actor: admin,
        postId: pub.id,
        to: "DRAFT",
        expectedVersion: pub.version,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
    expect((await rowOf(pub.id)).status).toBe("PUBLISHED");
  });

  it("não publica sem categoria principal nem texto: devolve TODOS os motivos e não grava nada", async () => {
    const post = await mk({ categoryId: null, body: doc(""), bodyText: "" });
    const failure = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: post.version,
    }).catch((e) => e);
    expect(failure).toMatchObject({ code: "DOMAIN_RULE" });
    const reasons: string[] = failure.fieldErrors?.publish ?? [];
    expect(reasons.join(" ")).toMatch(/categoria/i);
    expect(reasons.join(" ")).toMatch(/texto/i);
    expect(await rowOf(post.id)).toMatchObject({ status: "DRAFT", version: post.version });
    expect(await audits(post.id)).toHaveLength(0);
  });

  it("capa sem texto alternativo bloqueia; com texto, publica", async () => {
    const noAlt = await fx.media({ alt: null });
    const blocked = await mk({ coverMediaId: noAlt.id });
    const failure = await transitionPost(deps, {
      actor: editor,
      postId: blocked.id,
      to: "PUBLISHED",
      expectedVersion: blocked.version,
    }).catch((e) => e);
    expect(failure.fieldErrors?.publish?.join(" ")).toMatch(/alternativo/i);

    const withAlt = await fx.media({ alt: "Equipe reunida em torno da mesa" });
    const ok = await mk({ coverMediaId: withAlt.id });
    await expect(
      transitionPost(deps, {
        actor: editor,
        postId: ok.id,
        to: "PUBLISHED",
        expectedVersion: ok.version,
      }),
    ).resolves.toMatchObject({ status: "PUBLISHED" });
  });

  it("agendamento: data no passado é recusada; no futuro agenda e NÃO publica ainda", async () => {
    const post = await mk();
    const now = new Date("2026-06-01T12:00:00Z");
    await expect(
      transitionPost(deps, {
        actor: editor,
        postId: post.id,
        to: "SCHEDULED",
        expectedVersion: post.version,
        scheduledFor: new Date("2026-05-01T00:00:00Z"),
        now,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });

    const future = new Date("2026-06-10T09:00:00Z");
    const scheduled = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "SCHEDULED",
      expectedVersion: post.version,
      scheduledFor: future,
      now,
    });
    expect(scheduled.status).toBe("SCHEDULED");
    expect(await findPublishedPostBySlug(handle.db, post.slug)).toBeNull();

    // O job publica no horário: a data pública é a do agendamento.
    const published = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: scheduled.version,
      now: new Date("2026-06-10T09:05:00Z"),
    });
    expect(published.publishedAt?.toISOString()).toBe(future.toISOString());
    expect(await findPublishedPostBySlug(handle.db, post.slug)).not.toBeNull();
  });
});

describe("concorrência e atomicidade", () => {
  it("versão desatualizada → CONFLICT, sem alterar", async () => {
    const post = await mk();
    await transitionPost(deps, {
      actor: author,
      postId: post.id,
      to: "REVIEW",
      expectedVersion: post.version,
    });
    await expect(
      transitionPost(deps, {
        actor: editor,
        postId: post.id,
        to: "PUBLISHED",
        expectedVersion: post.version,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await rowOf(post.id)).status).toBe("REVIEW");
  });

  it("duas publicações simultâneas: UMA vence, a outra recebe CONFLICT, e há UM só registro de auditoria", async () => {
    const post = await mk();
    const attempts = await Promise.allSettled([
      transitionPost(deps, {
        actor: editor,
        postId: post.id,
        to: "PUBLISHED",
        expectedVersion: post.version,
      }),
      transitionPost(deps, {
        actor: admin,
        postId: post.id,
        to: "PUBLISHED",
        expectedVersion: post.version,
      }),
    ]);
    expect(attempts.filter((a) => a.status === "fulfilled")).toHaveLength(1);
    const rejected = attempts.find((a) => a.status === "rejected") as PromiseRejectedResult;
    expect(rejected.reason).toMatchObject({ code: "CONFLICT" });
    expect(await audits(post.id)).toHaveLength(1);
    expect((await rowOf(post.id)).version).toBe(post.version + 1);
  });

  it("falha no meio da transação não deixa estado parcial (ator inexistente → nada é gravado)", async () => {
    const post = await mk({ status: "REVIEW" });
    const ghost: Actor = { id: `${PREFIX}fantasma`, role: "EDITOR" };
    await expect(
      transitionPost(deps, {
        actor: ghost,
        postId: post.id,
        to: "PUBLISHED",
        expectedVersion: post.version,
      }),
    ).rejects.toBeDefined();
    expect(await rowOf(post.id)).toMatchObject({ status: "REVIEW", version: post.version });
    expect(await audits(post.id)).toHaveLength(0);
  });
});

describe("rascunho NUNCA vaza para o público", () => {
  it("só PUBLISHED sai por slug, lista, busca e sitemap; os outros 4 estados não", async () => {
    const word = "quimeraxyzt";
    const created = {
      DRAFT: await mk({ status: "DRAFT", title: `Rascunho ${word}`, bodyText: word }),
      REVIEW: await mk({ status: "REVIEW", title: `Revisão ${word}`, bodyText: word }),
      SCHEDULED: await mk({
        status: "SCHEDULED",
        scheduledFor: "2099-01-01T00:00:00Z",
        title: `Agendado ${word}`,
        bodyText: word,
      }),
      ARCHIVED: await mk({
        status: "ARCHIVED",
        publishedAt: "2026-01-01T00:00:00Z",
        title: `Arquivado ${word}`,
        bodyText: word,
      }),
      PUBLISHED: await mk({ status: "PUBLISHED", title: `Publicado ${word}`, bodyText: word }),
    };

    for (const [status, post] of Object.entries(created)) {
      const visible = status === "PUBLISHED";
      expect((await findPublishedPostBySlug(handle.db, post.slug)) !== null, `slug ${status}`).toBe(
        visible,
      );
    }
    const inList = (await listPublishedPosts(handle.db, { pageSize: 50 })).items.map((p) => p.slug);
    const inSearch = (await searchPublishedPosts(handle.db, word, { pageSize: 50 })).items.map(
      (p) => p.slug,
    );
    const inSitemap = (await listPublishedPostSlugs(handle.db)).map((p) => p.slug);
    for (const [status, post] of Object.entries(created)) {
      const visible = status === "PUBLISHED";
      expect(inList.includes(post.slug), `lista ${status}`).toBe(
        visible || (status === "PUBLISHED" && inList.includes(post.slug)),
      );
      expect(inSearch.includes(post.slug), `busca ${status}`).toBe(visible);
      expect(inSitemap.includes(post.slug), `sitemap ${status}`).toBe(visible);
    }
  });

  it("publicar torna visível e arquivar volta a esconder", async () => {
    const post = await mk({ status: "REVIEW" });
    expect(await findPublishedPostBySlug(handle.db, post.slug)).toBeNull();
    const published = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: post.version,
    });
    expect(await findPublishedPostBySlug(handle.db, post.slug)).not.toBeNull();
    await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "ARCHIVED",
      expectedVersion: published.version,
    });
    expect(await findPublishedPostBySlug(handle.db, post.slug)).toBeNull();
  });

  it("o DTO público expõe só colunas públicas (nada de versão, criador, texto plano, vetor)", async () => {
    const post = await mk({ status: "PUBLISHED" });
    const dto = await findPublishedPostBySlug(handle.db, post.slug);
    expect(Object.keys(dto ?? {}).sort()).toEqual(
      [
        "authorName",
        "body",
        "excerpt",
        "publishedAt",
        "readingMinutes",
        "seoDescription",
        "seoTitle",
        "slug",
        "subtitle",
        "title",
        "updatedAt",
      ].sort(),
    );
  });
});

describe("busca e paginação", () => {
  it("ranqueia título acima de corpo, ignora acento e nunca quebra com entrada hostil", async () => {
    const word = "governancaqxz";
    const inTitle = await mk({
      status: "PUBLISHED",
      title: `Sobre ${word} e caixa`,
      bodyText: "texto neutro",
    });
    const inBody = await mk({
      status: "PUBLISHED",
      title: "Título neutro",
      bodyText: `${word} `.repeat(3),
    });
    const items = (await searchPublishedPosts(handle.db, word)).items.map((p) => p.slug);
    expect(items.indexOf(inTitle.slug)).toBeGreaterThanOrEqual(0);
    expect(items.indexOf(inTitle.slug)).toBeLessThan(items.indexOf(inBody.slug));

    for (const hostile of [
      "",
      "   ",
      '"aspas abertas',
      "' OR 1=1 --",
      "a & b | !c",
      "x".repeat(500),
      "\\",
      "%_",
    ]) {
      await expect(searchPublishedPosts(handle.db, hostile)).resolves.toMatchObject({
        items: expect.any(Array),
      });
    }
    expect((await searchPublishedPosts(handle.db, "' OR 1=1 --")).items).toHaveLength(0);
  });

  it("parâmetros de página têm teto e valores absurdos caem no padrão", async () => {
    expect((await listPublishedPosts(handle.db, { page: -5, pageSize: 99999 })).pageSize).toBe(50);
    expect((await listPublishedPosts(handle.db, { page: 0, pageSize: 0 })).page).toBe(1);
    expect((await listPublishedPosts(handle.db, { page: 1.5, pageSize: 2.5 })).pageSize).toBe(12);
  });

  it("ordem estável: itens com a MESMA data não repetem nem somem entre páginas", async () => {
    const sameDate = "2098-06-01T00:00:00Z";
    const made = await Promise.all(
      Array.from({ length: 5 }, () => mk({ status: "PUBLISHED", publishedAt: sameDate })),
    );
    const seen: string[] = [];
    for (const page of [1, 2, 3]) {
      seen.push(
        ...(await listPublishedPosts(handle.db, { page, pageSize: 2 })).items.map((p) => p.slug),
      );
    }
    const ours = seen.slice(0, 5);
    expect(new Set(ours).size).toBe(5);
    expect(ours.sort()).toEqual(made.map((p) => p.slug).sort());
  });
});

describe("mudança de slug e redirecionamento automático", () => {
  it("artigo JÁ PUBLICADO: cria 301 do endereço antigo, na mesma transação, e audita", async () => {
    const post = await mk({ status: "REVIEW" });
    const published = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: post.version,
    });
    const newSlug = uniq("novo-");
    const result = await changePostSlug(deps, {
      actor: editor,
      postId: post.id,
      newSlug,
      expectedVersion: published.version,
    });
    expect(result.slug).toBe(newSlug);
    expect(result.invalidateTags).toEqual(
      expect.arrayContaining([`post:${post.slug}`, `post:${newSlug}`, "redirects"]),
    );

    expect(await findRedirect(handle.db, `/blog/${post.slug}`)).toEqual({
      toPath: `/blog/${newSlug}`,
      statusCode: 301,
    });
    expect(await findPublishedPostBySlug(handle.db, post.slug)).toBeNull();
    expect(await findPublishedPostBySlug(handle.db, newSlug)).not.toBeNull();
    expect((await audits(post.id)).map((a) => a.action)).toContain("post.slug_changed");
  });

  it("rascunho que nunca foi público: muda o slug SEM criar redirecionamento", async () => {
    const post = await mk({ createdBy: author.id });
    const newSlug = uniq("rasc-");
    await changePostSlug(deps, {
      actor: author,
      postId: post.id,
      newSlug,
      expectedVersion: post.version,
    });
    expect(await findRedirect(handle.db, `/blog/${post.slug}`)).toBeNull();
  });

  it("correntes não viram saltos duplos e renomear de volta não forma laço", async () => {
    const post = await mk({ status: "REVIEW" });
    const first = await transitionPost(deps, {
      actor: editor,
      postId: post.id,
      to: "PUBLISHED",
      expectedVersion: post.version,
    });
    const [a, b, c] = [post.slug, uniq("b-"), uniq("c-")];
    const toB = await changePostSlug(deps, {
      actor: editor,
      postId: post.id,
      newSlug: b,
      expectedVersion: first.version,
    });
    const toC = await changePostSlug(deps, {
      actor: editor,
      postId: post.id,
      newSlug: c,
      expectedVersion: toB.version,
    });
    // a → c e b → c (nunca a → b → c)
    expect(await findRedirect(handle.db, `/blog/${a}`)).toMatchObject({ toPath: `/blog/${c}` });
    expect(await findRedirect(handle.db, `/blog/${b}`)).toMatchObject({ toPath: `/blog/${c}` });

    // Voltar ao slug original: o redirecionamento a→c some (senão seria laço) e c→a nasce.
    await changePostSlug(deps, {
      actor: editor,
      postId: post.id,
      newSlug: a,
      expectedVersion: toC.version,
    });
    expect(await findRedirect(handle.db, `/blog/${a}`)).toBeNull();
    expect(await findRedirect(handle.db, `/blog/${c}`)).toMatchObject({ toPath: `/blog/${a}` });
    expect(await findRedirect(handle.db, `/blog/${b}`)).toMatchObject({ toPath: `/blog/${a}` });
  });

  it("recusa slug inválido, reservado ou já em uso (com a mensagem no campo certo)", async () => {
    const post = await mk();
    const other = await mk();
    const attempt = (newSlug: string) =>
      changePostSlug(deps, {
        actor: editor,
        postId: post.id,
        newSlug,
        expectedVersion: post.version,
      }).catch((e) => e);
    for (const bad of ["Slug Inválido", "../etc/passwd", "a--b", ""]) {
      expect(await attempt(bad), bad).toMatchObject({
        code: "VALIDATION",
        fieldErrors: { slug: expect.any(Array) },
      });
    }
    expect(await attempt("admin")).toMatchObject({ code: "VALIDATION" });
    expect(await attempt(other.slug)).toMatchObject({
      code: "VALIDATION",
      fieldErrors: { slug: [expect.stringMatching(/já existe/i)] },
    });
    expect((await rowOf(post.id)).version).toBe(post.version);
  });

  it("o AUTHOR só muda o slug do PRÓPRIO rascunho", async () => {
    const mine = await mk({ createdBy: author.id });
    const theirs = await mk({ createdBy: otherAuthor.id });
    await expect(
      changePostSlug(deps, {
        actor: author,
        postId: theirs.id,
        newSlug: uniq("x-"),
        expectedVersion: theirs.version,
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    const inReview = await mk({ createdBy: author.id, status: "REVIEW" });
    await expect(
      changePostSlug(deps, {
        actor: author,
        postId: inReview.id,
        newSlug: uniq("y-"),
        expectedVersion: inReview.version,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      changePostSlug(deps, {
        actor: author,
        postId: mine.id,
        newSlug: uniq("z-"),
        expectedVersion: mine.version,
      }),
    ).resolves.toBeDefined();
  });

  it("versão desatualizada → CONFLICT", async () => {
    const post = await mk();
    await expect(
      changePostSlug(deps, {
        actor: editor,
        postId: post.id,
        newSlug: uniq("v-"),
        expectedVersion: post.version + 7,
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

describe("leitura pública de soluções e especialistas", () => {
  it("soluções: só as publicadas, por lista e por slug", async () => {
    const draft = await fx.solution({ status: "DRAFT" });
    const published = await fx.solution({ status: "PUBLISHED", type: "SERVICO" });
    const list = (await listPublishedSolutions(handle.db)).map((s) => s.slug);
    expect(list).toContain(published.slug);
    expect(list).not.toContain(draft.slug);
    expect(await findPublishedSolutionBySlug(handle.db, draft.slug)).toBeNull();
    const found = await findPublishedSolutionBySlug(handle.db, published.slug);
    expect(found).toMatchObject({ type: "SERVICO", items: [] });
    expect(Object.keys(found ?? {})).not.toContain("id");
  });

  it("especialistas: só da equipe e publicados; sem user_id no DTO", async () => {
    const draft = await fx.specialist({ status: "DRAFT" });
    const published = await fx.specialist({ status: "PUBLISHED" });
    const guest = await fx.specialist({ kind: "GUEST" });
    const list = (await listPublishedSpecialists(handle.db)).map((s) => s.slug);
    expect(list).toContain(published.slug);
    expect(list).not.toContain(draft.slug);
    expect(list).not.toContain(guest.slug);
    expect(await findPublishedSpecialistBySlug(handle.db, draft.slug)).toBeNull();
    expect(await findPublishedSpecialistBySlug(handle.db, guest.slug)).toBeNull();
    const found = await findPublishedSpecialistBySlug(handle.db, published.slug);
    expect(Object.keys(found ?? {})).not.toContain("userId");
  });
});

describe("botões disponíveis (apoio à UI; a autorização real está nos serviços)", () => {
  it("mostra só o que o papel pode fazer no estado atual", () => {
    const own = { ownerId: author.id, hasBeenPublished: false };
    const all = ["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const;
    expect(availableTransitions(author, "DRAFT", own, all)).toEqual(["REVIEW"]);
    expect(availableTransitions(author, "REVIEW", own, all)).toEqual([]);
    expect(availableTransitions(editor, "DRAFT", own, all)).toEqual([
      "REVIEW",
      "SCHEDULED",
      "PUBLISHED",
    ]);
    expect(availableTransitions(editor, "PUBLISHED", own, all)).toEqual(["ARCHIVED"]);
    expect(availableTransitions(null, "DRAFT", own, all)).toEqual([]);
  });
});
