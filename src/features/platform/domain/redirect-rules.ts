/**
 * Caminhos que o Proxy consulta na tabela de redirecionamentos (docs/03 §20, ADR-016). Hoje só há
 * os automáticos: quando o slug de um artigo publicado muda, o endereço antigo leva ao novo.
 */
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

export const REDIRECT_SOURCE_PATTERN = new RegExp(
  `^/(?:blog|solucoes|sobre/especialistas)/(?!categoria$)${SLUG}$`,
);

/** Remove espaços, barra final e query/fragmento — a origem é comparada só pelo caminho. */
export function normalizePath(path: string): string {
  const trimmed = path.trim().replace(/[?#].*$/, "");
  return trimmed.length > 1 ? trimmed.replace(/\/+$/, "") : trimmed;
}

export function isRedirectSource(path: string): boolean {
  return REDIRECT_SOURCE_PATTERN.test(path);
}
