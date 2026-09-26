import { describe, expect, it } from "vitest";
import { isRedirectSource, normalizePath, validateManualRedirect } from "./redirect-rules";

describe("isRedirectSource", () => {
  it("aceita só caminhos de conteúdo com slug (os que o Proxy consulta)", () => {
    for (const ok of ["/blog/artigo-antigo", "/solucoes/gestao", "/sobre/especialistas/maria"]) {
      expect(isRedirectSource(ok), ok).toBe(true);
    }
    for (const bad of [
      "/",
      "/blog",
      "/blog/categoria",
      "/blog/categoria/gestao",
      "/contato",
      "/blog/Maiuscula",
      "/blog/a/b",
      "/admin/leads",
      "/api/x",
    ]) {
      expect(isRedirectSource(bad), bad).toBe(false);
    }
  });
});

describe("normalizePath", () => {
  it("tira espaços, barra final, query e fragmento", () => {
    expect(normalizePath(" /blog/x/?utm=1#topo ")).toBe("/blog/x");
    expect(normalizePath("/")).toBe("/");
  });
});

describe("validateManualRedirect", () => {
  it("aceita origem de conteúdo e destino interno", () => {
    expect(validateManualRedirect({ fromPath: "/blog/velho/", toPath: "/blog/novo" })).toEqual({
      fromPath: "/blog/velho",
      toPath: "/blog/novo",
      errors: {},
    });
  });

  it("recusa destino externo ou disfarçado (open redirect)", () => {
    for (const toPath of ["https://golpe.test", "//golpe.test", "/\\golpe.test", "blog/x", "/ a"]) {
      expect(
        validateManualRedirect({ fromPath: "/blog/a", toPath }).errors.toPath,
        toPath,
      ).toBeDefined();
    }
  });

  it("recusa laço para si mesmo", () => {
    expect(
      validateManualRedirect({ fromPath: "/blog/a", toPath: "/blog/a/" }).errors.toPath,
    ).toBeDefined();
  });
});
