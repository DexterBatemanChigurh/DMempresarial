/**
 * Endereços permitidos em links do texto rico (docs/03, parte 9). LISTA DE PERMISSÃO: só o que
 * casa com um dos formatos abaixo é aceito; tudo o mais (javascript:, data:, vbscript:, file:,
 * protocolo relativo "//", espaços, caracteres de controle…) é recusado por não estar na lista.
 */
const MAX_HREF_LENGTH = 2048;

const PATTERNS = {
  web: /^https?:\/\/[^\s/?#\\][^\s\\]*$/i,
  mailto: /^mailto:[^\s@?#\\]+@[^\s@?#\\]+\.[^\s@?#\\]+$/i,
  tel: /^tel:\+?[0-9(][0-9().-]{4,24}$/i,
  // Caminho interno do site: começa com uma única "/" (nunca "//": seria outro site).
  path: /^\/(?!\/)[^\s\\]*$/,
  anchor: /^#[A-Za-z0-9_-]{1,80}$/,
} as const;

export function isAllowedHref(value: unknown): value is string {
  if (typeof value !== "string") return false;
  if (value.length === 0 || value.length > MAX_HREF_LENGTH) return false;
  // Caracteres de controle e espaços em qualquer posição (inclusive "java\tscript:") são recusados.
  if (/[\u0000- \u007f-\u009f]/.test(value)) return false;

  if (PATTERNS.web.test(value)) {
    // Sem "@" na parte de autoridade (https://confiavel.com@golpe.com): forma clássica de disfarçar
    // o domínio real. Vale também para "https://@host", que o parser trata como sem usuário.
    const authority = value.slice(value.indexOf("//") + 2).split(/[/?#]/, 1)[0] ?? "";
    if (authority.includes("@")) return false;
    try {
      const url = new URL(value);
      return url.hostname !== "" && url.username === "" && url.password === "";
    } catch {
      return false;
    }
  }
  return (
    PATTERNS.mailto.test(value) ||
    PATTERNS.tel.test(value) ||
    PATTERNS.path.test(value) ||
    PATTERNS.anchor.test(value)
  );
}

/** Endereço http(s) absoluto: abre em nova aba com `noopener noreferrer`. */
export function isExternalHref(value: string): boolean {
  return /^https?:\/\//i.test(value);
}
