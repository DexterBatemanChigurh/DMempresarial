import { describe, expect, it } from "vitest";
import { actorFromUser } from "./actor";

describe("actorFromUser", () => {
  it("converte usuário válido em ator", () => {
    expect(actorFromUser({ id: "u1", role: "EDITOR", disabledAt: null })).toEqual({
      id: "u1",
      role: "EDITOR",
    });
    expect(actorFromUser({ id: "u1", role: "ADMIN" })).toEqual({ id: "u1", role: "ADMIN" });
  });

  it("falha fechado sem usuário, sem id ou com id não-texto", () => {
    expect(actorFromUser(null)).toBeNull();
    expect(actorFromUser(undefined)).toBeNull();
    expect(actorFromUser({ id: "", role: "ADMIN" })).toBeNull();
    expect(actorFromUser({ id: 7, role: "ADMIN" })).toBeNull();
    expect(actorFromUser({ role: "ADMIN" })).toBeNull();
  });

  it("conta desativada NUNCA vira ator, seja qual for o formato do valor", () => {
    expect(actorFromUser({ id: "u1", role: "ADMIN", disabledAt: new Date() })).toBeNull();
    expect(
      actorFromUser({ id: "u1", role: "ADMIN", disabledAt: "2026-01-01T00:00:00Z" }),
    ).toBeNull();
    expect(actorFromUser({ id: "u1", role: "ADMIN", disabledAt: 0 })).toBeNull();
  });

  it("papel ausente, desconhecido ou de tipo errado não vira ator (sem padrão permissivo)", () => {
    for (const role of [undefined, null, "", "SUPERADMIN", "admin", "constructor", 1, ["ADMIN"]]) {
      expect(actorFromUser({ id: "u1", role })).toBeNull();
    }
  });
});
