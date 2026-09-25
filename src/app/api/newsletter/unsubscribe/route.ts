import { redirect } from "next/navigation";
import { unsubscribeNewsletterForRoute } from "@/features/conversion/application/newsletter";

/**
 * GET /api/newsletter/unsubscribe?token=<token>
 * Descadastra o e-mail da newsletter via token assinado.
 * Token vem no link do rodapé do e-mail (List-Unsubscribe).
 * Se válido, redireciona para página de sucesso.
 * Se inválido, redireciona para página de erro.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/newsletter/descadastro?status=invalido");
  }

  try {
    await unsubscribeNewsletterForRoute(token);
    redirect("/newsletter/descadastro?status=sucesso");
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      const code = (error as { code?: string }).code;
      if (code === "NOT_FOUND" || code === "VALIDATION" || code === "DOMAIN_RULE") {
        redirect("/newsletter/descadastro?status=erro");
      }
    }
    redirect("/newsletter/descadastro?status=erro");
  }
}
