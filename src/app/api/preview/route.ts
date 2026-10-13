import { draftMode } from "next/headers";
import { redirect } from "next/navigation";
import { getPostForEditForRoute } from "@/features/content/application/post-crud";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { assertCan } from "@/server/permissions";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Ativa o Draft Mode do Next.js para ver um artigo não publicado (`?postId=<id>`). Exige sessão
 * de painel e permissão de editar AQUELE artigo. O cookie vale para o site inteiro, então a
 * página do artigo repete a checagem a cada leitura (`getPostBySlugForPreview`): ativar o preview
 * do próprio rascunho não abre o de ninguém. Para sair: `/api/preview/sair`.
 *
 * O destino é o slug real do artigo, lido do banco — o `slug` da URL é ignorado.
 */
export async function GET(request: Request) {
  const postId = new URL(request.url).searchParams.get("postId") ?? "";
  if (!UUID.test(postId)) {
    return new Response("Parâmetro inválido: postId é obrigatório.", { status: 400 });
  }

  // Fora do `try`: sem sessão, `redirect()` para o login precisa propagar.
  const { actor } = await requireAdminSession();

  let slug: string;
  try {
    const { post } = await getPostForEditForRoute(actor, postId);
    // Dono = usuário que criou o artigo (o autor exibido é outra coisa: um especialista da lista).
    assertCan(actor, "post:edit", { ownerId: post.createdBy, status: post.status });
    slug = post.slug;
  } catch (error) {
    if (error instanceof AppError) {
      return new Response(error.publicMessage, { status: error.httpStatus });
    }
    throw error;
  }

  (await draftMode()).enable();
  redirect(`/blog/${slug}`);
}
