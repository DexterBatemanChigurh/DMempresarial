/**
 * Cálculo de contraste WCAG 2.x (razão de luminância relativa). Puro e isomórfico. Usado pelos
 * testes que protegem a paleta do Design System: se um token mudar e um par previsto no
 * Blueprint 2 (seção 10) cair abaixo do mínimo, o teste falha.
 */

export type Rgb = readonly [number, number, number];

export function parseHex(hex: string): Rgb {
  const match = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match?.[1]) throw new Error(`Cor hexadecimal inválida: ${hex}`);
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

function channel(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance([r, g, b]: Rgb): number {
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Razão de contraste entre duas cores, de 1 a 21. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(parseHex(a));
  const lb = relativeLuminance(parseHex(b));
  const [light, dark] = la >= lb ? [la, lb] : [lb, la];
  return (light + 0.05) / (dark + 0.05);
}

/** WCAG AA: 4,5:1 para texto normal, 3:1 para texto grande e componentes de interface. */
export const WCAG = { aaText: 4.5, aaLargeOrUi: 3, aaaText: 7 } as const;
