/**
 * CSV para exportação (leads, assinantes). Dois cuidados:
 *  - aspas/quebras de linha escapadas pelo padrão RFC 4180;
 *  - injeção de fórmula: um valor vindo de formulário público que comece com `=`, `+`, `-`, `@`,
 *    tab ou CR seria executado como fórmula ao abrir no Excel/Sheets (ex.: `=HYPERLINK(...)`).
 *    Esses valores ganham um apóstrofo na frente e viram texto (recomendação OWASP).
 * O arquivo começa com BOM para o Excel reconhecer UTF-8 (acentos) e usa `;`, o separador que o
 * Excel em pt-BR espera.
 */
const FORMULA_START = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  if (FORMULA_START.test(text)) text = `'${text}`;
  return /[";\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(header: readonly string[], rows: readonly (readonly unknown[])[]): string {
  const lines = [header, ...rows].map((row) => row.map(csvCell).join(";"));
  return `﻿${lines.join("\r\n")}\r\n`;
}
