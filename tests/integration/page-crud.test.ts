import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createPage,
  deletePage,
  getPageForEdit,
  listPagesForAdmin,
  updatePage,
  type CreatePageInput,
  type UpdatePageInput,
} from "@/features/pages/application/page-crud";
import {
  availablePageTransitions,
  transitionPage,
} from "@/features/pages/application/page-service";
import type { Actor } from "@/server/permissions";
import { createFixtures, doc, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor, author: Actor;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([fx.user("ADMIN"), fx.user("EDITOR"), fx.user("AUTHOR")]);
  [admin, editor, author] = users as [Actor, Actor, Actor];
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

/** Entrada mínima válida para criar uma página LEGAL. O prefixo NO INÍCIO do `key` é o que
 * `fx.cleanup()` usa para achar e apagar. */
const input = (over: Partial<CreatePageInput> = {}): CreatePageInput => ({
  actor: admin,
  key: uniq("pag-"),
  template: "LEGAL",
  title: `Página ${uniq()}`,
  data: { body: doc("Texto legal.") },
  seoTitle: null,
  seoDescription: null,
  ogMediaId: null,
  ...over,
});

const updateInput = (
  over: Partial<UpdatePageInput> & Pick<UpdatePageInput, "id" | "expectedVersion">,
): UpdatePageInput => ({
  actor: admin,
  title: `Página ${uniq()}`,
  data: { body: doc("Texto legal atualizado.") },
  seoTitle: null,
  seoDescription: null,
  ogMediaId: null,
  ...over,
});

const rowOf = async (id: string) =>
  (
    await q<{ title: string; version: number; data: unknown }>(
      "select title, version, data from pages where id = $1",
      [id],
    )
  )[0]!;

describe("createPage", () => {
  it("sem sessão → UNAUTHENTICATED; AUTHOR → FORBIDDEN", async () => {
    await expect(createPage(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(createPage(deps, input({ actor: author }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN e EDITOR criam; key já em uso → VALIDATION", async () => {
    for (const actor of [admin, editor]) {
      const row = await createPage(deps, input({ actor }));
      expect(row.id).toBeDefined();
    }
    const first = await createPage(deps, input());
    await expect(createPage(deps, input({ key: first.key }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { key: expect.any(Array) },
    });
  });

  it("valida a FORMA de `data` contra o schema do template (ABOUT exige as chaves certas)", async () => {
    const row = await createPage(
      deps,
      input({
        template: "ABOUT",
        data: {
          whoWeAre: doc("Quem somos."),
          howWeThink: doc("Como pensamos."),
          howWeWork: doc("Como trabalhamos."),
          values: [{ name: "Transparência", practice: "Falamos a verdade." }],
        },
      }),
    );
    const stored = await rowOf(row.id);
    expect(stored.data).toMatchObject({
      values: [{ name: "Transparência", practice: "Falamos a verdade." }],
    });
  });

  it("`data` fora do formato do template → VALIDATION", async () => {
    await expect(
      createPage(deps, input({ template: "CONTACT", data: { wrongField: "x" } })),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("updatePage", () => {
  it("ADMIN/EDITOR editam; AUTHOR não pode", async () => {
    const page = await fx.page();
    const updated = await updatePage(
      deps,
      updateInput({ actor: editor, id: page.id, expectedVersion: 1, title: "Novo título" }),
    );
    expect(updated.version).toBe(2);
    expect((await rowOf(page.id)).title).toBe("Novo título");

    await expect(
      updatePage(deps, updateInput({ actor: author, id: page.id, expectedVersion: 2 })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("versão desatualizada → CONFLICT; id inexistente → NOT_FOUND", async () => {
    const page = await fx.page();
    await expect(
      updatePage(deps, updateInput({ actor: admin, id: page.id, expectedVersion: 99 })),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      updatePage(
        deps,
        updateInput({
          actor: admin,
          id: "00000000-0000-4000-8000-000000000000",
          expectedVersion: 1,
        }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("valida `data` contra o template JÁ GRAVADO (não vem do cliente)", async () => {
    const page = await fx.page({ template: "LEGAL" });
    await expect(
      updatePage(
        deps,
        updateInput({ actor: admin, id: page.id, expectedVersion: 1, data: { notBody: "x" } }),
      ),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });
});

describe("deletePage", () => {
  it("só um rascunho nunca publicado pode ser apagado", async () => {
    const page = await fx.page();
    await deletePage(deps, { actor: admin, id: page.id });
    expect(await q("select 1 from pages where id = $1", [page.id])).toHaveLength(0);
  });

  it("página já publicada não pode ser apagada, mesmo arquivada depois", async () => {
    const page = await fx.page({
      template: "LEGAL",
      status: "PUBLISHED",
      data: { body: doc("Texto.") },
    });
    await transitionPage(deps, {
      actor: admin,
      pageId: page.id,
      to: "ARCHIVED",
      expectedVersion: 1,
    });
    await expect(deletePage(deps, { actor: admin, id: page.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
  });

  it("AUTHOR não apaga", async () => {
    const page = await fx.page();
    await expect(deletePage(deps, { actor: author, id: page.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("transitionPage", () => {
  it("AUTHOR não publica", async () => {
    const page = await fx.page();
    await expect(
      transitionPage(deps, { actor: author, pageId: page.id, to: "PUBLISHED", expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("publicar sem o texto essencial → DOMAIN_RULE", async () => {
    const page = await fx.page({ data: {} });
    await expect(
      transitionPage(deps, { actor: admin, pageId: page.id, to: "PUBLISHED", expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("`privacy` e `terms` nunca arquivam, mesmo para ADMIN", async () => {
    // `key: "privacy"` não tem o prefixo de teste (é fixo pela regra de negócio), então
    // `fx.cleanup()` não o alcança por LIKE — apaga explicitamente ao final.
    const privacy = await fx.page({
      key: "privacy",
      status: "PUBLISHED",
      data: { body: doc("Política.") },
    });
    try {
      await expect(
        transitionPage(deps, {
          actor: admin,
          pageId: privacy.id,
          to: "ARCHIVED",
          expectedVersion: 1,
        }),
      ).rejects.toMatchObject({ code: "DOMAIN_RULE" });

      expect(availablePageTransitions(admin, "PUBLISHED", "privacy")).toEqual([]);
      expect(availablePageTransitions(admin, "PUBLISHED", uniq("outra-"))).toEqual(["ARCHIVED"]);
    } finally {
      await q("delete from pages where id = $1", [privacy.id]);
    }
  });

  it("ciclo completo para uma página comum: rascunho → publicado → arquivado → rascunho, com auditoria", async () => {
    const page = await fx.page({ data: { body: doc("Texto real.") } });

    const published = await transitionPage(deps, {
      actor: admin,
      pageId: page.id,
      to: "PUBLISHED",
      expectedVersion: 1,
    });
    expect(published.status).toBe("PUBLISHED");

    const archived = await transitionPage(deps, {
      actor: editor,
      pageId: page.id,
      to: "ARCHIVED",
      expectedVersion: published.version,
    });
    expect(archived.status).toBe("ARCHIVED");

    const restored = await transitionPage(deps, {
      actor: admin,
      pageId: page.id,
      to: "DRAFT",
      expectedVersion: archived.version,
    });
    expect(restored.status).toBe("DRAFT");

    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_id = $1 order by at",
      [page.id],
    );
    expect(log.map((l) => l.action)).toEqual(["page.published", "page.archived", "page.draft"]);
  });
});

describe("getPageForEdit / listPagesForAdmin", () => {
  it("id inexistente → NOT_FOUND; AUTHOR não lista nem edita", async () => {
    await expect(
      getPageForEdit(deps, admin, "00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(listPagesForAdmin(deps, author)).rejects.toMatchObject({ code: "FORBIDDEN" });

    const page = await fx.page();
    await expect(getPageForEdit(deps, author, page.id)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
