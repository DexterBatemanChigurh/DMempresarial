import type { Metadata } from "next";
import { Heading } from "@/components/ui";
import { PostForm } from "@/components/admin/posts/post-form";
import { EMPTY_DOC } from "@/lib/rich-text";
import { loadPostFormOptionsForRoute } from "@/features/content/application/post-form-options";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createPostAction } from "../actions";

export const metadata: Metadata = { title: "Novo artigo" };

export default async function NewPostPage() {
  await requireAdminSession();
  const options = await loadPostFormOptionsForRoute();

  return (
    <>
      <Heading as="h1" variant="h1">
        Novo artigo
      </Heading>
      <div className="mt-xl max-w-reading">
        <PostForm
          mode="create"
          action={createPostAction}
          options={options}
          initial={{
            slug: "",
            title: "",
            subtitle: "",
            excerpt: "",
            body: EMPTY_DOC,
            format: "",
            coverMediaId: null,
            coverUrl: null,
            coverAlt: "",
            authorId: "",
            seoTitle: "",
            seoDescription: "",
            categoryIds: [],
            primaryCategoryId: null,
            tagIds: [],
            solutionIds: [],
            primarySolutionId: null,
          }}
        />
      </div>
    </>
  );
}
