/**
 * Guarda de origem para os endpoints de autenticação (defesa em profundidade contra CSRF).
 *
 * A biblioteca só valida `Origin` quando a requisição já traz cookie; um login "frio" vindo de
 * outro site passaria (login CSRF: forçar o navegador da vítima a entrar na conta do atacante).
 * Aqui toda requisição que muda estado precisa vir da origem configurada. Navegadores sempre
 * enviam `Origin` em POST entre sites; clientes que não são navegadores (sem `Origin` nem
 * `Sec-Fetch-Site`) não são alvo de CSRF e seguem permitidos.
 */
export function isTrustedOriginRequest(request: Request, baseURL: string): boolean {
  const method = request.method.toUpperCase();
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return true;

  const origin = request.headers.get("origin");
  if (origin !== null) {
    // "null" (iframe isolado, contexto opaco) e qualquer outra origem são recusados.
    return origin === new URL(baseURL).origin;
  }

  const site = request.headers.get("sec-fetch-site");
  return site === null || site === "same-origin" || site === "none";
}
