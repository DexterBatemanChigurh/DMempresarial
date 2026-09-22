import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createCategory,
  createTag,
  deleteCategory,
  deleteTag,
  listCategoriesForAdmin,
  listTagsForAdmin,
  mergeCategoriesService,
  mergeTagsService,
  updateCategory,
} from "@/features/taxonomy/application/taxonomy-service";
import type { Actor } from "@/server/permissions";
import { createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor, author: Actor;
let specialistId: string;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([fx.user("ADMIN"), fx.user("EDITOR"), fx.user("AUTHOR")]);
  [admin, editor, author] = users as [Actor, Actor, Actor];
  specialistId = (await fx.specialist()).id;
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

const categoryLinks = (categoryId: string) =>
  q<{ post_id: string; is_primary: boolean }>(
    "select post_id, is_primary from post_categories where category_id = $1",
    [categoryId],
  );

describe("createCategory / updateCategory", () => {
  it("sem sessão → UNAUTHENTICATED", async () => {
    await expect(
      createCategory(deps, { actor: null, name: `${uniq()} categoria` }),
    ).rejects.toMatchObject({ code: "UNAUTHENTICATED" });
  });

  it("AUTHOR não gerencia taxonomia → FORBIDDEN", async () => {
    await expect(
      createCategory(deps, { actor: author, name: `${uniq()} categoria` }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("ADMIN e EDITOR criam categorias", async () => {
    for (const actor of [admin, editor]) {
      const row = await createCategory(deps, { actor, name: `${uniq()} categoria` });
      expect(row.id).toBeDefined();
    }
  });

  it("nome em branco → VALIDATION", async () => {
    await expect(createCategory(deps, { actor: admin, name: "  " })).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { name: expect.any(Array) },
    });
  });

  it("slug já em uso → VALIDATION", async () => {
    const first = await fx.category();
    await expect(
      createCategory(deps, { actor: admin, name: `${uniq()} categoria`, slug: first.slug }),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { slug: expect.any(Array) } });
  });

  it("ADMIN edita nome e descrição; id inexistente → NOT_FOUND", async () => {
    const category = await fx.category();
    await updateCategory(deps, {
      actor: admin,
      id: category.id,
      name: "Nome novo",
      description: "Descrição nova",
    });
    const [row] = await q<{ name: string; description: string }>(
      "select name, description from categories where id = $1",
      [category.id],
    );
    expect(row).toMatchObject({ name: "Nome novo", description: "Descrição nova" });

    await expect(
      updateCategory(deps, {
        actor: admin,
        id: "00000000-0000-4000-8000-000000000000",
        name: "X",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("deleteCategory", () => {
  it("bloqueada se referenciada por um artigo, nada muda", async () => {
    const category = await fx.category();
    await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: category.id });
    await expect(deleteCategory(deps, { actor: admin, id: category.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
    expect(await q("select 1 from categories where id = $1", [category.id])).toHaveLength(1);
  });

  it("bloqueada se referenciada por um especialista", async () => {
    const category = await fx.category();
    await q("insert into specialist_categories (specialist_id, category_id) values ($1, $2)", [
      specialistId,
      category.id,
    ]);
    await expect(deleteCategory(deps, { actor: admin, id: category.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
  });

  it("sem uso: apaga e registra auditoria; AUTHOR não pode", async () => {
    const category = await fx.category();
    await expect(deleteCategory(deps, { actor: author, id: category.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await deleteCategory(deps, { actor: admin, id: category.id });
    expect(await q("select 1 from categories where id = $1", [category.id])).toHaveLength(0);
    const [audit] = await q<{ action: string }>(
      "select action from audit_logs where entity_id = $1 and action = 'category.deleted'",
      [category.id],
    );
    expect(audit).toBeDefined();
  });
});

describe("mergeCategoriesService", () => {
  it("origem e destino iguais → VALIDATION", async () => {
    const category = await fx.category();
    await expect(
      mergeCategoriesService(deps, { actor: admin, fromId: category.id, toId: category.id }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("move um artigo que só tinha a origem (preserva a principal)", async () => {
    const from = await fx.category();
    const to = await fx.category();
    const post = await fx.post({
      authorId: specialistId,
      createdBy: admin.id,
      categoryId: from.id,
    });

    await mergeCategoriesService(deps, { actor: admin, fromId: from.id, toId: to.id });

    const links = await categoryLinks(to.id);
    expect(links).toEqual([{ post_id: post.id, is_primary: true }]);
    expect(await q("select 1 from categories where id = $1", [from.id])).toHaveLength(0);
  });

  it("artigo com AMBAS: origem principal, destino não → promove o destino sem duplicar a principal", async () => {
    const from = await fx.category();
    const to = await fx.category();
    const post = await fx.post({
      authorId: specialistId,
      createdBy: admin.id,
      categoryId: from.id,
    });
    await q(
      "insert into post_categories (post_id, category_id, is_primary) values ($1, $2, false)",
      [post.id, to.id],
    );

    await mergeCategoriesService(deps, { actor: admin, fromId: from.id, toId: to.id });

    const links = await q<{ category_id: string; is_primary: boolean }>(
      "select category_id, is_primary from post_categories where post_id = $1",
      [post.id],
    );
    expect(links).toEqual([{ category_id: to.id, is_primary: true }]);
  });

  it("artigo com AMBAS: destino já principal → a linha da origem some sem trocar a principal", async () => {
    const from = await fx.category();
    const to = await fx.category();
    const post = await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: to.id });
    await q(
      "insert into post_categories (post_id, category_id, is_primary) values ($1, $2, false)",
      [post.id, from.id],
    );

    await mergeCategoriesService(deps, { actor: admin, fromId: from.id, toId: to.id });

    const links = await q<{ category_id: string; is_primary: boolean }>(
      "select category_id, is_primary from post_categories where post_id = $1",
      [post.id],
    );
    expect(links).toEqual([{ category_id: to.id, is_primary: true }]);
  });

  it("especialista com AMBAS: sobra só um vínculo", async () => {
    const from = await fx.category();
    const to = await fx.category();
    const specialist = (await fx.specialist()).id;
    await q(
      "insert into specialist_categories (specialist_id, category_id) values ($1, $2), ($1, $3)",
      [specialist, from.id, to.id],
    );

    await mergeCategoriesService(deps, { actor: admin, fromId: from.id, toId: to.id });

    const links = await q("select 1 from specialist_categories where specialist_id = $1", [
      specialist,
    ]);
    expect(links).toHaveLength(1);
  });
});

describe("tags", () => {
  it("createTag: AUTHOR → FORBIDDEN; ADMIN cria", async () => {
    await expect(createTag(deps, { actor: author, name: `${uniq()} tag` })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const row = await createTag(deps, { actor: admin, name: `${uniq()} tag` });
    expect(row.id).toBeDefined();
  });

  it("deleteTag: bloqueada se em uso; libera depois de removida do artigo", async () => {
    const tag = await fx.tag();
    const post = await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: null });
    await q("insert into post_tags (post_id, tag_id) values ($1, $2)", [post.id, tag.id]);

    await expect(deleteTag(deps, { actor: admin, id: tag.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
    await q("delete from post_tags where post_id = $1 and tag_id = $2", [post.id, tag.id]);
    await deleteTag(deps, { actor: admin, id: tag.id });
    expect(await q("select 1 from tags where id = $1", [tag.id])).toHaveLength(0);
  });

  it("mergeTagsService: dedupe quando o artigo já tem as duas", async () => {
    const from = await fx.tag();
    const to = await fx.tag();
    const post = await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: null });
    await q("insert into post_tags (post_id, tag_id) values ($1, $2), ($1, $3)", [
      post.id,
      from.id,
      to.id,
    ]);

    await mergeTagsService(deps, { actor: admin, fromId: from.id, toId: to.id });

    const links = await q("select tag_id from post_tags where post_id = $1", [post.id]);
    expect(links).toEqual([{ tag_id: to.id }]);
    expect(await q("select 1 from tags where id = $1", [from.id])).toHaveLength(0);
  });
});

describe("listCategoriesForAdmin / listTagsForAdmin", () => {
  it("conta artigos e especialistas por categoria; AUTHOR não acessa", async () => {
    const category = await fx.category();
    await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: category.id });
    await q("insert into specialist_categories (specialist_id, category_id) values ($1, $2)", [
      specialistId,
      category.id,
    ]);

    const rows = await listCategoriesForAdmin(deps, admin);
    const row = rows.find((r) => r.id === category.id);
    expect(row).toMatchObject({ postCount: 1, specialistCount: 1 });

    await expect(listCategoriesForAdmin(deps, author)).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(listTagsForAdmin(deps, author)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
