import { NextResponse, type NextRequest } from "next/server";
import { hasSessionCookie, safeNextPath } from "@/server/auth/session-cookie";
import { buildAdminCsp, buildPublicCsp, generateNonce } from "@/server/security/csp";
import { getRedirectForRoute } from "@/features/platform/application/public-redirects";

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
 * Redirecionamento de posts com slug trocado (docs/03 §20). Precisa acontecer aqui, e não dentro
 * de `/blog/[slug]/page.tsx`: sob Cache Components/PPR, um `permanentRedirect()` que depende de
 * leitura de banco só executa no trecho adiado (streaming) da página — o Next então manda um 200
 * e resolve a navegação por JS no cliente (comportamento documentado do `permanentRedirect`),
 * nunca um 301/308 de verdade. O Proxy roda em runtime Node.js por padrão no Next 16 e decide
 * antes de a página renderizar, então consegue responder com um redirecionamento HTTP real.
 */
async function blogRedirect(request: NextRequest): Promise<NextResponse | null> {
  const target = await getRedirectForRoute(request.nextUrl.pathname);
  if (!target) return null;
  const response = NextResponse.redirect(new URL(target.toPath, request.url), target.statusCode);
  response.headers.set("Content-Security-Policy", publicCsp);
  return response;
}

/**
 * Proxy (o antigo middleware, Next 16). Roda em toda página (ver matcher): em `/admin` valida
 * sessão de forma otimista e aplica a CSP de nonce; no resto do site, só aplica a CSP pública
 * fixa, sem tocar banco — exceto em `/blog/<slug>`, onde consulta a tabela de redirecionamentos
 * (só ali; ver `blogRedirect`). NÃO é autorização: toda página e ação de admin valida a sessão de
 * verdade no servidor (docs/03, parte 11).
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname === "/admin" || pathname.startsWith("/admin/")) return admin(request);

  const blogSlugMatch = /^\/blog\/([^/]+)$/.exec(pathname);
  if (blogSlugMatch && blogSlugMatch[1] !== "categoria") {
    const redirected = await blogRedirect(request);
    if (redirected) return redirected;
  }

  return publicSite();
}

export const config = {
  // Fora de `/api`, `/_next` (assets do Next) e arquivos estáticos com extensão.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
