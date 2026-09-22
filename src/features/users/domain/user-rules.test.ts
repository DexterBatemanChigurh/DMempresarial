import { describe, expect, it } from "vitest";
import { assertKeepsAtLeastOneAdmin, assertNotSelf, UserGuardError } from "./user-rules";

describe("assertNotSelf", () => {
  it("bloqueia quando ator e alvo são o mesmo", () => {
    expect(() => assertNotSelf("u1", "u1")).toThrow(UserGuardError);
  });
  it("permite quando são pessoas diferentes", () => {
    expect(() => assertNotSelf("u1", "u2")).not.toThrow();
  });
});

describe("assertKeepsAtLeastOneAdmin", () => {
  it("bloqueia rebaixar/desativar o único ADMIN ativo", () => {
    expect(() =>
      assertKeepsAtLeastOneAdmin({
        targetIsCurrentlyActiveAdmin: true,
        activeAdminCount: 1,
        targetWillStayActiveAdmin: false,
      }),
    ).toThrow(UserGuardError);
  });

  it("permite quando existe mais de um ADMIN ativo", () => {
    expect(() =>
      assertKeepsAtLeastOneAdmin({
        targetIsCurrentlyActiveAdmin: true,
        activeAdminCount: 2,
        targetWillStayActiveAdmin: false,
      }),
    ).not.toThrow();
  });

  it("permite quando o alvo não é ADMIN ativo (nada muda)", () => {
    expect(() =>
      assertKeepsAtLeastOneAdmin({
        targetIsCurrentlyActiveAdmin: false,
        activeAdminCount: 1,
        targetWillStayActiveAdmin: false,
      }),
    ).not.toThrow();
  });

  it("permite quando o alvo continua ADMIN ativo depois (ex.: mesma troca)", () => {
    expect(() =>
      assertKeepsAtLeastOneAdmin({
        targetIsCurrentlyActiveAdmin: true,
        activeAdminCount: 1,
        targetWillStayActiveAdmin: true,
      }),
    ).not.toThrow();
  });
});
