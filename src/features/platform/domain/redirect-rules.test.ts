import { describe, expect, it } from "vitest";
import { isRedirectSource, normalizePath } from "./redirect-rules";

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
