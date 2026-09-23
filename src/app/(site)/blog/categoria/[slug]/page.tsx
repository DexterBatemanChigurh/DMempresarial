import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { publicMetadata } from "@/components/site/seo";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` — mesmo padrão de `solucoes/[slug]/page.tsx`.
export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const categories = await listPublicCategoriesForRoute();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) return { title: "Categoria não encontrada" };
  return publicMetadata({
    title: `${cat.name} — Blog`,
    description: `${cat.postCount} artigos sobre ${cat.name.toLowerCase()}.`,
    path: `/blog/categoria/${cat.slug}`,
  });
}

export default async function CategoryPage({ params }: Params) {
  const { slug } = await params;
  const categories = await listPublicCategoriesForRoute();
  const cat = categories.find((c) => c.slug === slug);
  if (!cat) notFound();

  // Filtra na consulta (`categorySlug`), não em memória: senão só os 12 posts mais recentes de
  // TODO o blog seriam candidatos, e uma categoria com posts mais antigos apareceria vazia.
  const postsPage = await listPublicPostsForRoute({ pageSize: 24, categorySlug: slug });
  const posts = postsPage.items;

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Categoria</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            {cat.name}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {cat.postCount} {cat.postCount === 1 ? "artigo" : "artigos"} sobre
            {cat.name.toLowerCase()}.
          </Text>
        </Container>
      </Section>

      {posts.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="artigos">
          <Container>
            <SectionLabel>Artigos</SectionLabel>
            <Heading as="h2" variant="h2" id="artigos" className="mt-md">
              Artigos desta categoria
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug} className="border-t border-border pt-lg">
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                  >
                    <Text size="metadata" tone="secondary">
                      {post.authorName} · {post.readingMinutes} min
                    </Text>
                    <Heading
                      as="h3"
                      variant="h3"
                      className="mt-xs text-link group-hover:underline group-focus-visible:underline"
                    >
                      {post.title}
                    </Heading>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : (
        <Section tone="muted" spacing="loose">
          <Container>
            <SectionLabel>Artigos</SectionLabel>
            <Heading as="h2" variant="h2" className="mt-md">
              Nenhum artigo nesta categoria
            </Heading>
            <Text tone="secondary" className="mt-lg max-w-reading">
              Ainda não há artigos publicados em <strong>{cat.name}</strong>.
            </Text>
            <Text as="span" size="sm" className="mt-md inline-block text-link">
              <Link href="/blog">Ver todas as categorias</Link>
            </Text>
          </Container>
        </Section>
      )}

      <Section spacing="loose" aria-labelledby="todas-categorias">
        <Container>
          <SectionLabel>Categorias</SectionLabel>
          <Heading as="h2" variant="h2" id="todas-categorias" className="mt-md">
            Navegue por tema
          </Heading>
          <ul className="mt-xl grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {categories.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/blog/categoria/${c.slug}`}
                  className="group block p-lg bg-surface border border-border rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                >
                  <Heading
                    as="h3"
                    variant="h4"
                    className="text-link group-hover:underline group-focus-visible:underline"
                  >
                    {c.name}
                  </Heading>
                  <Text size="sm" tone="secondary" className="mt-xs">
                    {c.postCount} {c.postCount === 1 ? "artigo" : "artigos"}
                  </Text>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
