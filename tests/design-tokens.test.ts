import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contrastRatio, WCAG } from "../src/lib/color";

/**
 * Protege o Design System (docs/02, seções 09 e 10). Lê os valores REAIS de `globals.css`:
 * se alguém trocar um matiz e um par previsto cair abaixo do mínimo, o teste falha.
 */
const CSS = readFileSync("src/app/globals.css", "utf8");

function color(name: string): string {
  const match = new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})\\s*;`).exec(CSS);
  if (!match?.[1]) throw new Error(`Token de cor não encontrado: --color-${name}`);
  return match[1];
}

function ratio(fg: string, bg: string): number {
  return contrastRatio(color(fg), color(bg));
}

describe("paleta: valores da tabela de contraste do Blueprint 2 (seção 10)", () => {
  // [texto, fundo, razão documentada]
  const documented: [string, string, number][] = [
    ["tinta", "papel", 14.9],
    ["tinta", "areia", 12.7],
    ["tinta-secundaria", "papel", 7.41],
    ["tinta-secundaria", "areia", 6.31],
    ["tinta-suave", "papel", 4.6],
    ["verde-tinta", "papel", 10.86],
    ["papel", "verde-tinta", 10.86],
    ["areia", "verde-tinta", 9.26],
    ["papel", "terracota", 5.19],
    ["papel", "terracota-escura", 6.68],
    ["papel", "azul-marca", 4.6],
    ["papel", "azul-marca-escuro", 6.34],
    ["azul-marca-escuro", "areia", 5.4],
    ["azul-marca-claro", "verde-tinta", 4.65],
    ["erro", "papel", 6.85],
    ["borda-campo", "papel", 3.61],
  ];
  for (const [fg, bg, expected] of documented) {
    it(`${fg} sobre ${bg} = ${expected}:1 (como no documento)`, () => {
      expect(ratio(fg, bg)).toBeCloseTo(expected, 1);
    });
  }
});

describe("paleta: mínimos WCAG dos usos previstos", () => {
  it("texto principal e de link passam em AAA nas superfícies onde são usados", () => {
    for (const [fg, bg] of [
      ["tinta", "papel"],
      ["tinta", "areia"],
      ["tinta-secundaria", "papel"],
      ["verde-tinta", "papel"],
      ["papel", "verde-tinta"],
      ["areia", "verde-tinta"],
    ] as const) {
      expect(ratio(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(WCAG.aaaText);
    }
  });

  it("texto de apoio, ação e feedback passam em AA (4,5:1)", () => {
    for (const [fg, bg] of [
      ["tinta-secundaria", "areia"],
      ["tinta-suave", "papel"],
      ["papel", "terracota"],
      ["terracota", "papel"],
      ["papel", "terracota-escura"],
      ["papel", "azul-marca"],
      ["azul-marca", "papel"],
      ["azul-marca", "papel-elevado"],
      ["papel", "azul-marca-escuro"],
      ["azul-marca-escuro", "areia"],
      ["azul-marca-claro", "verde-tinta"],
      ["sucesso", "papel"],
      ["aviso", "papel"],
      ["erro", "papel"],
      ["erro", "papel-elevado"],
      ["tinta-secundaria", "areia"],
    ] as const) {
      expect(ratio(fg, bg), `${fg} sobre ${bg}`).toBeGreaterThanOrEqual(WCAG.aaText);
    }
  });

  it("borda de campo e anel de foco passam em 3:1 (componentes de interface)", () => {
    expect(ratio("borda-campo", "papel")).toBeGreaterThanOrEqual(WCAG.aaLargeOrUi);
    expect(ratio("borda-campo", "papel-elevado")).toBeGreaterThanOrEqual(WCAG.aaLargeOrUi);
    expect(ratio("verde-tinta", "papel")).toBeGreaterThanOrEqual(WCAG.aaLargeOrUi);
    expect(ratio("papel", "verde-tinta")).toBeGreaterThanOrEqual(WCAG.aaLargeOrUi);
  });

  it("registra as combinações PROIBIDAS: realmente reprovam, por isso têm regra própria", () => {
    // Tinta suave sobre areia (3,92): em faixa areia o metadado usa a tinta secundária.
    expect(ratio("tinta-suave", "areia")).toBeLessThan(WCAG.aaText);
    // Terracota sobre verde-tinta (2,09): nunca como texto/linha em faixa escura.
    expect(ratio("terracota", "verde-tinta")).toBeLessThan(WCAG.aaLargeOrUi);
    // Azul (cor de ação) sobre areia (3,92): em faixa areia o link usa o azul-escuro.
    expect(ratio("azul-marca", "areia")).toBeLessThan(WCAG.aaText);
    // Papel sobre azul-claro (2,33): o azul-claro nunca é fundo de botão.
    expect(ratio("papel", "azul-marca-claro")).toBeLessThan(WCAG.aaText);
  });
});

/** Resolve as variáveis semânticas de cada faixa lendo os blocos reais do CSS. */
function semanticFor(tone: "default" | "muted" | "dark"): Record<string, string> {
  const block = (selector: RegExp): string => {
    const match = selector.exec(CSS);
    return match?.[1] ?? "";
  };
  const parse = (body: string) => {
    const out: Record<string, string> = {};
    for (const m of body.matchAll(/--([a-z-]+):\s*var\(--color-([a-z-]+)\)\s*;/g)) {
      if (m[1] && m[2]) out[m[1]] = m[2];
    }
    return out;
  };
  const root = parse(block(/:root\s*\{([^}]*)\}/));
  if (tone === "default") return root;
  const toneBody = block(new RegExp(`\\[data-tone="${tone}"\\]\\s*\\{([^}]*)\\}`));
  return { ...root, ...parse(toneBody) };
}

describe("faixas de tom: as variáveis semânticas mantêm contraste em cada uma", () => {
  for (const tone of ["default", "muted", "dark"] as const) {
    describe(`tom ${tone}`, () => {
      const sem = semanticFor(tone);
      const token = (name: string): string => {
        const value = sem[name];
        if (!value) throw new Error(`Variável semântica ausente: --${name} (tom ${tone})`);
        return value;
      };

      it("texto principal em AAA e texto secundário, suave e link em AA", () => {
        expect(ratio(token("text"), token("surface"))).toBeGreaterThanOrEqual(WCAG.aaaText);
        for (const name of ["text-secondary", "text-muted", "link"]) {
          expect(ratio(token(name), token("surface")), name).toBeGreaterThanOrEqual(WCAG.aaText);
        }
      });

      it("foco e filete forte visíveis (3:1) e rótulo do botão de ação legível", () => {
        expect(ratio(token("focus"), token("surface"))).toBeGreaterThanOrEqual(WCAG.aaLargeOrUi);
        expect(ratio(token("border-strong"), token("surface"))).toBeGreaterThanOrEqual(
          WCAG.aaLargeOrUi,
        );
        expect(ratio(token("action-contrast"), token("action"))).toBeGreaterThanOrEqual(
          WCAG.aaText,
        );
        expect(ratio(token("action-contrast"), token("action-hover"))).toBeGreaterThanOrEqual(
          WCAG.aaText,
        );
      });
    });
  }

  it("a faixa escura nunca usa terracota como texto, link ou linha", () => {
    const dark = /\[data-tone="dark"\]\s*\{([^}]*)\}/.exec(CSS)?.[1] ?? "";
    expect(dark.length).toBeGreaterThan(0);
    expect(dark).not.toMatch(/terracota/);
  });

  it("a faixa areia troca o texto suave pelo secundário (regra do Blueprint 2)", () => {
    expect(semanticFor("muted")["text-muted"]).toBe("tinta-secundaria");
  });
});

describe("tokens: cor só existe em globals.css", () => {
  function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
      const path = join(dir, entry);
      if (statSync(path).isDirectory()) return sourceFiles(path);
      return /\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) ? [path] : [];
    });
  }

  it("nenhum componente ou página usa hexadecimal, rgb() ou hsl() solto", () => {
    const offenders: string[] = [];
    for (const file of [...sourceFiles("src/components"), ...sourceFiles("src/app")]) {
      const text = readFileSync(file, "utf8");
      if (/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|\brgba?\(|\bhsla?\(/.test(text))
        offenders.push(file);
    }
    expect(offenders).toEqual([]);
  });

  it("as cores padrão do Tailwind estão desligadas (só existe a paleta da marca)", () => {
    expect(CSS).toMatch(/--color-\*:\s*initial\s*;/);
  });

  it("o movimento reduzido é respeitado globalmente", () => {
    expect(CSS).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
  });
});
