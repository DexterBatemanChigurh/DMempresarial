import { describe, expect, it } from "vitest";
import { buildAdminCsp, buildPublicCsp, generateNonce } from "./csp";

const NONCE = "dGVzdGUtZGUtbm9uY2UtMTIzNA==";

const directive = (csp: string, name: string): string[] =>
  (csp.split("; ").find((d) => d.startsWith(`${name} `)) ?? "").split(" ").slice(1);

describe("generateNonce", () => {
  it("gera valores base64 diferentes a cada chamada", () => {
    const nonces = new Set(Array.from({ length: 50 }, () => generateNonce()));
    expect(nonces.size).toBe(50);
    for (const nonce of nonces) expect(nonce).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });
});

describe("buildAdminCsp", () => {
  it("em produção: scripts só com nonce + strict-dynamic, sem unsafe-inline nem unsafe-eval", () => {
    const script = directive(buildAdminCsp(NONCE), "script-src");
    expect(script).toEqual(["'self'", `'nonce-${NONCE}'`, "'strict-dynamic'"]);
    expect(script).not.toContain("'unsafe-inline'");
    expect(script).not.toContain("'unsafe-eval'");
  });

  it("unsafe-eval só aparece em desenvolvimento", () => {
    expect(directive(buildAdminCsp(NONCE, { isDevelopment: true }), "script-src")).toContain(
      "'unsafe-eval'",
    );
    expect(buildAdminCsp(NONCE)).not.toContain("unsafe-eval");
  });

  it("bloqueia plugins, framing e base/form externos", () => {
    const csp = buildAdminCsp(NONCE);
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
  });

  it("scripts inline em ATRIBUTO (onclick) continuam bloqueados: só style tem exceção", () => {
    const csp = buildAdminCsp(NONCE);
    expect(directive(csp, "style-src-attr")).toEqual(["'unsafe-inline'"]);
    expect(csp).not.toMatch(/script-src-attr/);
    expect(directive(csp, "style-src")).not.toContain("'unsafe-inline'");
  });

  it("conexões só para a própria origem; imagens aceitam as origens extras informadas", () => {
    const csp = buildAdminCsp(NONCE, { imageOrigins: ["https://midia.exemplo.test"] });
    expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    expect(directive(csp, "img-src")).toContain("https://midia.exemplo.test");
    expect(directive(buildAdminCsp(NONCE), "img-src")).not.toContain("https://midia.exemplo.test");
  });

  it("upgrade-insecure-requests em produção, não em desenvolvimento", () => {
    expect(buildAdminCsp(NONCE)).toContain("upgrade-insecure-requests");
    expect(buildAdminCsp(NONCE, { isDevelopment: true })).not.toContain(
      "upgrade-insecure-requests",
    );
  });

  it("recusa nonce vazio ou com caracteres que abririam a diretiva (injeção)", () => {
    for (const bad of [
      "",
      "curto",
      "abc; script-src *",
      "x'y'z".padEnd(20, "a"),
      "a b c d e f g h i j k l",
    ]) {
      expect(() => buildAdminCsp(bad), JSON.stringify(bad)).toThrow(/Nonce inválido/);
    }
  });
});

describe("buildPublicCsp", () => {
  it("sem nonce: 'unsafe-inline' em script/style (orientação oficial do Next sem nonce), sem unsafe-eval em produção", () => {
    const script = directive(buildPublicCsp(), "script-src");
    expect(script).toEqual(["'self'", "'unsafe-inline'"]);
    expect(script).not.toContain("'unsafe-eval'");
    expect(directive(buildPublicCsp(), "style-src")).toEqual(["'self'", "'unsafe-inline'"]);
  });

  it("unsafe-eval só aparece em desenvolvimento", () => {
    expect(directive(buildPublicCsp({ isDevelopment: true }), "script-src")).toContain(
      "'unsafe-eval'",
    );
    expect(buildPublicCsp()).not.toContain("unsafe-eval");
  });

  it("bloqueia plugins, framing e base/form externos", () => {
    const csp = buildPublicCsp();
    expect(directive(csp, "object-src")).toEqual(["'none'"]);
    expect(directive(csp, "frame-ancestors")).toEqual(["'none'"]);
    expect(directive(csp, "base-uri")).toEqual(["'self'"]);
    expect(directive(csp, "form-action")).toEqual(["'self'"]);
    expect(directive(csp, "default-src")).toEqual(["'self'"]);
  });

  it("sem exceção de style-src-attr (o editor de texto rico não existe no público)", () => {
    expect(buildPublicCsp()).not.toMatch(/style-src-attr/);
  });

  it("imagens aceitam as origens extras informadas; conexões só para a própria origem", () => {
    const csp = buildPublicCsp({ imageOrigins: ["https://midia.exemplo.test"] });
    expect(directive(csp, "connect-src")).toEqual(["'self'"]);
    expect(directive(csp, "img-src")).toContain("https://midia.exemplo.test");
    expect(directive(buildPublicCsp(), "img-src")).not.toContain("https://midia.exemplo.test");
  });

  it("upgrade-insecure-requests em produção, não em desenvolvimento", () => {
    expect(buildPublicCsp()).toContain("upgrade-insecure-requests");
    expect(buildPublicCsp({ isDevelopment: true })).not.toContain("upgrade-insecure-requests");
  });
});
