/**
 * Caminhos que o Proxy consulta na tabela de redirecionamentos (docs/03 §20, ADR-016). Só existem
 * redirecionamentos automáticos de artigo: quando o slug de um artigo publicado muda, o endereço
 * antigo leva ao novo. Soluções e especialistas são conteúdo fixo (src/content/dm.ts) e nunca
 * geram registro, então o Proxy não consulta o banco para eles.
 */
const SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";

const REDIRECT_SOURCE_PATTERN = new RegExp(`^/blog/(?!categoria$)${SLUG}$`);

export function isRedirectSource(path: string): boolean {
  return REDIRECT_SOURCE_PATTERN.test(path);
}
