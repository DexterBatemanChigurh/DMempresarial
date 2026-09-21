import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, safeNextPath } from "@/server/auth/session-cookie";
import { buildAdminCsp, generateNonce } from "@/server/security/csp";

/**
 * Proxy (o antigo middleware, Next 16). Roda só em /admin (ver matcher) e faz três coisas
 * rápidas e SEM banco: (1) request id para os logs, (2) CSP com nonce, (3) redirecionamento
 * otimista de quem não tem cookie de sessão. NÃO é autorização: toda página e ação de admin
 * valida a sessão de verdade no servidor (docs/03, parte 11).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login/");

  if (!isLogin && !hasSessionCookie(request.cookies)) {
    const login = new URL("/admin/login", request.url);
    login.searchParams.set("next", safeNextPath(`${pathname}${search}`));
    return NextResponse.redirect(login);
  }

  const nonce = generateNonce();
  const csp = buildAdminCsp(nonce, { isDevelopment: process.env.NODE_ENV === "development" });
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

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
