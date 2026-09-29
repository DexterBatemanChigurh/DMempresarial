import Link from "next/link";
import { Heading } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import type { MediaResolver } from "@/lib/rich-text";
import { PostCover } from "./post-cover";

type CardPost = {
  slug: string;
  title: string;
  readingMinutes: number;
  coverMediaId: string | null;
  primaryCategorySlug: string | null;
};

/**
 * Cartão de artigo das listagens do blog: imagem, categoria, título, leitura e "Ler artigo".
 * Sem autor em destaque, badges ou sombras: o conteúdo é o protagonista.
 */
export function PostCard({
  post,
  resolve,
  categoryName,
}: {
  post: CardPost;
  resolve: MediaResolver;
  categoryName?: string;
}) {
  return (
    <Link href={`/blog/${post.slug}`} className="group block">
      <PostCover mediaId={post.coverMediaId} resolve={resolve} />
      {categoryName ? (
        <p className="mt-md font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
          {categoryName}
        </p>
      ) : null}
      <Heading as="h3" variant="h4" className="mt-xs group-hover:text-link group-hover:underline">
        {post.title}
      </Heading>
      <p className="mt-sm flex items-center justify-between gap-md font-sans text-caption text-text-secondary">
        <span>{post.readingMinutes} min de leitura</span>
        <span className="inline-flex items-center gap-2xs font-semibold text-link">
          Ler artigo <ArrowRightIcon className="size-4" />
        </span>
      </p>
    </Link>
  );
}
