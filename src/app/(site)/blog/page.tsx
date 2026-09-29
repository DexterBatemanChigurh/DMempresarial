import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { PostCard } from "@/components/content/post-card";
import { PostCover } from "@/components/content/post-cover";
import { BLOG_PAGE } from "@/content/dm";
import {
  listPublicPostsForRoute,
  searchPublicPostsForRoute,
} from "@/features/content/application/public-posts";
import { buildCoverResolverForRoute } from "@/features/media/application/resolve";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Blog",
  description: BLOG_PAGE.hero.description,
  path: "/blog",
});

// Lê `searchParams` (paginação e busca) — dado de requisição, mesmo padrão das rotas `[slug]`.
export const instant = false;

const PAGE_SIZE = 9;

function first(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value) ?? "";
}

function parsePage(value: string | string[] | undefined): number {
  const n = Number(first(value));
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function formatDate(date: Date | null): string {
  return (
    date?.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" }) ?? ""
  );
}

export default async function BlogIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; q?: string; categoria?: string }>;
}) {
  const params = await searchParams;
  const page = parsePage(params.pagina);
  const query = first(params.q).trim().slice(0, 100);
  const isSearch = query !== "";

  const categories = await listPublicCategoriesForRoute();
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));
  const filterCategory = categoryName.has(first(params.categoria))
    ? first(params.categoria)
    : undefined;

  const [listing, featuredPage] = await Promise.all([
    isSearch
      ? searchPublicPostsForRoute(query, {
          page,
          pageSize: PAGE_SIZE,
          categorySlug: filterCategory,
        })
      : listPublicPostsForRoute({ page, pageSize: PAGE_SIZE }),
    isSearch ? Promise.resolve(null) : listPublicPostsForRoute({ featuredOnly: true, pageSize: 4 }),
  ]);

  // Destaque principal: o escolhido no painel mais recente; sem escolha, o último publicado.
  const featured = !isSearch && page === 1 ? (featuredPage?.items[0] ?? listing.items[0]) : null;
  const latest = listing.items.filter((p) => p.slug !== featured?.slug);
  const editorial = (featuredPage?.items ?? [])
    .filter((p) => p.slug !== featured?.slug)
    .slice(0, 3);
  const totalPages = Math.max(1, Math.ceil(listing.total / listing.pageSize));

  const resolve = await buildCoverResolverForRoute(
    [featured, ...latest, ...editorial].map((p) => p?.coverMediaId ?? null),
  );

  const searchHref = (n: number, categoria = filterCategory) => {
    const qs = new URLSearchParams({ q: query });
    if (categoria) qs.set("categoria", categoria);
    if (n > 1) qs.set("pagina", String(n));
    return `/blog?${qs}`;
  };
  const pageHref = (n: number) =>
    isSearch ? searchHref(n) : n > 1 ? `/blog?pagina=${n}` : "/blog";

  return (
    <>
      {/* 1 HERO + BUSCA */}
      <Section spacing="loose">
        <Container>
          <SectionLabel>Blog</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md max-w-[22ch]">
            {BLOG_PAGE.hero.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {BLOG_PAGE.hero.description}
          </Text>
          <form
            action="/blog"
            method="get"
            role="search"
            className="mt-xl flex max-w-[40rem] flex-col gap-sm sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="q" className="font-sans text-sm font-semibold text-text">
                O que você procura?
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={query}
                maxLength={100}
                placeholder="Ex.: gestão financeira"
                className="mt-xs block min-h-11 w-full rounded-control border-[1.5px] border-border-strong bg-surface px-md font-sans text-body text-text placeholder:text-text-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              />
            </div>
            <Button type="submit">Buscar</Button>
          </form>
        </Container>
      </Section>

      {isSearch ? (
        /* 8 RESULTADOS DA BUSCA */
        <Section tone="muted" spacing="loose" aria-labelledby="resultados">
          <Container>
            <Heading as="h2" variant="h2" id="resultados">
              Resultados para &ldquo;{query}&rdquo;
            </Heading>
            <Text tone="secondary" className="mt-sm" aria-live="polite">
              {listing.total === 1 ? "1 artigo encontrado" : `${listing.total} artigos encontrados`}
              {filterCategory ? ` em ${categoryName.get(filterCategory)}` : ""}
            </Text>

            <nav aria-label="Filtrar por tema" className="mt-lg">
              <ul className="flex flex-wrap gap-xs">
                {[{ slug: "", name: "Todos os temas" }, ...categories].map((c) => {
                  const active = (c.slug || undefined) === filterCategory;
                  return (
                    <li key={c.slug || "todos"}>
                      <Link
                        href={searchHref(1, c.slug || undefined)}
                        aria-current={active ? "true" : undefined}
                        className={`inline-flex min-h-11 items-center rounded-full border px-md font-sans text-sm ${
                          active
                            ? "border-text bg-text text-surface"
                            : "border-border bg-surface text-text hover:border-link"
                        }`}
                      >
                        {c.name}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {latest.length > 0 ? (
              <ul className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
                {latest.map((post) => (
                  <li key={post.slug}>
                    <PostCard
                      post={post}
                      resolve={resolve}
                      categoryName={categoryName.get(post.primaryCategorySlug ?? "")}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2xl max-w-reading">
                <Text>Nenhum artigo encontrado.</Text>
                <Text tone="secondary" className="mt-xs">
                  Tente outra palavra, remova o filtro de tema ou navegue pelos temas abaixo.
                </Text>
              </div>
            )}
            <Pagination page={page} totalPages={totalPages} href={pageHref} />
          </Container>
        </Section>
      ) : listing.total === 0 ? (
        <Section tone="muted" spacing="loose">
          <Container>
            <Heading as="h2" variant="h2">
              Nenhum artigo publicado ainda
            </Heading>
            <Text tone="secondary" className="mt-md max-w-reading">
              Os artigos publicados pela DM aparecerão aqui assim que estiverem prontos.
            </Text>
          </Container>
        </Section>
      ) : (
        <>
          {/* 2 DESTAQUE PRINCIPAL */}
          {featured ? (
            <Section tone="muted" spacing="loose" aria-labelledby="destaque">
              <Container>
                <SectionLabel>Destaque</SectionLabel>
                <h2 id="destaque" className="sr-only">
                  Artigo em destaque
                </h2>
                <Link
                  href={`/blog/${featured.slug}`}
                  className="group mt-lg grid gap-xl md:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] md:items-center"
                >
                  <PostCover mediaId={featured.coverMediaId} resolve={resolve} />
                  <div>
                    {featured.primaryCategorySlug ? (
                      <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                        {categoryName.get(featured.primaryCategorySlug)}
                      </p>
                    ) : null}
                    <Heading
                      as="h3"
                      variant="h2"
                      className="mt-sm group-hover:text-link group-hover:underline"
                    >
                      {featured.title}
                    </Heading>
                    {featured.excerpt ? (
                      <Text tone="secondary" className="mt-md">
                        {featured.excerpt}
                      </Text>
                    ) : null}
                    <Text size="sm" tone="secondary" className="mt-md">
                      {formatDate(featured.publishedAt)} · {featured.readingMinutes} min de leitura
                    </Text>
                    <span className="mt-lg inline-flex items-center gap-xs font-sans text-sm font-semibold text-link">
                      Ler artigo <ArrowRightIcon className="size-5" />
                    </span>
                  </div>
                </Link>
              </Container>
            </Section>
          ) : null}

          {/* 3 ÚLTIMOS ARTIGOS */}
          {latest.length > 0 ? (
            <Section spacing="loose" aria-labelledby="ultimos">
              <Container>
                <Heading as="h2" variant="h2" id="ultimos">
                  {page === 1 ? "Últimos artigos" : `Artigos — página ${page}`}
                </Heading>
                <ul className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
                  {latest.map((post) => (
                    <li key={post.slug}>
                      <PostCard
                        post={post}
                        resolve={resolve}
                        categoryName={categoryName.get(post.primaryCategorySlug ?? "")}
                      />
                    </li>
                  ))}
                </ul>
                {page === 1 && totalPages > 1 ? (
                  <div className="mt-2xl text-center">
                    <Button href={pageHref(2)} variant="secondary">
                      Carregar mais
                    </Button>
                  </div>
                ) : (
                  <Pagination page={page} totalPages={totalPages} href={pageHref} />
                )}
              </Container>
            </Section>
          ) : null}
        </>
      )}

      {/* 4 EXPLORE POR TEMA */}
      {categories.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="temas">
          <Container>
            <Heading as="h2" variant="h2" id="temas">
              Explore por tema
            </Heading>
            <ul className="mt-xl flex flex-wrap gap-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/blog/categoria/${cat.slug}`}
                    className="inline-flex min-h-11 items-center gap-xs rounded-full border border-border bg-surface px-lg font-sans text-body text-text transition-colors duration-150 ease-standard hover:border-link hover:text-link"
                  >
                    {cat.name}
                    <span className="text-caption text-text-secondary">{cat.postCount}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* 5 CONTEÚDOS EM DESTAQUE (escolhidos no painel) */}
      {editorial.length > 0 ? (
        <Section spacing="loose" aria-labelledby="vale-conhecer">
          <Container>
            <Heading as="h2" variant="h2" id="vale-conhecer">
              Conteúdos que vale a pena conhecer
            </Heading>
            <ul className="mt-2xl grid gap-xl md:grid-cols-3">
              {editorial.map((post) => (
                <li key={post.slug}>
                  <PostCard
                    post={post}
                    resolve={resolve}
                    categoryName={categoryName.get(post.primaryCategorySlug ?? "")}
                  />
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* 6 NAVEGAÇÃO POR NECESSIDADE (só categorias que existem) */}
      <Section
        tone={editorial.length > 0 ? "muted" : undefined}
        spacing="loose"
        aria-labelledby="resolver"
      >
        <Container>
          <Heading as="h2" variant="h2" id="resolver">
            O que você procura resolver?
          </Heading>
          <ul className="mt-xl border-t border-border">
            {BLOG_PAGE.needs
              .filter((n) => categoryName.has(n.category))
              .map((item) => (
                <li key={item.need} className="border-b border-border">
                  <Link
                    href={`/blog/categoria/${item.category}`}
                    className="group grid min-h-11 gap-2xs py-md md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-lg"
                  >
                    <span className="font-sans text-body text-text-secondary">{item.need}</span>
                    <span className="font-serif text-h4 font-medium text-text group-hover:text-link">
                      {item.answer}
                    </span>
                    <ArrowRightIcon className="hidden size-5 text-link md:block" />
                  </Link>
                </li>
              ))}
          </ul>
        </Container>
      </Section>

      {/* 7 CTA */}
      <Section spacing="loose" aria-labelledby="blog-cta">
        <Container>
          <div className="rounded-[28px] border border-border bg-surface-muted px-lg py-2xl text-center md:px-2xl md:py-3xl">
            <Heading as="h2" variant="h2" id="blog-cta" className="mx-auto max-w-[36rem]">
              {BLOG_PAGE.cta.title}
            </Heading>
            <Text tone="secondary" className="mx-auto mt-md max-w-reading">
              {BLOG_PAGE.cta.text}
            </Text>
            <div className="mt-xl flex flex-col items-center justify-center gap-md sm:flex-row">
              <Button href="/contato">Conversar com a DM →</Button>
              <Button href="/solucoes" variant="secondary">
                Conhecer nossas soluções →
              </Button>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}

function Pagination({
  page,
  totalPages,
  href,
}: {
  page: number;
  totalPages: number;
  href: (n: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="mt-2xl flex items-center justify-center gap-lg" aria-label="Paginação">
      {page > 1 ? (
        <Link href={href(page - 1)} className="text-link underline underline-offset-4">
          Anterior
        </Link>
      ) : null}
      <Text size="sm" tone="secondary">
        Página {page} de {totalPages}
      </Text>
      {page < totalPages ? (
        <Link href={href(page + 1)} className="text-link underline underline-offset-4">
          Próxima
        </Link>
      ) : null}
    </nav>
  );
}
