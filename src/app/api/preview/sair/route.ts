import { draftMode } from "next/headers";
import { redirect } from "next/navigation";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Desliga o Draft Mode (apaga o cookie `__prerender_bypass`) e volta ao artigo publicado, ou ao
 * `/blog`. Não exige sessão: sair do preview nunca amplia acesso. O slug é validado para o
 * redirecionamento só apontar para dentro do site.
 */
export async function GET(request: Request) {
  (await draftMode()).disable();
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  redirect(SLUG.test(slug) ? `/blog/${slug}` : "/blog");
}
