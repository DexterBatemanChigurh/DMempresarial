import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FormMessage, Heading } from "@/components/ui";
import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";
import { TestimonialStatusPanel } from "@/components/admin/testimonials/testimonial-status-panel";
import { getTestimonialForEditForRoute } from "@/features/proof/application/testimonial-crud";
import { testimonialTransitionsFrom } from "@/features/proof/domain/proof";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updateTestimonialAction } from "../actions";

export const metadata: Metadata = { title: "Editar depoimento" };

export default async function EditTestimonialPage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let t;
  try {
    t = await getTestimonialForEditForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Editar depoimento
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <Heading as="h1" variant="h1">
        {t.authorName}
      </Heading>
      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <TestimonialForm
            key={t.version}
            mode="edit"
            action={updateTestimonialAction}
            testimonialId={t.id}
            version={t.version}
            initial={{
              authorName: t.authorName,
              authorDetail: t.authorDetail ?? "",
              quote: t.quote,
              rating: t.rating ? String(t.rating) : "",
              source: t.source,
              givenAt: t.givenAt ? t.givenAt.toISOString().slice(0, 10) : "",
              position: String(t.position),
            }}
          />
        </div>
        <div>
          <TestimonialStatusPanel
            testimonialId={t.id}
            status={t.status}
            version={t.version}
            targets={testimonialTransitionsFrom(t.status)}
          />
        </div>
      </div>
    </>
  );
}
