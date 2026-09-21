import { describe, expect, it } from "vitest";
import { extractPlainText, isEmptyRichText, readingMinutes } from "./text";

const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (text: string) => ({ type: "paragraph", content: [{ type: "text", text }] });

describe("extractPlainText", () => {
  it("junta o texto dos blocos separando-os por espaço", () => {
    expect(extractPlainText(doc(p("Primeiro"), p("Segundo")))).toBe("Primeiro Segundo");
  });

  it("percorre listas, citações e marcas em linha", () => {
    const value = doc(
      { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Título" }] },
      {
        type: "bulletList",
        content: [
          { type: "listItem", content: [p("item um")] },
          { type: "listItem", content: [p("item dois")] },
        ],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "negrito", marks: [{ type: "bold" }] }],
      },
    );
    expect(extractPlainText(value)).toBe("Título item um item dois negrito");
  });

  it("entrada inválida vira vazio, sem lançar", () => {
    for (const bad of [null, undefined, 42, "texto", [], {}, { type: "doc" }, { content: "x" }]) {
      expect(extractPlainText(bad)).toBe("");
    }
  });

  it("não quebra com estrutura muito profunda nem com referência circular", () => {
    let deep: Record<string, unknown> = { type: "text", text: "fundo" };
    for (let i = 0; i < 500; i++) deep = { type: "paragraph", content: [deep] };
    expect(() => extractPlainText(deep)).not.toThrow();

    const circular: Record<string, unknown> = { type: "paragraph", content: [] };
    (circular.content as unknown[]).push(circular);
    expect(() => extractPlainText(circular)).not.toThrow();
  });

  it("limita o tamanho do texto extraído", () => {
    const big = doc(p("x".repeat(600_000)), p("y".repeat(600_000)), p("z".repeat(600_000)));
    expect(extractPlainText(big).length).toBeLessThanOrEqual(1_000_000);
  });

  it("não interpreta HTML: devolve o texto como veio", () => {
    expect(extractPlainText(doc(p("<script>alert(1)</script>")))).toBe("<script>alert(1)</script>");
  });
});

describe("isEmptyRichText", () => {
  it("documento sem texto (ou só espaços) é vazio", () => {
    expect(isEmptyRichText(doc())).toBe(true);
    expect(isEmptyRichText(doc(p("   "), p("")))).toBe(true);
    expect(isEmptyRichText(doc(p("oi")))).toBe(false);
  });
});

describe("readingMinutes", () => {
  it("vazio = 0; qualquer texto = pelo menos 1; arredonda para cima a 200 palavras/min", () => {
    expect(readingMinutes("")).toBe(0);
    expect(readingMinutes("   ")).toBe(0);
    expect(readingMinutes("uma palavra")).toBe(1);
    expect(readingMinutes("a ".repeat(200))).toBe(1);
    expect(readingMinutes("a ".repeat(201))).toBe(2);
    expect(readingMinutes("a ".repeat(1000))).toBe(5);
  });
});
