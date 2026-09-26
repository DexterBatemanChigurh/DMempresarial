import { redirect } from "next/navigation";
import { unsubscribeNewsletterForRoute } from "@/features/conversion/application/newsletter";

/**
 * GET /api/newsletter/unsubscribe?token=<token> — leva à página de descadastro, que pede o
 * clique (um GET nunca muda estado).
 */
export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) redirect("/newsletter/descadastro?status=invalido");
  redirect(`/newsletter/descadastro?token=${encodeURIComponent(token)}`);
}

/**
 * POST /api/newsletter/unsubscribe?token=<token> — descadastro de um clique (RFC 8058,
 * cabeçalhos `List-Unsubscribe` + `List-Unsubscribe-Post`), feito pelo próprio cliente de e-mail.
 * Resposta sem corpo: quem chama é o provedor, não uma pessoa.
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) return new Response(null, { status: 400 });
  try {
    await unsubscribeNewsletterForRoute(token);
    return new Response(null, { status: 204 });
  } catch {
    // Token inválido ou inscrição já cancelada: o resultado não revela qual dos dois.
    return new Response(null, { status: 400 });
  }
}
