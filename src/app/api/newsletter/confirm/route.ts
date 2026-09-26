import { redirect } from "next/navigation";

/**
 * GET /api/newsletter/confirm?token=<token> — endereço antigo do link de confirmação. Só
 * redireciona para a página que pede o clique: um GET nunca confirma (pré-visualizadores e
 * antivírus de e-mail "abrem" links sozinhos).
 */
export function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) redirect("/newsletter/confirmacao?status=invalido");
  redirect(`/newsletter/confirmacao?token=${encodeURIComponent(token)}`);
}
