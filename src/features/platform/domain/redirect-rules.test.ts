import { describe, expect, it } from "vitest";
import { isRedirectSource } from "./redirect-rules";

describe("isRedirectSource", () => {
  it("aceita só endereços de artigo com slug (os únicos que geram redirecionamento)", () => {
    expect(isRedirectSource("/blog/artigo-antigo")).toBe(true);
    for (const bad of [
      "/",
      "/blog",
      "/blog/categoria",
      "/blog/categoria/gestao",
      "/solucoes/gestao",
      "/sobre/especialistas/maria",
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
