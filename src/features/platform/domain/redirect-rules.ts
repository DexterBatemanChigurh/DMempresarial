/**
 * Regras dos redirecionamentos manuais (docs/03 §20, ADR-016). Só caminhos de conteúdo com slug
 * — os únicos que o Proxy consulta — podem ser ORIGEM: um redirecionamento em qualquer outro
 * caminho nunca dispararia. O destino é qualquer caminho interno (nunca outro site).
 */
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

export const REDIRECT_SOURCE_PATTERN = new RegExp(
  `^/(?:blog|solucoes|sobre/especialistas)/(?!categoria$)${SLUG}$`,
);

const INTERNAL_PATH = /^\/(?!\/)[^\s\\]*$/;
const MAX_PATH = 300;

/** Remove espaços, barra final e query/fragmento — a origem é comparada só pelo caminho. */
export function normalizePath(path: string): string {
  const trimmed = path.trim().replace(/[?#].*$/, "");
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
}

export function isRedirectSource(path: string): boolean {
  return REDIRECT_SOURCE_PATTERN.test(path);
}

export type RedirectInputErrors = { fromPath?: string[]; toPath?: string[] };

export function validateManualRedirect(input: { fromPath: string; toPath: string }): {
  fromPath: string;
  toPath: string;
  errors: RedirectInputErrors;
} {
  const fromPath = normalizePath(input.fromPath);
  const toPath = input.toPath.trim();
  const errors: RedirectInputErrors = {};

  if (!isRedirectSource(fromPath)) {
    errors.fromPath = [
      "Use um endereço de artigo, solução ou especialista (ex.: /blog/nome-antigo).",
    ];
  }
  if (!INTERNAL_PATH.test(toPath) || toPath.length > MAX_PATH) {
    errors.toPath = ["Use um caminho do próprio site, começando com / (ex.: /blog/nome-novo)."];
  } else if (normalizePath(toPath) === fromPath) {
    errors.toPath = ["O destino não pode ser o mesmo endereço da origem."];
  }
  return { fromPath, toPath, errors };
}
