import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createSpecialist,
  deleteSpecialist,
  getSpecialistForEdit,
  listSpecialistsForAdmin,
  updateSpecialist,
  type CreateSpecialistInput,
  type UpdateSpecialistInput,
} from "@/features/people/application/specialist-crud";
import {
  availableSpecialistTransitions,
  transitionSpecialist,
} from "@/features/people/application/specialist-service";
import type { Actor } from "@/server/permissions";
import { createFixtures, doc, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor, author: Actor, otherAuthor: Actor;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([
    fx.user("ADMIN"),
    fx.user("EDITOR"),
    fx.user("AUTHOR"),
    fx.user("AUTHOR"),
  ]);
  [admin, editor, author, otherAuthor] = users as [Actor, Actor, Actor, Actor];
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

/** Entrada mínima válida para criar um especialista. */
const input = (over: Partial<CreateSpecialistInput> = {}): CreateSpecialistInput => ({
  actor: admin,
  name: `${uniq()} Nome`,
  roleTitle: null,
  summary: null,
  bio: doc("Biografia."),
  photoMediaId: null,
  kind: "TEAM",
  seoTitle: null,
  seoDescription: null,
  ogMediaId: null,
  solutionIds: [],
  categoryIds: [],
  ...over,
});

/** Idem, mas para editar (exige `id` e `expectedVersion`). */
const updateInput = (
  over: Partial<UpdateSpecialistInput> & Pick<UpdateSpecialistInput, "id" | "expectedVersion">,
): UpdateSpecialistInput => ({
  ...input(),
  ...over,
});

const rowOf = async (id: string) =>
  (
    await q<{ name: string; version: number; kind: string; user_id: string | null }>(
      "select name, version, kind, user_id from specialists where id = $1",
      [id],
    )
  )[0]!;

describe("createSpecialist", () => {
  it("sem sessão → UNAUTHENTICATED; AUTHOR → FORBIDDEN (não cria nem o próprio)", async () => {
    await expect(createSpecialist(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(createSpecialist(deps, input({ actor: author }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN e EDITOR criam", async () => {
    for (const actor of [admin, editor]) {
      const row = await createSpecialist(deps, input({ actor }));
      expect(row.id).toBeDefined();
    }
  });

  it("nome em branco → VALIDATION; slug já em uso → VALIDATION", async () => {
    await expect(createSpecialist(deps, input({ name: "  " }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { name: expect.any(Array) },
    });
    const first = await createSpecialist(deps, input());
    await expect(createSpecialist(deps, input({ slug: first.slug }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { slug: expect.any(Array) },
    });
  });
});

describe("updateSpecialist", () => {
  it("ADMIN/EDITOR editam qualquer perfil", async () => {
    const specialist = await fx.specialist();
    const updated = await updateSpecialist(
      deps,
      updateInput({ actor: editor, id: specialist.id, expectedVersion: 1, name: "Novo nome" }),
    );
    expect(updated.version).toBe(2);
    expect((await rowOf(specialist.id)).name).toBe("Novo nome");
  });

  it("AUTHOR edita o PRÓPRIO perfil vinculado (user_id), mas não o de outra pessoa", async () => {
    const own = await fx.specialist({ userId: author.id });
    await expect(
      updateSpecialist(
        deps,
        updateInput({ actor: author, id: own.id, expectedVersion: 1, name: "Meu nome" }),
      ),
    ).resolves.toMatchObject({ id: own.id });

    const someoneElses = await fx.specialist({ userId: otherAuthor.id });
    await expect(
      updateSpecialist(
        deps,
        updateInput({ actor: author, id: someoneElses.id, expectedVersion: 1 }),
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("AUTHOR não muda `kind` do próprio perfil (ADMIN/EDITOR sim)", async () => {
    const authorWithProfile = await fx.user("AUTHOR");
    const own = await fx.specialist({ userId: authorWithProfile.id, kind: "TEAM" });
    await updateSpecialist(
      deps,
      updateInput({ actor: authorWithProfile, id: own.id, expectedVersion: 1, kind: "GUEST" }),
    );
    expect((await rowOf(own.id)).kind).toBe("TEAM");

    const other = await fx.specialist({ kind: "TEAM" });
    await updateSpecialist(
      deps,
      updateInput({ actor: admin, id: other.id, expectedVersion: 1, kind: "GUEST" }),
    );
    expect((await rowOf(other.id)).kind).toBe("GUEST");
  });

  it("versão desatualizada → CONFLICT; id inexistente → NOT_FOUND", async () => {
    const specialist = await fx.specialist();
    await expect(
      updateSpecialist(deps, updateInput({ actor: admin, id: specialist.id, expectedVersion: 99 })),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      updateSpecialist(
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

describe("deleteSpecialist", () => {
  it("bloqueada se autor de um artigo; libera depois que o artigo é removido", async () => {
    const specialist = await fx.specialist();
    const post = await fx.post({ authorId: specialist.id, createdBy: admin.id });
    await expect(deleteSpecialist(deps, { actor: admin, id: specialist.id })).rejects.toMatchObject(
      {
        code: "DOMAIN_RULE",
      },
    );
    await q("delete from post_categories where post_id = $1", [post.id]);
    await q("delete from posts where id = $1", [post.id]);
    await deleteSpecialist(deps, { actor: admin, id: specialist.id });
    expect(await q("select 1 from specialists where id = $1", [specialist.id])).toHaveLength(0);
  });

  it("AUTHOR nunca apaga (nem o próprio); EDITOR pode", async () => {
    const authorWithProfile = await fx.user("AUTHOR");
    const own = await fx.specialist({ userId: authorWithProfile.id });
    await expect(
      deleteSpecialist(deps, { actor: authorWithProfile, id: own.id }),
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const specialist = await fx.specialist();
    await deleteSpecialist(deps, { actor: editor, id: specialist.id });
    expect(await q("select 1 from specialists where id = $1", [specialist.id])).toHaveLength(0);
  });
});

describe("transitionSpecialist", () => {
  it("AUTHOR não publica nem o próprio perfil (specialist:manage é exclusivo de ADMIN/EDITOR)", async () => {
    const authorWithProfile = await fx.user("AUTHOR");
    const own = await fx.specialist({ userId: authorWithProfile.id });
    await expect(
      transitionSpecialist(deps, {
        actor: authorWithProfile,
        specialistId: own.id,
        to: "PUBLISHED",
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("publicar sem cargo/foto/resumo → DOMAIN_RULE com todos os motivos", async () => {
    const specialist = await fx.specialist();
    await expect(
      transitionSpecialist(deps, {
        actor: admin,
        specialistId: specialist.id,
        to: "PUBLISHED",
        expectedVersion: 1,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("GUEST nunca publica, mesmo com todos os campos", async () => {
    const specialist = await fx.specialist({ kind: "GUEST" });
    await updateSpecialist(
      deps,
      updateInput({
        actor: admin,
        id: specialist.id,
        expectedVersion: 1,
        kind: "GUEST",
        roleTitle: "Cargo",
        summary: "Resumo",
        photoMediaId: (await fx.media()).id,
      }),
    );
    await expect(
      transitionSpecialist(deps, {
        actor: admin,
        specialistId: specialist.id,
        to: "PUBLISHED",
        expectedVersion: 2,
      }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("ciclo completo: rascunho → publicado → arquivado → rascunho, com auditoria", async () => {
    const photo = await fx.media();
    const specialist = await fx.specialist();
    await updateSpecialist(
      deps,
      updateInput({
        actor: admin,
        id: specialist.id,
        expectedVersion: 1,
        roleTitle: "Consultora",
        summary: "Resumo real.",
        photoMediaId: photo.id,
      }),
    );

    const published = await transitionSpecialist(deps, {
      actor: admin,
      specialistId: specialist.id,
      to: "PUBLISHED",
      expectedVersion: 2,
    });
    expect(published.status).toBe("PUBLISHED");

    const archived = await transitionSpecialist(deps, {
      actor: editor,
      specialistId: specialist.id,
      to: "ARCHIVED",
      expectedVersion: published.version,
    });
    expect(archived.status).toBe("ARCHIVED");

    const restored = await transitionSpecialist(deps, {
      actor: admin,
      specialistId: specialist.id,
      to: "DRAFT",
      expectedVersion: archived.version,
    });
    expect(restored.status).toBe("DRAFT");

    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_id = $1 order by at",
      [specialist.id],
    );
    expect(log.map((l) => l.action)).toEqual([
      "specialist.updated",
      "specialist.published",
      "specialist.archived",
      "specialist.draft",
    ]);
  });

  it("availableSpecialistTransitions: nada para AUTHOR, DRAFT→PUBLISHED para ADMIN", () => {
    expect(availableSpecialistTransitions(author, "DRAFT")).toEqual([]);
    expect(availableSpecialistTransitions(admin, "DRAFT")).toEqual(["PUBLISHED"]);
  });
});

describe("getSpecialistForEdit / listSpecialistsForAdmin", () => {
  it("id inexistente → NOT_FOUND; devolve associações", async () => {
    await expect(
      getSpecialistForEdit(deps, admin, "00000000-0000-4000-8000-000000000000"),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });

    const solution = await fx.solution();
    const specialist = await fx.specialist();
    await updateSpecialist(
      deps,
      updateInput({
        actor: admin,
        id: specialist.id,
        expectedVersion: 1,
        solutionIds: [solution.id],
      }),
    );
    const found = await getSpecialistForEdit(deps, admin, specialist.id);
    expect(found.solutionIds).toEqual([solution.id]);
  });

  it("AUTHOR não lista (specialist:manage)", async () => {
    await expect(listSpecialistsForAdmin(deps, author)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
