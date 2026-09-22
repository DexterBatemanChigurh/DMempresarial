import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createPost,
  deletePost,
  getPostForEdit,
  listPostsForAdmin,
  updatePost,
  type CreatePostInput,
  type UpdatePostInput,
} from "@/features/content/application/post-crud";
import { transitionPost } from "@/features/content/application/post-service";
import type { Actor } from "@/server/permissions";
import { createFixtures, doc, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor, author: Actor, otherAuthor: Actor;
let specialistId: string;
let categoryId: string;

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
  categoryId = (await fx.category()).id;
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

/** Entrada mínima válida para criar um artigo. */
const input = (over: Partial<CreatePostInput> = {}): CreatePostInput => ({
  actor: author,
  // O prefixo no INÍCIO garante que o slug gerado (`slugify`) também comece com ele: é o que
  // `fx.cleanup()` usa para encontrar e apagar os artigos deste arquivo.
  title: `${uniq()} título de teste`,
  subtitle: null,
  excerpt: null,
  body: doc("Corpo do artigo."),
  format: null,
  coverMediaId: null,
  authorId: specialistId,
  seoTitle: null,
  seoDescription: null,
  ogMediaId: null,
  categoryIds: [],
  primaryCategoryId: null,
  tagIds: [],
  solutionIds: [],
  primarySolutionId: null,
  ...over,
});

/** Idem, mas para editar (exige `postId` e `expectedVersion`). */
const updateInput = (
  over: Partial<UpdatePostInput> & Pick<UpdatePostInput, "postId" | "expectedVersion">,
): UpdatePostInput => ({
  ...input(),
  ...over,
});

const rowOf = async (id: string) =>
  (
    await q<{ title: string; author_id: string; version: number; created_by: string }>(
      "select title, author_id, version, created_by from posts where id = $1",
      [id],
    )
  )[0]!;

const categoryLinksOf = async (id: string) =>
  q<{ category_id: string; is_primary: boolean }>(
    "select category_id, is_primary from post_categories where post_id = $1",
    [id],
  );

describe("createPost", () => {
  it("sem sessão → UNAUTHENTICATED, nada é gravado", async () => {
    await expect(createPost(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("ADMIN, EDITOR e AUTHOR podem criar (post:create é liberado aos três)", async () => {
    for (const actor of [admin, editor, author]) {
      const result = await createPost(deps, input({ actor }));
      const row = await rowOf(result.id);
      expect(row.created_by).toBe(actor.id);
    }
  });

  it("sem slug, gera um a partir do título", async () => {
    // Título sem o prefixo NO INÍCIO (de propósito, para testar a geração a partir de texto
    // humano); por isso a linha é apagada aqui mesmo, sem esperar por `fx.cleanup()`.
    const title = `Assunto Interessante ${uniq()}`;
    const result = await createPost(deps, input({ title }));
    expect(result.slug).toMatch(/^assunto-interessante-/);
    await q("delete from posts where id = $1", [result.id]);
  });

  it("slug já em uso → VALIDATION em `slug`, nada muda", async () => {
    const first = await createPost(deps, input());
    await expect(createPost(deps, input({ slug: first.slug }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { slug: expect.any(Array) },
    });
  });

  it("título em branco → VALIDATION em `title`", async () => {
    await expect(createPost(deps, input({ title: "  " }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { title: expect.any(Array) },
    });
  });

  it("categoria principal fora das categorias escolhidas → VALIDATION", async () => {
    await expect(
      createPost(deps, input({ categoryIds: [], primaryCategoryId: categoryId })),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { primaryCategoryId: expect.any(Array) },
    });
  });

  it("texto rico inválido → VALIDATION, sem criar linha", async () => {
    const before = await q("select count(*)::int as n from posts");
    await expect(
      createPost(deps, input({ body: { type: "doc", content: [{ type: "not-a-real-node" }] } })),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    const after = await q("select count(*)::int as n from posts");
    expect(after[0]!.n).toBe(before[0]!.n);
  });

  it("grava categorias com a principal marcada, e o texto plano/tempo de leitura derivados", async () => {
    const secondCategory = await fx.category();
    const result = await createPost(
      deps,
      input({
        categoryIds: [categoryId, secondCategory.id],
        primaryCategoryId: secondCategory.id,
      }),
    );
    const links = await categoryLinksOf(result.id);
    expect(links).toHaveLength(2);
    expect(links.find((l) => l.category_id === secondCategory.id)?.is_primary).toBe(true);
    expect(links.find((l) => l.category_id === categoryId)?.is_primary).toBe(false);

    const [row] = await q<{ body_text: string; reading_minutes: number }>(
      "select body_text, reading_minutes from posts where id = $1",
      [result.id],
    );
    expect(row!.body_text).toBe("Corpo do artigo.");
    expect(row!.reading_minutes).toBeGreaterThanOrEqual(0);
  });
});

describe("updatePost", () => {
  it("EDITOR edita um artigo PUBLICADO (post:edit é irrestrito para EDITOR/ADMIN)", async () => {
    const post = await fx.post({
      authorId: specialistId,
      createdBy: author.id,
      status: "PUBLISHED",
    });
    const updated = await updatePost(
      deps,
      updateInput({
        actor: editor,
        postId: post.id,
        expectedVersion: post.version,
        title: "Novo título",
      }),
    );
    expect(updated.version).toBe(post.version + 1);
    expect((await rowOf(post.id)).title).toBe("Novo título");
  });

  it("AUTHOR edita o PRÓPRIO rascunho, mas não depois de enviado para revisão", async () => {
    const draft = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await expect(
      updatePost(
        deps,
        updateInput({ actor: author, postId: draft.id, expectedVersion: draft.version }),
      ),
    ).resolves.toMatchObject({ id: draft.id });

    const inReview = await fx.post({
      authorId: specialistId,
      createdBy: author.id,
      status: "REVIEW",
    });
    await expect(
      updatePost(
        deps,
        updateInput({ actor: author, postId: inReview.id, expectedVersion: inReview.version }),
      ),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("artigo de OUTRA pessoa: o AUTHOR recebe NOT_FOUND (não revela existência)", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await expect(
      updatePost(
        deps,
        updateInput({ actor: otherAuthor, postId: post.id, expectedVersion: post.version }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("versão desatualizada → CONFLICT, nada muda", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await expect(
      updatePost(
        deps,
        updateInput({ actor: admin, postId: post.id, expectedVersion: post.version + 1 }),
      ),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    expect((await rowOf(post.id)).version).toBe(post.version);
  });

  it("id inexistente → NOT_FOUND", async () => {
    await expect(
      updatePost(
        deps,
        updateInput({
          actor: admin,
          postId: "00000000-0000-4000-8000-000000000000",
          expectedVersion: 1,
        }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("troca o conjunto de categorias (apaga as antigas, grava as novas)", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, categoryId });
    const replacement = await fx.category();
    await updatePost(
      deps,
      updateInput({
        actor: admin,
        postId: post.id,
        expectedVersion: post.version,
        categoryIds: [replacement.id],
        primaryCategoryId: replacement.id,
      }),
    );
    const links = await categoryLinksOf(post.id);
    expect(links).toEqual([{ category_id: replacement.id, is_primary: true }]);
  });

  it("não muda status nem slug (essas colunas não fazem parte da entrada)", async () => {
    const post = await fx.post({
      authorId: specialistId,
      createdBy: author.id,
      status: "PUBLISHED",
    });
    await updatePost(
      deps,
      updateInput({ actor: admin, postId: post.id, expectedVersion: post.version }),
    );
    const [row] = await q<{ status: string; slug: string }>(
      "select status, slug from posts where id = $1",
      [post.id],
    );
    expect(row!.status).toBe("PUBLISHED");
    expect(row!.slug).toBe(post.slug);
  });
});

describe("deletePost", () => {
  it("ADMIN apaga um rascunho nunca publicado (com auditoria); as junções somem em cascata", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await deletePost(deps, { actor: admin, postId: post.id });
    expect(await q("select 1 from posts where id = $1", [post.id])).toHaveLength(0);
    expect(await categoryLinksOf(post.id)).toHaveLength(0);
    const [audit] = await q<{ action: string }>(
      "select action from audit_logs where entity_id = $1 and action = 'post.deleted'",
      [post.id],
    );
    expect(audit).toBeDefined();
  });

  it("AUTHOR apaga o PRÓPRIO rascunho, mas não o de outra pessoa (NOT_FOUND)", async () => {
    const mine = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await expect(deletePost(deps, { actor: author, postId: mine.id })).resolves.toBeUndefined();

    const theirs = await fx.post({
      authorId: specialistId,
      createdBy: otherAuthor.id,
      status: "DRAFT",
    });
    await expect(deletePost(deps, { actor: author, postId: theirs.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("EDITOR não apaga rascunho (só ADMIN e o próprio AUTHOR podem)", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, status: "DRAFT" });
    await expect(deletePost(deps, { actor: editor, postId: post.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("artigo já publicado (mesmo arquivado depois) não pode ser apagado", async () => {
    const post = await fx.post({
      authorId: specialistId,
      createdBy: author.id,
      status: "PUBLISHED",
    });
    await transitionPost(deps, {
      actor: admin,
      postId: post.id,
      to: "ARCHIVED",
      expectedVersion: post.version,
    });
    await expect(deletePost(deps, { actor: admin, postId: post.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    expect(await q("select 1 from posts where id = $1", [post.id])).toHaveLength(1);
  });
});

describe("getPostForEdit", () => {
  it("id inexistente → NOT_FOUND", async () => {
    await expect(
      getPostForEdit(deps, admin, "00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("artigo de outra pessoa: AUTHOR recebe NOT_FOUND", async () => {
    const post = await fx.post({
      authorId: specialistId,
      createdBy: otherAuthor.id,
      status: "DRAFT",
    });
    await expect(getPostForEdit(deps, author, post.id)).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("devolve as associações (categorias, com a primária marcada)", async () => {
    const post = await fx.post({ authorId: specialistId, createdBy: author.id, categoryId });
    const found = await getPostForEdit(deps, admin, post.id);
    expect(found.categoryIds).toContain(categoryId);
    expect(found.primaryCategoryId).toBe(categoryId);
  });
});

describe("listPostsForAdmin", () => {
  it("AUTHOR só vê os PRÓPRIOS artigos; ADMIN/EDITOR veem todos", async () => {
    const mine = await fx.post({ authorId: specialistId, createdBy: author.id, categoryId: null });
    const theirs = await fx.post({
      authorId: specialistId,
      createdBy: otherAuthor.id,
      categoryId: null,
    });

    const asAuthor = await listPostsForAdmin(deps, author);
    const ids = asAuthor.items.map((p) => p.id);
    expect(ids).toContain(mine.id);
    expect(ids).not.toContain(theirs.id);

    const asAdmin = await listPostsForAdmin(deps, admin);
    const adminIds = asAdmin.items.map((p) => p.id);
    expect(adminIds).toEqual(expect.arrayContaining([mine.id, theirs.id]));
  });

  it("filtra por status", async () => {
    const published = await fx.post({
      authorId: specialistId,
      createdBy: admin.id,
      status: "PUBLISHED",
      categoryId: null,
    });
    const result = await listPostsForAdmin(deps, admin, { status: "PUBLISHED" });
    expect(result.items.every((p) => p.status === "PUBLISHED")).toBe(true);
    expect(result.items.map((p) => p.id)).toContain(published.id);
  });
});
