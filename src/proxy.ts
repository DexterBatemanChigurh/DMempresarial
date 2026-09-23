import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, safeNextPath } from "@/server/auth/session-cookie";
import { buildAdminCsp, buildPublicCsp, generateNonce } from "@/server/security/csp";

const isDevelopment = process.env.NODE_ENV === "development";

/** `/admin`: sessão validada de forma otimista (sem banco) + CSP de nonce (camada 1). */
function admin(request: NextRequest): NextResponse {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (!isLogin && !hasSessionCookie(request.cookies)) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", safeNextPath(`${pathname}${search}`));
    return NextResponse.redirect(login);
  }

  const nonce = generateNonce();
  const csp = buildAdminCsp(nonce, { isDevelopment });
  const requestId = crypto.randomUUID();

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("x-request-id", requestId);
  // O Next lê o nonce do CSP da REQUISIÇÃO para marcar seus próprios scripts e estilos.
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  response.headers.set("x-request-id", requestId);
  // A área administrativa nunca é indexada nem guardada em cache compartilhado.
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}

// CSP pública é FIXA (sem nonce): a mesma string toda requisição, então não invalida o cache
// estático nem o PPR do Cache Components (csp.ts explica o porquê).
const publicCsp = buildPublicCsp({ isDevelopment });

/** Qualquer página fora de `/admin`: só a CSP pública, sem tocar sessão nem banco. */
function publicSite(): NextResponse {
  const response = NextResponse.next();
  response.headers.set("Content-Security-Policy", publicCsp);
  return response;
}

/**
 * Proxy (o antigo middleware, Next 16). Roda em toda página (ver matcher) e nunca toca banco:
 * em `/admin` valida sessão de forma otimista e aplica a CSP de nonce; no resto do site, só
 * aplica a CSP pública fixa. NÃO é autorização: toda página e ação de admin valida a sessão de
 * verdade no servidor (docs/03, parte 11).
 */
export function proxy(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  return pathname === "/admin" || pathname.startsWith("/admin/") ? admin(request) : publicSite();
}

export const config = {
  // Fora de `/api`, `/_next` (assets do Next) e arquivos estáticos com extensão.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
