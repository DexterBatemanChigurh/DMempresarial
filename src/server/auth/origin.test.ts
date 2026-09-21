import { describe, expect, it } from "vitest";
import { isTrustedOriginRequest } from "./origin";

const BASE = "https://dm.example.test";
const post = (headers: Record<string, string> = {}) =>
  new Request(`${BASE}/api/auth/sign-in/email`, { method: "POST", headers });

describe("isTrustedOriginRequest", () => {
  it("aceita a origem configurada", () => {
    expect(isTrustedOriginRequest(post({ origin: BASE }), BASE)).toBe(true);
  });

  it("recusa outra origem, subdomínio, porta ou esquema diferentes e a origem 'null'", () => {
    for (const origin of [
      "https://evil.example",
      "https://dm.example.test.evil.example",
      "https://sub.dm.example.test",
      "http://dm.example.test",
      "https://dm.example.test:8443",
      "null",
      "",
    ]) {
      expect(isTrustedOriginRequest(post({ origin }), BASE)).toBe(false);
    }
  });

  it("sem Origin, usa o Fetch Metadata: recusa cross-site e same-site, aceita same-origin e none", () => {
    expect(isTrustedOriginRequest(post({ "sec-fetch-site": "cross-site" }), BASE)).toBe(false);
    expect(isTrustedOriginRequest(post({ "sec-fetch-site": "same-site" }), BASE)).toBe(false);
    expect(isTrustedOriginRequest(post({ "sec-fetch-site": "same-origin" }), BASE)).toBe(true);
    expect(isTrustedOriginRequest(post({ "sec-fetch-site": "none" }), BASE)).toBe(true);
  });

  it("cliente que não é navegador (sem Origin nem Fetch Metadata) é permitido", () => {
    expect(isTrustedOriginRequest(post(), BASE)).toBe(true);
  });

  it("Origin errado prevalece mesmo se o Fetch Metadata disser same-origin", () => {
    expect(
      isTrustedOriginRequest(
        post({ origin: "https://evil.example", "sec-fetch-site": "same-origin" }),
        BASE,
      ),
    ).toBe(false);
  });

  it("métodos seguros não são barrados", () => {
    for (const method of ["GET", "HEAD", "OPTIONS"]) {
      const request = new Request(`${BASE}/api/auth/get-session`, {
        method,
        headers: { origin: "https://evil.example" },
      });
      expect(isTrustedOriginRequest(request, BASE)).toBe(true);
    }
  });
});
