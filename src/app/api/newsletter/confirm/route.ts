import { redirect } from "next/navigation";
import { confirmNewsletterForRoute } from "@/features/conversion/application/newsletter";

/**
 * GET /api/newsletter/confirm?token=<token>
 * Confirma a inscrição na newsletter via double-opt-in.
 * Se válido, redireciona para página de sucesso.
 * Se inválido/expirado, redireciona para página de erro.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    redirect("/newsletter/confirmacao?status=invalido");
  }

  try {
    await confirmNewsletterForRoute(token);
    redirect("/newsletter/confirmacao?status=sucesso");
  } catch (error) {
    if (error instanceof Error && error.name === "AppError") {
      const code = (error as { code?: string }).code;
      if (code === "NOT_FOUND" || code === "VALIDATION" || code === "DOMAIN_RULE") {
        redirect("/newsletter/confirmacao?status=erro");
      }
    }
    // Erro inesperado: não vaza detalhes
    redirect("/newsletter/confirmacao?status=erro");
  }
}
