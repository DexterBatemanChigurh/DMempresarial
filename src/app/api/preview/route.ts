import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { assertCan } from "@/server/permissions";
import type { Actor, Action } from "@/server/permissions";

/**
 * Ativa o Draft Mode do Next.js para permitir visualização de conteúdo não publicado.
 * Requer sessão de admin válida. O Draft Mode define um cookie `__prerender_bypass`
 * que faz o Next ignorar o cache estático e renderizar a página na hora, permitindo
 * ver conteúdo DRAFT/REVIEW/SCHEDULED.
 *
 * A rota espera `?postId=<id>&slug=<slug>` como query params.
 * Após ativar o Draft Mode, redireciona para a página pública do artigo (`/blog/<slug>`).
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const slug = searchParams.get("slug");

  if (!postId || !slug) {
    return new Response("Parâmetros inválidos: postId e slug são obrigatórios", { status: 400 });
  }

  const { actor: sessionActor } = await requireAdminSession();
  const actor: Actor = sessionActor;

  const { getPostForEditForRoute } = await import("@/features/content/application/post-crud");

  const post = await getPostForEditForRoute(actor, postId);
  if (!post) {
    return new Response("Artigo não encontrado", { status: 404 });
  }

  // Verifica se o usuário tem permissão para editar este post
  const resource: { ownerId: string } = { ownerId: post.post.authorId };
  assertCan(actor, "post:edit" as Action, resource);

  // Ativa o Draft Mode
  const draft = await draftMode();
  draft.enable();

  // Redireciona para a página pública do artigo
  redirect(`/blog/${slug}`);
}
