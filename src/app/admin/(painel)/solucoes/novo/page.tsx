import type { Metadata } from "next";
import { Heading } from "@/components/ui";
import { SolutionForm } from "@/components/admin/solutions/solution-form";
import { EMPTY_DOC } from "@/lib/rich-text";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createSolutionAction } from "../actions";

export const metadata: Metadata = { title: "Nova solução" };

export default async function NewSolutionPage() {
  await requireAdminSession();

  return (
    <>
      <Heading as="h1" variant="h1">
        Nova solução
      </Heading>
      <div className="mt-xl max-w-reading">
        <SolutionForm
          mode="create"
          action={createSolutionAction}
          initial={{
            slug: "",
            type: "CONSULTORIA",
            title: "",
            summary: "",
            context: EMPTY_DOC,
            approach: EMPTY_DOC,
            isFeatured: false,
            seoTitle: "",
            seoDescription: "",
            situations: [],
            steps: [],
            goals: [],
          }}
        />
      </div>
    </>
  );
}
