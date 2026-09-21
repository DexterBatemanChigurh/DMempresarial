import { describe, expect, it } from "vitest";
import { isReservedSlug, isValidSlug, MAX_SLUG_LENGTH, slugify } from "./slug";

describe("slugify", () => {
  it("remove acentos, normaliza caixa e separa por hífen", () => {
    expect(slugify("Gestão e Finanças")).toBe("gestao-e-financas");
    expect(slugify("  Negócios em Frutal e Região  ")).toBe("negocios-em-frutal-e-regiao");
    expect(slugify("Ação & Reação")).toBe("acao-e-reacao");
  });

  it("colapsa símbolos e não deixa hífen nas pontas", () => {
    expect(slugify("---Olá,   mundo!!!---")).toBe("ola-mundo");
    expect(slugify("C++ / Java (2026)")).toBe("c-java-2026");
  });

  it("respeita o tamanho máximo sem terminar em hífen", () => {
    const slug = slugify("palavra ".repeat(40));
    expect(slug.length).toBeLessThanOrEqual(MAX_SLUG_LENGTH);
    expect(slug.endsWith("-")).toBe(false);
  });

  it("entrada sem letras ou números vira vazio (e vazio é inválido)", () => {
    expect(slugify("¡¿?!")).toBe("");
    expect(isValidSlug(slugify("¡¿?!"))).toBe(false);
  });

  it("todo resultado não vazio é um slug válido", () => {
    for (const title of [
      "Ação",
      "Ç à la carte",
      "O que uma crise de caixa revela?",
      "2026: o ano",
    ]) {
      expect(isValidSlug(slugify(title))).toBe(true);
    }
  });
});

describe("isValidSlug", () => {
  it("aceita minúsculas, números e hífens internos", () => {
    for (const ok of ["a", "gestao", "gestao-financeira", "top-10-erros", "2026"]) {
      expect(isValidSlug(ok), ok).toBe(true);
    }
  });

  it("recusa maiúsculas, acentos, espaços, barras, hífens nas pontas e duplos", () => {
    for (const bad of [
      "",
      "Gestao",
      "gestão",
      "a b",
      "a/b",
      "-a",
      "a-",
      "a--b",
      "../etc",
      "a.b",
      "a_b",
    ]) {
      expect(isValidSlug(bad), bad).toBe(false);
    }
  });

  it("recusa mais de 80 caracteres", () => {
    expect(isValidSlug("a".repeat(80))).toBe(true);
    expect(isValidSlug("a".repeat(81))).toBe(false);
  });
});

describe("isReservedSlug", () => {
  it("reserva os caminhos que o site já usa", () => {
    for (const reserved of ["admin", "api", "blog", "categoria", "contato", "solucoes"]) {
      expect(isReservedSlug(reserved)).toBe(true);
    }
    expect(isReservedSlug("gestao-financeira")).toBe(false);
  });
});
