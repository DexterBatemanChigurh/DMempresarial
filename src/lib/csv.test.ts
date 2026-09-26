import { describe, expect, it } from "vitest";
import { csvCell, toCsv } from "./csv";

describe("csvCell", () => {
  it("neutraliza injeção de fórmula vinda de formulário público", () => {
    for (const payload of ['=HYPERLINK("http://x","clique")', "+1+1", "-2+3", "@SUM(A1)", "\t=1"]) {
      expect(csvCell(payload).replace(/^"/, "").startsWith("'")).toBe(true);
    }
  });

  it("escapa aspas, separador e quebra de linha", () => {
    expect(csvCell('diz "oi"; tchau')).toBe('"diz ""oi""; tchau"');
    expect(csvCell("linha 1\nlinha 2")).toBe('"linha 1\nlinha 2"');
  });

  it("nulo vira vazio e data vira ISO", () => {
    expect(csvCell(null)).toBe("");
    expect(csvCell(new Date("2026-09-26T12:00:00Z"))).toBe("2026-09-26T12:00:00.000Z");
  });

  it("texto comum passa intacto (inclusive hífen no meio)", () => {
    expect(csvCell("Frutal-MG")).toBe("Frutal-MG");
  });
});

describe("toCsv", () => {
  it("BOM, cabeçalho e linhas separadas por CRLF", () => {
    expect(toCsv(["a", "b"], [[1, "x"]])).toBe("﻿a;b\r\n1;x\r\n");
  });
});
