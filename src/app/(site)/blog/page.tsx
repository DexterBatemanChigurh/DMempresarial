import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Container, Heading, Section, SectionLabel, Text, TextField } from "@/components/ui";
import {
  listPublicPostsForRoute,
  searchPublicPostsForRoute,
} from "@/features/content/application/public-posts";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { publicMetadata } from "@/components/site/seo";
import { NewsletterSignup } from "@/app/(site)/newsletter/newsletter-signup";

export const metadata: Metadata = publicMetadata({
  title: "Blog",
  description: "Conhecimento para quem toma decisões.",
  path: "/blog",
});

// Lê `searchParams` (paginação) — dado de requisição, mesmo padrão das rotas `[slug]`.
export const instant = false;

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.pagina);
  const query = (params.q ?? "").trim();
  const isSearch = query !== "";

  const [postsPage, categories] = await Promise.all([
    isSearch
      ? searchPublicPostsForRoute(query, { page, pageSize: 12 })
      : listPublicPostsForRoute({ page, pageSize: 12 }),
    listPublicCategoriesForRoute(),
  ]);

  const posts = postsPage.items;
  const hasPosts = posts.length > 0;
  // Destaque só faz sentido na primeira página do índice normal — busca é sempre lista simples.
  const featured = !isSearch && page === 1 ? posts[0] : undefined;
  const secondary = !isSearch && page === 1 ? posts.slice(1) : posts;
  const totalPages = Math.max(1, Math.ceil(postsPage.total / postsPage.pageSize));
  const pageHref = (n: number) =>
    isSearch ? `/blog?q=${encodeURIComponent(query)}&pagina=${n}` : `/blog?pagina=${n}`;

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Blog</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            Conhecimento para quem toma decisões
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            Análises, leituras de mercado, conceitos aplicados e casos reais. Escrito por quem vive
            o dia a dia da consultoria.
          </Text>
          <form action="/blog" method="get" role="search" className="mt-xl max-w-reading">
            <TextField
              id="q"
              label="Buscar no blog"
              defaultValue={query}
              placeholder="Ex.: gestão de caixa"
            />
          </form>
        </Container>
      </Section>

      {hasPosts ? (
        <>
          <Section tone="muted" spacing="loose" aria-labelledby="destaque">
            <Container>
              {featured ? (
                <>
                  <SectionLabel>Destaque</SectionLabel>
                  <Heading as="h2" variant="h2" id="destaque" className="mt-md">
                    Artigo em destaque
                  </Heading>

                  <article className="mt-xl">
                    <Link
                      href={`/blog/${featured.slug}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                    >
                      <Text size="metadata" tone="secondary">
                        {featured.authorName} ·{" "}
                        {featured.publishedAt?.toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}{" "}
                        · {featured.readingMinutes} min
                      </Text>
                      <Heading
                        as="h3"
                        variant="h2"
                        className="mt-sm text-link group-hover:underline group-focus-visible:underline"
                      >
                        {featured.title}
                      </Heading>
                      {featured.excerpt ? (
                        <Text tone="secondary" className="mt-sm max-w-reading">
                          {featured.excerpt}
                        </Text>
                      ) : null}
                      <Text as="span" size="sm" className="mt-md inline-block text-link">
                        Ler artigo →
                      </Text>
                    </Link>
                  </article>
                </>
              ) : (
                <>
                  <SectionLabel>{isSearch ? "Busca" : "Blog"}</SectionLabel>
                  <Heading as="h2" variant="h2" id="destaque" className="mt-md">
                    {isSearch ? `Resultados para "${query}"` : "Artigos"}
                  </Heading>
                </>
              )}

              {secondary.length > 0 ? (
                <section className="mt-3xl" aria-labelledby="secundarios">
                  {!isSearch ? (
                    <>
                      <SectionLabel>Outros artigos</SectionLabel>
                      <Heading as="h2" variant="h2" id="secundarios" className="mt-md">
                        Artigos secundários
                      </Heading>
                    </>
                  ) : (
                    <Heading as="h2" variant="h2" id="secundarios" className="sr-only">
                      Resultados da busca
                    </Heading>
                  )}
                  <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
                    {secondary.map((post) => (
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
                </section>
              ) : null}

              {totalPages > 1 ? (
                <nav
                  className="mt-3xl flex items-center justify-center gap-md"
                  aria-label="Paginação"
                >
                  {page > 1 ? (
                    <Link
                      href={pageHref(page - 1)}
                      className="text-link underline underline-offset-4"
                    >
                      Anterior
                    </Link>
                  ) : null}
                  <Text size="sm" tone="secondary">
                    Página {page} de {totalPages}
                  </Text>
                  {page < totalPages ? (
                    <Link
                      href={pageHref(page + 1)}
                      className="text-link underline underline-offset-4"
                    >
                      Próxima
                    </Link>
                  ) : null}
                </nav>
              ) : null}
            </Container>
          </Section>
        </>
      ) : (
        <Section tone="muted" spacing="loose">
          <Container>
            <SectionLabel>{isSearch ? "Busca" : "Blog"}</SectionLabel>
            <Heading as="h2" variant="h2" className="mt-md">
              {isSearch ? `Nada encontrado para "${query}"` : "Nenhum artigo publicado ainda"}
            </Heading>
            <Text tone="secondary" className="mt-lg max-w-reading">
              {isSearch
                ? "Tente outra palavra ou navegue pelas categorias abaixo."
                : "Os artigos publicados pela DM aparecerão aqui assim que estiverem prontos."}
            </Text>
          </Container>
        </Section>
      )}

      <Section spacing="loose" aria-labelledby="categorias">
        <Container>
          <SectionLabel>Categorias</SectionLabel>
          <Heading as="h2" variant="h2" id="categorias" className="mt-md">
            Navegue por tema
          </Heading>

          {categories.length > 0 ? (
            <ul className="mt-xl grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/blog/categoria/${cat.slug}`}
                    className="group block p-lg bg-surface border border-border rounded-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link"
                  >
                    <Heading
                      as="h3"
                      variant="h4"
                      className="text-link group-hover:underline group-focus-visible:underline"
                    >
                      {cat.name}
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-xs">
                      {cat.postCount} {cat.postCount === 1 ? "artigo" : "artigos"}
                    </Text>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Text tone="secondary" className="mt-lg">
              Nenhuma categoria criada ainda.
            </Text>
          )}
        </Container>
      </Section>

      <Section tone="muted" spacing="loose">
        <Container>
          <Suspense fallback={null}>
            <NewsletterSignup source="blog" />
          </Suspense>
        </Container>
      </Section>
    </>
  );
}
