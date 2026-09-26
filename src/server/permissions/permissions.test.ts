import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import {
  ACTIONS,
  ROLES,
  assertCan,
  can,
  type Action,
  type Actor,
  type Resource,
  type Role,
} from "./index";

const actor = (role: Role, id = `${role.toLowerCase()}-1`): Actor => ({ id, role });

// Ações cuja resposta NÃO depende do recurso: a matriz completa, escrita por extenso.
// Se alguém alterar a política, este teste falha e obriga a revisar a matriz (docs/03, parte 12).
const EXPECTED: Record<Role, Partial<Record<Action, boolean>>> = {
  ADMIN: Object.fromEntries(ACTIONS.filter((a) => a !== "post:delete-draft").map((a) => [a, true])),
  EDITOR: {
    "post:create": true,
    "post:publish": true,
    "post:archive": true,
    "post:submit": true,
    "post:edit": true,
    "taxonomy:manage": true,
    "specialist:manage": true,
    "solution:manage": true,
    "page:manage": true,
    "media:upload": true,
    "media:manage": true,
    "media:delete": true,
    "redirect:manage": true,
    "testimonial:manage": true,
    "post:delete-draft": false,
    "specialist:edit-own": false,
    "lead:view": false,
    "lead:update": false,
    "lead:export": false,
    "lead:erase": false,
    "subscriber:view": false,
    "subscriber:erase": false,
    "user:manage": false,
    "settings:manage": false,
    "audit:view": false,
  },
  AUTHOR: {
    "post:create": true,
    "media:upload": true,
    "media:manage": false,
    "post:publish": false,
    "post:archive": false,
    "taxonomy:manage": false,
    "specialist:manage": false,
    "solution:manage": false,
    "page:manage": false,
    "lead:view": false,
    "lead:update": false,
    "lead:export": false,
    "lead:erase": false,
    "subscriber:view": false,
    "subscriber:erase": false,
    "testimonial:manage": false,
    "user:manage": false,
    "settings:manage": false,
    "redirect:manage": false,
    "audit:view": false,
  },
};

describe("can — matriz por papel (sem depender de recurso)", () => {
  for (const role of ROLES) {
    for (const [action, allowed] of Object.entries(EXPECTED[role])) {
      it(`${role} ${allowed ? "PODE" : "NÃO pode"} ${action}`, () => {
        expect(can(actor(role), action as Action)).toBe(allowed);
      });
    }
  }
});

describe("can — negado por padrão", () => {
  it("nega sem ator, com ator desativado, papel desconhecido ou id vazio", () => {
    expect(can(null, "post:create")).toBe(false);
    expect(can(undefined, "post:create")).toBe(false);
    expect(can({ id: "x", role: "ADMIN", disabled: true }, "post:create")).toBe(false);
    expect(can({ id: "x", role: "SUPERUSER" as Role }, "post:create")).toBe(false);
    expect(can({ id: "", role: "ADMIN" }, "post:create")).toBe(false);
  });

  it("nega ação desconhecida e chaves de protótipo (constructor, __proto__, toString)", () => {
    for (const action of ["nope", "constructor", "__proto__", "toString", "hasOwnProperty"]) {
      expect(can(actor("ADMIN"), action as Action)).toBe(false);
    }
    for (const role of ["constructor", "__proto__", "toString"]) {
      expect(can({ id: "x", role: role as Role }, "post:create")).toBe(false);
    }
  });

  it("papel vindo como valor não-string é negado", () => {
    expect(can({ id: "x", role: 1 as unknown as Role }, "post:create")).toBe(false);
    expect(can({ id: "x", role: ["ADMIN"] as unknown as Role }, "post:create")).toBe(false);
  });
});

describe("can — propriedade do AUTHOR (BOLA/IDOR)", () => {
  const me = actor("AUTHOR", "u-me");
  const mine = (over: Resource = {}): Resource => ({ ownerId: "u-me", status: "DRAFT", ...over });

  it("edita e envia para revisão só o PRÓPRIO artigo em DRAFT", () => {
    expect(can(me, "post:edit", mine())).toBe(true);
    expect(can(me, "post:submit", mine())).toBe(true);
  });

  it("NÃO edita artigo de outra pessoa", () => {
    expect(can(me, "post:edit", mine({ ownerId: "u-outro" }))).toBe(false);
    expect(can(me, "post:submit", mine({ ownerId: "u-outro" }))).toBe(false);
  });

  it("NÃO edita o próprio artigo depois de sair de DRAFT", () => {
    for (const status of ["REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"] as const) {
      expect(can(me, "post:edit", mine({ status }))).toBe(false);
    }
  });

  it("sem recurso informado, a regra de propriedade nega (nunca libera por omissão)", () => {
    expect(can(me, "post:edit")).toBe(false);
    expect(can(me, "post:edit", { status: "DRAFT" })).toBe(false);
    expect(can(me, "post:edit", { ownerId: null, status: "DRAFT" })).toBe(false);
  });

  it("exclui só rascunho próprio que nunca foi publicado", () => {
    expect(can(me, "post:delete-draft", mine())).toBe(true);
    expect(can(me, "post:delete-draft", mine({ hasBeenPublished: true }))).toBe(false);
    expect(can(me, "post:delete-draft", mine({ status: "REVIEW" }))).toBe(false);
    expect(can(me, "post:delete-draft", mine({ ownerId: "u-outro" }))).toBe(false);
  });

  it("edita só o PRÓPRIO perfil de especialista e só edita/apaga a PRÓPRIA mídia", () => {
    expect(can(me, "specialist:edit-own", { ownerId: "u-me" })).toBe(true);
    expect(can(me, "specialist:edit-own", { ownerId: "u-outro" })).toBe(false);
    expect(can(me, "media:manage", { ownerId: "u-me" })).toBe(true);
    expect(can(me, "media:manage", { ownerId: "u-outro" })).toBe(false);
    expect(can(me, "media:delete", { ownerId: "u-me" })).toBe(true);
    expect(can(me, "media:delete", { ownerId: "u-outro" })).toBe(false);
  });
});

describe("can — EDITOR e ADMIN em exclusão de rascunho", () => {
  it("ADMIN exclui rascunho nunca publicado; nunca um que já foi publicado ou saiu de DRAFT", () => {
    const admin = actor("ADMIN");
    expect(can(admin, "post:delete-draft", { ownerId: "outro", status: "DRAFT" })).toBe(true);
    expect(
      can(admin, "post:delete-draft", {
        ownerId: "outro",
        status: "DRAFT",
        hasBeenPublished: true,
      }),
    ).toBe(false);
    expect(can(admin, "post:delete-draft", { ownerId: "outro", status: "PUBLISHED" })).toBe(false);
  });

  it("EDITOR nunca exclui definitivamente", () => {
    expect(can(actor("EDITOR"), "post:delete-draft", { ownerId: "x", status: "DRAFT" })).toBe(
      false,
    );
  });
});

describe("assertCan", () => {
  it("sem sessão → UNAUTHENTICATED", () => {
    expect(() => assertCan(null, "post:create")).toThrowError(AppError);
    try {
      assertCan(undefined, "post:create");
    } catch (error) {
      expect((error as AppError).code).toBe("UNAUTHENTICATED");
    }
  });

  it("sem permissão → FORBIDDEN, ou NOT_FOUND quando deve ocultar a existência", () => {
    const author = actor("AUTHOR", "u-me");
    const alheio: Resource = { ownerId: "u-outro", status: "DRAFT" };
    expect(() => assertCan(author, "post:edit", alheio)).toThrowError(
      expect.objectContaining({ code: "FORBIDDEN" }),
    );
    expect(() => assertCan(author, "post:edit", alheio, { hideExistence: true })).toThrowError(
      expect.objectContaining({ code: "NOT_FOUND" }),
    );
  });

  it("com permissão não lança", () => {
    expect(() => assertCan(actor("ADMIN"), "user:manage")).not.toThrow();
  });

  it("a mensagem de erro não vaza o id do dono do recurso", () => {
    try {
      assertCan(actor("AUTHOR", "u-me"), "post:edit", { ownerId: "u-secreto", status: "DRAFT" });
    } catch (error) {
      expect((error as Error).message).not.toContain("u-secreto");
    }
  });
});
