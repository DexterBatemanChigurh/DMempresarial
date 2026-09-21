/**
 * Verificação OTIMISTA de sessão para o Proxy: só olha se existe o cookie de sessão. NÃO valida
 * o cookie (isso exige banco). É uma conveniência de redirecionamento, nunca a barreira de
 * segurança: cada página, ação e rota de admin valida a sessão de verdade no servidor.
 */
const COOKIE_NAME = "dm.session_token";

export function hasSessionCookie(cookies: { has(name: string): boolean }): boolean {
  // Em HTTPS a biblioteca prefixa o cookie com __Secure-.
  return cookies.has(COOKIE_NAME) || cookies.has(`__Secure-${COOKIE_NAME}`);
}

/** Aceita só caminho interno (evita open redirect via ?next=). */
export function safeNextPath(value: string | null | undefined, fallback = "/admin"): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  if (/[\u0000-\u001f]/.test(value)) return fallback;
  return value.startsWith("/admin") ? value : fallback;
}
