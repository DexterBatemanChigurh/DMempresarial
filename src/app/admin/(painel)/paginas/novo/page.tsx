import type { Metadata } from "next";
import { Heading } from "@/components/ui";
import { PageForm } from "@/components/admin/pages/page-form";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createPageAction } from "../actions";

export const metadata: Metadata = { title: "Nova página" };

export default async function NewPagePage() {
  await requireAdminSession();

  return (
    <>
      <Heading as="h1" variant="h1">
        Nova página
      </Heading>
      <div className="mt-xl max-w-reading">
        <PageForm
          mode="create"
          action={createPageAction}
          initial={{
            key: "",
            template: "HOME",
            title: "",
            data: {},
            seoTitle: "",
            seoDescription: "",
          }}
        />
      </div>
    </>
  );
}
