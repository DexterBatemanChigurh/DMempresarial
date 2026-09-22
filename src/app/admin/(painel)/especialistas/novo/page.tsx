import type { Metadata } from "next";
import { Heading } from "@/components/ui";
import { SpecialistForm } from "@/components/admin/specialists/specialist-form";
import { EMPTY_DOC } from "@/lib/rich-text";
import { loadSpecialistFormOptionsForRoute } from "@/features/people/application/specialist-form-options";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createSpecialistAction } from "../actions";

export const metadata: Metadata = { title: "Novo especialista" };

export default async function NewSpecialistPage() {
  await requireAdminSession();
  const options = await loadSpecialistFormOptionsForRoute();

  return (
    <>
      <Heading as="h1" variant="h1">
        Novo especialista
      </Heading>
      <div className="mt-xl max-w-reading">
        <SpecialistForm
          mode="create"
          action={createSpecialistAction}
          options={options}
          initial={{
            slug: "",
            name: "",
            roleTitle: "",
            summary: "",
            bio: EMPTY_DOC,
            photoMediaId: null,
            photoUrl: null,
            photoAlt: "",
            kind: "TEAM",
            seoTitle: "",
            seoDescription: "",
            solutionIds: [],
            categoryIds: [],
          }}
        />
      </div>
    </>
  );
}
