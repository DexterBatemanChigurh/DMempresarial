import { exportActiveSubscribersCsvForRoute } from "@/features/conversion/application/conversion-admin";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

/** GET /admin/newsletter/exportar — CSV dos assinantes ATIVOS (confirmados), auditado. */
export async function GET() {
  const { actor } = await requireAdminSession();
  try {
    const { csv } = await exportActiveSubscribersCsvForRoute(actor);
    const day = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="newsletter-ativos-${day}.csv"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return new Response(error.publicMessage, { status: error.httpStatus });
    }
    throw error;
  }
}
