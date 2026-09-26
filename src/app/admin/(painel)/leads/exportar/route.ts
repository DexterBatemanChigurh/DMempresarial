import {
  exportLeadsCsvForRoute,
  parseLeadStatus,
} from "@/features/conversion/application/conversion-admin";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

/** GET /admin/leads/exportar[?estado=NEW] — CSV dos leads (ADMIN, `lead:export`, auditado). */
export async function GET(request: Request) {
  const { actor } = await requireAdminSession();
  const status = parseLeadStatus(new URL(request.url).searchParams.get("estado") ?? undefined);
  try {
    const { csv } = await exportLeadsCsvForRoute(actor, { status });
    const day = new Date().toISOString().slice(0, 10);
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leads-${status?.toLowerCase() ?? "todos"}-${day}.csv"`,
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
