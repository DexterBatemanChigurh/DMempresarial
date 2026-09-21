/**
 * Content-Security-Policy da área administrativa (docs/03, parte 13, ADR-009, camada 2).
 * O painel é sempre renderizado por requisição, então pode usar NONCE: nenhum script inline
 * sem o nonce da requisição executa, e `strict-dynamic` deixa o Next carregar seus próprios
 * pacotes. Sem `unsafe-inline` nem `unsafe-eval` em scripts em produção.
 *
 * A camada pública (páginas estáticas em cache) não usa nonce e tem política própria na fase de
 * segurança; nonce em tudo desligaria cache estático e PPR (documentação do Next 16).
 */
export type CspOptions = {
  /** Em desenvolvimento o React precisa de `unsafe-eval` para reconstruir pilhas de erro. */
  isDevelopment?: boolean;
  /** Origens extras para imagens (ex.: host público do storage de mídia). */
  imageOrigins?: readonly string[];
};

/** Nonce imprevisível e único por requisição (base64 de 128 bits de aleatoriedade). */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export function buildAdminCsp(nonce: string, options: CspOptions = {}): string {
  if (!/^[A-Za-z0-9+/=]{16,}$/.test(nonce)) {
    throw new Error("Nonce inválido para a CSP.");
  }
  const dev = options.isDevelopment === true;
  const images = ["'self'", "data:", "blob:", ...(options.imageOrigins ?? [])];

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    "script-src": [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      ...(dev ? ["'unsafe-eval'"] : []),
    ],
    // Estilos em elementos <style> exigem o nonce; atributos style="" (editor de texto rico)
    // ficam liberados separadamente, pois o ProseMirror os usa e o risco é de baixo impacto.
    "style-src": ["'self'", `'nonce-${nonce}'`],
    "style-src-attr": ["'unsafe-inline'"],
    "img-src": images,
    "font-src": ["'self'"],
    "connect-src": ["'self'"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  const parts = Object.entries(directives).map(([name, values]) => `${name} ${values.join(" ")}`);
  if (!dev) parts.push("upgrade-insecure-requests");
  return parts.join("; ");
}
