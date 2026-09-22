import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Heading, FormMessage } from "@/components/ui";
import { PostForm } from "@/components/admin/posts/post-form";
import { PostStatusPanel } from "@/components/admin/posts/post-status-panel";
import {
  getPostCoverForRoute,
  getPostForEditForRoute,
} from "@/features/content/application/post-crud";
import { loadPostFormOptionsForRoute } from "@/features/content/application/post-form-options";
import { availableTransitions } from "@/features/content/application/post-service";
import { POST_STATUSES, type PostStatus } from "@/features/content/domain/post-status";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { updatePostAction } from "../actions";

export const metadata: Metadata = { title: "Editar artigo" };

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let found;
  try {
    found = await getPostForEditForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Editar artigo
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  const { post, categoryIds, primaryCategoryId, tagIds, solutionIds, primarySolutionId } = found;
  const [options, cover] = await Promise.all([
    loadPostFormOptionsForRoute(),
    post.coverMediaId ? getPostCoverForRoute(post.coverMediaId) : Promise.resolve(null),
  ]);

  const status = post.status as PostStatus;
  const resource = { ownerId: post.createdBy, hasBeenPublished: post.firstPublishedAt !== null };
  const targets = availableTransitions(actor, status, resource, POST_STATUSES);
  const canDelete = can(actor, "post:delete-draft", { ...resource, status });
  const canChangeSlug = can(actor, "post:edit", { ...resource, status });

  return (
    <>
      <Heading as="h1" variant="h1">
        {post.title}
      </Heading>

      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <PostForm
            key={post.version}
            mode="edit"
            action={updatePostAction}
            options={options}
            postId={post.id}
            version={post.version}
            initial={{
              title: post.title,
              subtitle: post.subtitle ?? "",
              excerpt: post.excerpt ?? "",
              body: post.body,
              format: post.format ?? "",
              coverMediaId: post.coverMediaId,
              coverUrl: cover?.url ?? null,
              coverAlt: cover?.alt ?? "",
              authorId: post.authorId,
              seoTitle: post.seoTitle ?? "",
              seoDescription: post.seoDescription ?? "",
              categoryIds,
              primaryCategoryId,
              tagIds,
              solutionIds,
              primarySolutionId,
            }}
          />
        </div>
        <div>
          <PostStatusPanel
            postId={post.id}
            status={status}
            version={post.version}
            slug={post.slug}
            scheduledFor={post.scheduledFor ? post.scheduledFor.toISOString().slice(0, 16) : null}
            targets={targets}
            canDelete={canDelete}
            canChangeSlug={canChangeSlug}
          />
        </div>
      </div>
    </>
  );
}
