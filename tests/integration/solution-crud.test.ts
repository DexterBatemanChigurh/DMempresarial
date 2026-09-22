import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createSolution,
  deleteSolution,
  getSolutionForEdit,
  listSolutionsForAdmin,
  updateSolution,
  type CreateSolutionInput,
  type UpdateSolutionInput,
} from "@/features/catalog/application/solution-crud";
import {
  availableSolutionTransitions,
  transitionSolution,
} from "@/features/catalog/application/solution-service";
import type { Actor } from "@/server/permissions";
import { createFixtures, doc, uniq } from "./fixtures";
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

/** Entrada mínima válida para criar uma solução. O prefixo NO INÍCIO do título garante que o
 * slug gerado também comece com ele: é o que `fx.cleanup()` usa para achar e apagar. */
const input = (over: Partial<CreateSolutionInput> = {}): CreateSolutionInput => ({
  actor: admin,
  type: "CONSULTORIA",
  title: `${uniq()} solução`,
  summary: "Resumo que começa pelo problema.",
  context: doc("Contexto."),
  approach: doc("Abordagem."),
  isFeatured: false,
  seoTitle: null,
  seoDescription: null,
  ogMediaId: null,
  items: [],
  ...over,
});

/** Idem, mas para editar (exige `id` e `expectedVersion`). */
const updateInput = (
  over: Partial<UpdateSolutionInput> & Pick<UpdateSolutionInput, "id" | "expectedVersion">,
): UpdateSolutionInput => ({
  ...input(),
  ...over,
});

const rowOf = async (id: string) =>
  (
    await q<{ title: string; version: number }>(
      "select title, version from solutions where id = $1",
      [id],
    )
  )[0]!;

const itemsOf = async (id: string) =>
  q<{ kind: string; position: number; title: string; body: string | null }>(
    "select kind, position, title, body from solution_items where solution_id = $1 order by kind, position",
    [id],
  );

describe("createSolution", () => {
  it("sem sessão → UNAUTHENTICATED; AUTHOR → FORBIDDEN", async () => {
    await expect(createSolution(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(createSolution(deps, input({ actor: author }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN e EDITOR criam", async () => {
    for (const actor of [admin, editor]) {
      const row = await createSolution(deps, input({ actor }));
      expect(row.id).toBeDefined();
    }
  });

  it("título e resumo em branco → VALIDATION; slug já em uso → VALIDATION", async () => {
    await expect(createSolution(deps, input({ title: "  ", summary: "  " }))).rejects.toMatchObject(
      { code: "VALIDATION", fieldErrors: { title: expect.any(Array) } },
    );
    const first = await createSolution(deps, input());
    await expect(createSolution(deps, input({ slug: first.slug }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { slug: expect.any(Array) },
    });
  });

  it("grava os itens com posição por tipo (situação/etapa/objetivo independentes)", async () => {
    const result = await createSolution(
      deps,
      input({
        items: [
          { kind: "SITUATION", title: "Situação 1", body: null },
          { kind: "STEP", title: "Etapa 1", body: "Texto" },
          { kind: "SITUATION", title: "Situação 2", body: null },
          { kind: "GOAL", title: "Objetivo 1", body: null },
        ],
      }),
    );
    const items = await itemsOf(result.id);
    // `order by kind` segue a ordem de DECLARAÇÃO do enum Postgres (SITUATION, STEP, GOAL), não
    // a ordem alfabética.
    expect(items).toEqual([
      { kind: "SITUATION", position: 0, title: "Situação 1", body: null },
      { kind: "SITUATION", position: 1, title: "Situação 2", body: null },
      { kind: "STEP", position: 0, title: "Etapa 1", body: "Texto" },
      { kind: "GOAL", position: 0, title: "Objetivo 1", body: null },
    ]);
  });
});

describe("updateSolution", () => {
  it("ADMIN/EDITOR editam; AUTHOR não pode (sem edit-own para soluções)", async () => {
    const solution = await fx.solution();
    const updated = await updateSolution(
      deps,
      updateInput({ actor: editor, id: solution.id, expectedVersion: 1, title: "Novo título" }),
    );
    expect(updated.version).toBe(2);
    expect((await rowOf(solution.id)).title).toBe("Novo título");

    await expect(
      updateSolution(deps, updateInput({ actor: author, id: solution.id, expectedVersion: 2 })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("troca o conjunto de itens (substitui, não acumula)", async () => {
    const solution = await fx.solution();
    await updateSolution(
      deps,
      updateInput({
        actor: admin,
        id: solution.id,
        expectedVersion: 1,
        items: [{ kind: "STEP", title: "Etapa A", body: null }],
      }),
    );
    await updateSolution(
      deps,
      updateInput({
        actor: admin,
        id: solution.id,
        expectedVersion: 2,
        items: [{ kind: "STEP", title: "Etapa B", body: null }],
      }),
    );
    const items = await itemsOf(solution.id);
    expect(items).toEqual([{ kind: "STEP", position: 0, title: "Etapa B", body: null }]);
  });

  it("versão desatualizada → CONFLICT; id inexistente → NOT_FOUND", async () => {
    const solution = await fx.solution();
    await expect(
      updateSolution(deps, updateInput({ actor: admin, id: solution.id, expectedVersion: 99 })),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      updateSolution(
        deps,
        updateInput({
          actor: admin,
          id: "00000000-0000-4000-8000-000000000000",
          expectedVersion: 1,
        }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("deleteSolution", () => {
  it("bloqueada se referenciada por um artigo; libera depois", async () => {
    const solution = await fx.solution();
    const post = await fx.post({ authorId: specialistId, createdBy: admin.id, categoryId: null });
    await q("insert into post_solutions (post_id, solution_id, is_primary) values ($1, $2, true)", [
      post.id,
      solution.id,
    ]);
    await expect(deleteSolution(deps, { actor: admin, id: solution.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
    await q("delete from post_solutions where post_id = $1", [post.id]);
    await deleteSolution(deps, { actor: admin, id: solution.id });
    expect(await q("select 1 from solutions where id = $1", [solution.id])).toHaveLength(0);
  });

  it("AUTHOR não apaga; EDITOR pode", async () => {
    const solution = await fx.solution();
    await expect(deleteSolution(deps, { actor: author, id: solution.id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await deleteSolution(deps, { actor: editor, id: solution.id });
    expect(await q("select 1 from solutions where id = $1", [solution.id])).toHaveLength(0);
  });
});

describe("transitionSolution", () => {
  it("AUTHOR não publica", async () => {
    const solution = await fx.solution();
    await expect(
      transitionSolution(deps, {
        actor: author,
        solutionId: solution.id,
        to: "PUBLISHED",
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("publicar sem contexto/abordagem → DOMAIN_RULE com todos os motivos", async () => {
    const solution = await fx.solution();
    await expect(
      transitionSolution(deps, {
        actor: admin,
        solutionId: solution.id,
        to: "PUBLISHED",
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("ciclo completo: rascunho → publicado → arquivado → rascunho, com auditoria", async () => {
    const solution = await fx.solution();
    await updateSolution(
      deps,
      updateInput({
        actor: admin,
        id: solution.id,
        expectedVersion: 1,
        context: doc("Contexto real."),
        approach: doc("Abordagem real."),
      }),
    );

    const published = await transitionSolution(deps, {
      actor: admin,
      solutionId: solution.id,
      to: "PUBLISHED",
      expectedVersion: 2,
    });
    expect(published.status).toBe("PUBLISHED");

    const archived = await transitionSolution(deps, {
      actor: editor,
      solutionId: solution.id,
      to: "ARCHIVED",
      expectedVersion: published.version,
    });
    expect(archived.status).toBe("ARCHIVED");

    const restored = await transitionSolution(deps, {
      actor: admin,
      solutionId: solution.id,
      to: "DRAFT",
      expectedVersion: archived.version,
    });
    expect(restored.status).toBe("DRAFT");

    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_id = $1 order by at",
      [solution.id],
    );
    expect(log.map((l) => l.action)).toEqual([
      "solution.updated",
      "solution.published",
      "solution.archived",
      "solution.draft",
    ]);
  });

  it("availableSolutionTransitions: nada para AUTHOR, DRAFT→PUBLISHED para ADMIN", () => {
    expect(availableSolutionTransitions(author, "DRAFT")).toEqual([]);
    expect(availableSolutionTransitions(admin, "DRAFT")).toEqual(["PUBLISHED"]);
  });
});

describe("getSolutionForEdit / listSolutionsForAdmin", () => {
  it("id inexistente → NOT_FOUND; itens vêm separados por tipo", async () => {
    await expect(
      getSolutionForEdit(deps, admin, "00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const solution = await createSolution(
      deps,
      input({ items: [{ kind: "GOAL", title: "Meta", body: null }] }),
    );
    const found = await getSolutionForEdit(deps, admin, solution.id);
    expect(found.items).toEqual([{ kind: "GOAL", title: "Meta", body: null }]);
  });

  it("AUTHOR não lista (solution:manage)", async () => {
    await expect(listSolutionsForAdmin(deps, author)).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
