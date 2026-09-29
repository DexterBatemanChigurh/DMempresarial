import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import {
  getPublicPostBySlugForRoute,
  getPostBySlugForPreviewRoute,
  listPublicPostsForRoute,
} from "@/features/content/application/public-posts";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { PostCard } from "@/components/content/post-card";
import { ArrowRightIcon } from "@/components/ui/icons";
import { CATEGORY_SOLUTION, findSpecialist } from "@/content/dm";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { buildPublicMediaResolverForRoute } from "@/features/media/application/resolve";
import { extractMediaIds } from "@/lib/rich-text";
import type { RichDoc } from "@/lib/rich-text";
import { env } from "@/server/env";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` (dado de requisição). Conteúdo cacheado por `use cache`/
// `cacheTag` nas leituras públicas; `instant = false` desativa a validação de static shell
// (mesmo padrão de `solucoes/[slug]/page.tsx`).
export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const isDraft = (await draftMode()).isEnabled;
  const post = isDraft
    ? await getPostBySlugForPreviewRoute(slug)
    : await getPublicPostBySlugForRoute(slug);
  if (!post) return { title: "Artigo não encontrado" };
  return publicMetadata({
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    path: `/blog/${post.slug}`,
    type: "article",
  });
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const isDraft = (await draftMode()).isEnabled;
  const post = isDraft
    ? await getPostBySlugForPreviewRoute(slug)
    : await getPublicPostBySlugForRoute(slug);
  // Slug trocado (docs/03 §20): o redirecionamento de verdade (301, com Location de HTTP) é
  // resolvido no Proxy (src/proxy.ts), antes desta página renderizar — um `permanentRedirect()`
  // daqui, que depende de dado de banco, cai no trecho adiado do PPR e vira só uma navegação por
  // JS no cliente (comportamento documentado do Next para redirect em "streaming context"), não
  // um 301 de verdade. Se chegou até aqui sem o Proxy ter redirecionado, é 404 mesmo.
  if (!post) notFound();

  // Relacionados: mesma categoria primária (docs/01 §17 propõe solução→categoria→tag; a consulta
  // pública hoje só expõe categoria primária, então é o critério disponível — ver HANDOFF).
  const relatedPosts = post.primaryCategorySlug
    ? (
        await listPublicPostsForRoute({ pageSize: 4, categorySlug: post.primaryCategorySlug })
      ).items.filter((p) => p.slug !== slug)
    : [];

  // Capa + imagens do corpo resolvidas numa só consulta. Sem isso, <RichText> não mostra imagem.
  const coverDoc: RichDoc = {
    type: "doc",
    content: post.coverMediaId ? [{ type: "image", attrs: { mediaId: post.coverMediaId } }] : [],
  };
  const categories = await listPublicCategoriesForRoute();
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
  const related = relatedPosts.slice(0, 3);
  const resolveMedia = await buildPublicMediaResolverForRoute([
    post.coverMediaId,
    ...extractMediaIds(post.body as RichDoc),
    ...related.map((p) => p.coverMediaId),
  ]);
  const author = findSpecialist(post.authorSlug);
  const solution = post.primaryCategorySlug
    ? CATEGORY_SOLUTION[post.primaryCategorySlug]
    : undefined;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          datePublished: post.publishedAt?.toISOString() ?? "",
          dateModified: post.updatedAt.toISOString(),
          author: { "@type": "Person", name: post.authorName },
          url: `${env().SITE_URL}/blog/${post.slug}`,
        }}
      />

      <Section spacing="loose">
        <Container>
          <nav
            aria-label="Trilha"
            className="flex flex-wrap items-center gap-xs font-sans text-label font-semibold tracking-[0.08em] uppercase"
          >
            <Link href="/blog" className="text-text-secondary hover:text-link">
              Blog
            </Link>
            {post.primaryCategorySlug ? (
              <>
                <span aria-hidden="true" className="text-text-secondary">
                  /
                </span>
                <Link
                  href={`/blog/categoria/${post.primaryCategorySlug}`}
                  className="text-link hover:underline"
                >
                  {categoryName.get(post.primaryCategorySlug) ?? post.primaryCategorySlug}
                </Link>
              </>
            ) : null}
          </nav>

          <Heading as="h1" variant="display-l" className="mt-md">
            {post.title}
          </Heading>

          {post.subtitle || post.excerpt ? (
            <Text size="lg" tone="secondary" className="mt-md max-w-reading">
              {post.subtitle || post.excerpt}
            </Text>
          ) : null}

          <div className="mt-lg font-sans text-body-sm">
            {author ? (
              <Link
                href={`/sobre/especialistas/${author.slug}`}
                className="font-semibold text-text hover:text-link"
              >
                {author.name}
              </Link>
            ) : (
              <span className="font-semibold text-text">{post.authorName}</span>
            )}
            <p className="mt-2xs text-text-secondary">
              {post.publishedAt?.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}{" "}
              · {post.readingMinutes} min de leitura
            </p>
          </div>

          {post.coverMediaId ? (
            <div className="mt-xl">
              <RichText value={coverDoc} resolveMedia={resolveMedia} />
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="muted" spacing="loose" aria-labelledby="conteudo">
        <Container>
          <SectionLabel>Artigo</SectionLabel>
          <div className="mt-lg max-w-reading">
            <RichText value={post.body} resolveMedia={resolveMedia} />
          </div>
        </Container>
      </Section>

      {related.length > 0 ? (
        <Section spacing="loose" aria-labelledby="relacionados">
          <Container>
            <SectionLabel>Relacionados</SectionLabel>
            <Heading as="h2" variant="h2" id="relacionados" className="mt-md">
              Continue lendo
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <PostCard
                    post={p}
                    resolve={resolveMedia}
                    categoryName={categoryName.get(p.primaryCategorySlug ?? "")}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {solution ? (
        <Section tone="muted" spacing="loose" aria-labelledby="solucao-relacionada">
          <Container>
            <Heading as="h2" variant="h3" id="solucao-relacionada">
              Sua empresa está passando por uma situação semelhante?
            </Heading>
            <Link
              href={solution.href}
              className="mt-md inline-flex min-h-11 items-center gap-xs font-sans text-body font-semibold text-link hover:underline"
            >
              {solution.label} <ArrowRightIcon className="size-5" />
            </Link>
          </Container>
        </Section>
      ) : null}

      <Section spacing="loose" aria-labelledby="cta-artigo">
        <Container>
          <Heading as="h2" variant="h2" id="cta-artigo">
            Quer conversar sobre isso?
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Conte o contexto da sua empresa e a DM explica como pode ajudar.
          </Text>
          <div className="mt-xl">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
