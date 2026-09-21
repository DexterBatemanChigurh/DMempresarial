import { describe, expect, it } from "vitest";
import { hasSessionCookie, safeNextPath } from "./session-cookie";

const jar = (...names: string[]) => ({ has: (name: string) => names.includes(name) });

describe("hasSessionCookie", () => {
  it("reconhece o cookie de sessão, com e sem prefixo seguro", () => {
    expect(hasSessionCookie(jar("dm.session_token"))).toBe(true);
    expect(hasSessionCookie(jar("__Secure-dm.session_token"))).toBe(true);
  });

  it("outros cookies (inclusive de 2FA e parecidos) não contam como sessão", () => {
    expect(hasSessionCookie(jar())).toBe(false);
    expect(hasSessionCookie(jar("dm.two_factor"))).toBe(false);
    expect(hasSessionCookie(jar("session_token"))).toBe(false);
    expect(hasSessionCookie(jar("dm.session_data"))).toBe(false);
  });
});

describe("safeNextPath (open redirect)", () => {
  it("aceita caminhos internos do painel", () => {
    expect(safeNextPath("/admin")).toBe("/admin");
    expect(safeNextPath("/admin/posts/novo?x=1")).toBe("/admin/posts/novo?x=1");
  });

  it("recusa endereço externo, protocolo relativo, barra invertida e controle", () => {
    for (const bad of [
      "https://evil.example",
      "//evil.example",
      "/\\evil.example",
      "javascript:alert(1)",
      "/admin\nSet-Cookie: x=1",
      "evil.example",
      "",
    ]) {
      expect(safeNextPath(bad), JSON.stringify(bad)).toBe("/admin");
    }
  });

  it("caminho interno fora do painel também volta ao painel", () => {
    expect(safeNextPath("/blog")).toBe("/admin");
    expect(safeNextPath(null)).toBe("/admin");
    expect(safeNextPath(undefined, "/admin/login")).toBe("/admin/login");
  });
});
