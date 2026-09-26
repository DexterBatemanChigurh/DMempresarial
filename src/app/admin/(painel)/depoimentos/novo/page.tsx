import type { Metadata } from "next";
import { Heading } from "@/components/ui";
import { TestimonialForm } from "@/components/admin/testimonials/testimonial-form";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createTestimonialAction } from "../actions";

export const metadata: Metadata = { title: "Novo depoimento" };

export default async function NewTestimonialPage() {
  await requireAdminSession();
  return (
    <>
      <Heading as="h1" variant="h1">
        Novo depoimento
      </Heading>
      <div className="mt-xl max-w-reading">
        <TestimonialForm
          mode="create"
          action={createTestimonialAction}
          initial={{
            authorName: "",
            authorDetail: "",
            quote: "",
            rating: "",
            source: "MANUAL",
            givenAt: "",
            position: "0",
          }}
        />
      </div>
    </>
  );
}
