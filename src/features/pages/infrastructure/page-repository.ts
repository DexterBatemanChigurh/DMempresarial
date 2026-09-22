import "server-only";
import { count, desc, eq } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { pages } from "@/db/schema";

/**
 * Leitura e escrita administrativas de páginas institucionais: qualquer status. Sempre atrás de
 * `requireAdminSession` + `assertCan` na camada `application` — nada aqui decide permissão.
 */
function boundedPaging(page: number, pageSize: number) {
  const safePage = Number.isInteger(page) && page >= 1 ? Math.min(page, 10_000) : 1;
  const safeSize = Number.isInteger(pageSize) && pageSize >= 1 ? Math.min(pageSize, 50) : 20;
  return { page: safePage, pageSize: safeSize, offset: (safePage - 1) * safeSize };
}

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type PageSummaryForAdmin = {
  id: string;
  key: string;
  title: string;
  template: "HOME" | "ABOUT" | "CONTACT" | "LEGAL";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  updatedAt: Date;
};

export async function listPagesForAdmin(
  executor: Executor,
  options: { page?: number } = {},
): Promise<Page<PageSummaryForAdmin>> {
  const { page, pageSize, offset } = boundedPaging(options.page ?? 1, 20);
  const [totalRow] = await executor.select({ n: count() }).from(pages);
  const rows = await executor
    .select({
      id: pages.id,
      key: pages.key,
      title: pages.title,
      template: pages.template,
      status: pages.status,
      updatedAt: pages.updatedAt,
    })
    .from(pages)
    .orderBy(desc(pages.updatedAt), desc(pages.id))
    .limit(pageSize)
    .offset(offset);
  return { items: rows, total: totalRow?.n ?? 0, page, pageSize };
}

export async function findPageForEdit(
  executor: Executor,
  id: string,
): Promise<typeof pages.$inferSelect | null> {
  const [row] = await executor.select().from(pages).where(eq(pages.id, id)).limit(1);
  return row ?? null;
}
