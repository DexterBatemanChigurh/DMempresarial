import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import {
  getPublicPostBySlugForRoute,
  listPublicPostsForRoute,
} from "@/features/content/application/public-posts";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` (dado de requisição). Conteúdo cacheado por `use cache`/
// `cacheTag` nas leituras públicas; `instant = false` desativa a validação de static shell
// (mesmo padrão de `solucoes/[slug]/page.tsx`).
export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPublicPostBySlugForRoute(slug);
  if (!post) return { title: "Artigo não encontrado" };
  return {
    title: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
  };
}

export default async function BlogPostPage({ params }: Params) {
  const { slug } = await params;
  const post = await getPublicPostBySlugForRoute(slug);
  if (!post) notFound();

  // Relacionados: mesma categoria primária (docs/01 §17 propõe solução→categoria→tag; a consulta
  // pública hoje só expõe categoria primária, então é o critério disponível — ver HANDOFF).
  const relatedPosts = post.primaryCategorySlug
    ? (
        await listPublicPostsForRoute({ pageSize: 4, categorySlug: post.primaryCategorySlug })
      ).items.filter((p) => p.slug !== slug)
    : [];

  return (
    <>
      <Section spacing="loose">
        <Container>
          {post.primaryCategorySlug ? (
            <Link
              href={`/blog/categoria/${post.primaryCategorySlug}`}
              className="group inline-flex items-center gap-xs text-link group-hover:underline group-focus-visible:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
            >
              <Text size="metadata" tone="secondary">
                {post.primaryCategorySlug}
              </Text>
            </Link>
          ) : null}

          <Heading as="h1" variant="display-l" className="mt-md">
            {post.title}
          </Heading>

          {post.subtitle ? (
            <Text size="lg" tone="secondary" className="mt-md max-w-reading">
              {post.subtitle}
            </Text>
          ) : null}

          <div className="mt-lg flex flex-wrap items-center gap-md text-text-secondary">
            <Text size="metadata">{post.authorName}</Text>
            <Text size="metadata">·</Text>
            <Text size="metadata">
              {post.publishedAt.toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </Text>
            <Text size="metadata">·</Text>
            <Text size="metadata">{post.readingMinutes} min</Text>
          </div>

          {post.coverMediaId ? (
            <div className="mt-xl">
              <RichText
                value={{
                  type: "doc",
                  content: [
                    {
                      type: "image",
                      attrs: { mediaId: post.coverMediaId, caption: null },
                    },
                  ],
                }}
              />
            </div>
          ) : null}
        </Container>
      </Section>

      <Section tone="muted" spacing="loose" aria-labelledby="conteudo">
        <Container>
          <SectionLabel>Artigo</SectionLabel>
          <div className="mt-lg max-w-reading">
            <RichText value={post.body} />
          </div>
        </Container>
      </Section>

      {relatedPosts.length > 0 ? (
        <Section spacing="loose" aria-labelledby="relacionados">
          <Container>
            <SectionLabel>Relacionados</SectionLabel>
            <Heading as="h2" variant="h2" id="relacionados" className="mt-md">
              Continue lendo
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((p) => (
                <li key={p.slug} className="border-t border-border pt-lg">
                  <Link
                    href={`/blog/${p.slug}`}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                  >
                    <Text size="metadata" tone="secondary">
                      {p.authorName} · {p.readingMinutes} min
                    </Text>
                    <Heading
                      as="h3"
                      variant="h3"
                      className="mt-xs text-link group-hover:underline group-focus-visible:underline"
                    >
                      {p.title}
                    </Heading>
                  </Link>
                </li>
              ))}
            </ul>
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
