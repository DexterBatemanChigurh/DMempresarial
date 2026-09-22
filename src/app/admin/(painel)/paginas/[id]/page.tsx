import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading, FormMessage } from "@/components/ui";
import { PageForm } from "@/components/admin/pages/page-form";
import { PageStatusPanel } from "@/components/admin/pages/page-status-panel";
import { getPageForEditForRoute } from "@/features/pages/application/page-crud";
import {
  availablePageTransitions,
  type PageStatus,
} from "@/features/pages/application/page-service";
import type { PageTemplate } from "@/features/pages/domain/page-schemas";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updatePageAction } from "../actions";

export const metadata: Metadata = { title: "Editar página" };

export default async function EditPagePage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let page;
  try {
    page = await getPageForEditForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Editar página
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  const status = page.status as PageStatus;
  const targets = availablePageTransitions(actor, status, page.key);
  const canDelete = can(actor, "page:manage") && status === "DRAFT" && page.publishedAt === null;

  return (
    <>
      <Heading as="h1" variant="h1">
        {page.title}
      </Heading>

      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <PageForm
            key={page.version}
            mode="edit"
            action={updatePageAction}
            pageId={page.id}
            version={page.version}
            initial={{
              template: page.template as PageTemplate,
              title: page.title,
              data: (page.data ?? {}) as Record<string, unknown>,
              seoTitle: page.seoTitle ?? "",
              seoDescription: page.seoDescription ?? "",
            }}
          />
        </div>
        <div>
          <PageStatusPanel
            pageId={page.id}
            status={status}
            version={page.version}
            targets={targets}
            canDelete={canDelete}
          />
        </div>
      </div>
    </>
  );
}
