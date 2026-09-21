import { describe, expect, it } from "vitest";
import { contrastRatio, parseHex, relativeLuminance } from "./color";

describe("contraste WCAG", () => {
  it("preto sobre branco é 21:1 e a razão é simétrica", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 5);
    expect(contrastRatio("#ffffff", "#000000")).toBeCloseTo(21, 5);
  });

  it("cor sobre ela mesma é 1:1", () => {
    expect(contrastRatio("#a8482a", "#A8482A")).toBeCloseTo(1, 5);
  });

  it("aceita hexadecimal em maiúsculas e minúsculas e rejeita formatos inválidos", () => {
    expect(parseHex("#F6F2EA")).toEqual([246, 242, 234]);
    for (const bad of ["F6F2EA", "#fff", "#gggggg", "#f6f2eaff", "", "rgb(0,0,0)"]) {
      expect(() => parseHex(bad)).toThrow(/inválida/);
    }
  });

  it("luminância vai de 0 (preto) a 1 (branco)", () => {
    expect(relativeLuminance([0, 0, 0])).toBe(0);
    expect(relativeLuminance([255, 255, 255])).toBeCloseTo(1, 10);
  });
});
