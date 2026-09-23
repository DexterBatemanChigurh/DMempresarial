import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { listPublicSolutionsForRoute } from "@/features/catalog/application/public-solutions";
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { homeDataSchema } from "@/features/pages/domain/page-schemas";
import { listPublicSpecialistsForRoute } from "@/features/people/application/public-specialists";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { env } from "@/server/env";

export const metadata: Metadata = publicMetadata({
  title: "DM Empresarial — Consultoria empresarial em Frutal/MG",
  description:
    "Consultoria empresarial em Frutal/MG. Método, acompanhamento e gente de verdade por trás de cada decisão.",
  path: "/",
});

function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export default async function HomePage() {
  const [homePage, solutions, specialists, postsPage] = await Promise.all([
    getPublishedPageForRoute("home"),
    listPublicSolutionsForRoute(),
    listPublicSpecialistsForRoute(),
    listPublicPostsForRoute({ pageSize: 4 }),
  ]);

  const parsed = homePage ? homeDataSchema.safeParse(homePage.data) : null;
  const homeData = parsed?.success ? parsed.data : null;
  const featured = solutions.find((s) => s.isFeatured);
  const rest = solutions.filter((s) => !s.isFeatured);
  const posts = postsPage.items;
  const [firstPost, ...morePosts] = posts;

  const headline = homeData?.headline ?? "DM Empresarial";
  const description = homeData?.description ?? null;
  const howWeThink = homeData?.howWeThink ?? null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "DM Empresarial",
          url: env().SITE_URL,
        }}
      />

      {/* 1 HERO */}
      <Section spacing="loose">
        <Container>
          <Text size="metadata" tone="secondary">
            DM Empresarial · Consultoria empresarial · Frutal/MG
          </Text>
          <Heading as="h1" variant="display-xl" className="mt-md">
            {headline}
          </Heading>
          {description ? (
            <div className="mt-lg max-w-reading">
              <RichText value={description} />
            </div>
          ) : (
            <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
              Consultoria empresarial em Frutal/MG.
            </Text>
          )}
          <div className="mt-xl flex flex-wrap gap-md">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
            <Button href="/solucoes" variant="secondary" size="lg">
              Conheça nossas soluções
            </Button>
          </div>
        </Container>
      </Section>

      {/* 3 SOLUÇÕES — a seção 2 (Reconhecimento) não existe no schema e é pulada. */}
      {solutions.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="home-solucoes">
          <Container>
            <SectionLabel>Soluções</SectionLabel>
            <Heading as="h2" variant="h2" id="home-solucoes" className="mt-md">
              O que fazemos
            </Heading>

            {featured ? (
              <Link
                href={`/solucoes/${featured.slug}`}
                className="group mt-xl block border-t-2 border-border-strong pt-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
              >
                <Text size="metadata" tone="secondary">
                  Destaque
                </Text>
                <Heading
                  as="h3"
                  variant="h2"
                  className="mt-sm text-link group-hover:underline group-focus-visible:underline"
                >
                  {featured.title}
                </Heading>
                <Text tone="secondary" className="mt-sm max-w-reading">
                  {featured.summary}
                </Text>
              </Link>
            ) : null}

            {rest.length > 0 ? (
              <ul className="mt-2xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
                {rest.map((item) => (
                  <li key={item.slug} className="border-t border-border pt-lg">
                    <Link
                      href={`/solucoes/${item.slug}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                    >
                      <Heading
                        as="h3"
                        variant="h3"
                        className="text-link group-hover:underline group-focus-visible:underline"
                      >
                        {item.title}
                      </Heading>
                      <Text tone="secondary" className="mt-sm">
                        {item.summary}
                      </Text>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="mt-2xl">
              <Button href="/solucoes" variant="secondary">
                Ver todas as soluções
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* 4 COMO A DM PENSA */}
      {howWeThink ? (
        <Section spacing="loose" aria-labelledby="home-como-pensa">
          <Container>
            <SectionLabel>Como a DM pensa</SectionLabel>
            <Heading as="h2" variant="h2" id="home-como-pensa" className="mt-md">
              Como a DM pensa
            </Heading>
            <div className="mt-lg max-w-reading">
              <RichText value={howWeThink} />
            </div>
          </Container>
        </Section>
      ) : null}

      {/* 5 ESPECIALISTAS */}
      {specialists.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="home-especialistas">
          <Container>
            <SectionLabel>Especialistas</SectionLabel>
            <Heading as="h2" variant="h2" id="home-especialistas" className="mt-md">
              Quem está por trás
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-2xl sm:grid-cols-2 lg:grid-cols-3">
              {specialists.slice(0, 4).map((person) => (
                <li key={person.slug}>
                  <Link
                    href={`/sobre/especialistas/${person.slug}`}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-surface">
                      {person.photoStorageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(person.photoStorageKey)}
                          alt={`Foto de ${person.name}`}
                          width={800}
                          height={1000}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center"
                        >
                          <span className="font-serif text-display-m text-text-secondary">
                            {person.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                        </div>
                      )}
                    </div>
                    <Heading
                      as="h3"
                      variant="h3"
                      className="mt-md text-link group-hover:underline group-focus-visible:underline"
                    >
                      {person.name}
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-xs">
                      {person.roleTitle}
                    </Text>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2xl">
              <Button href="/sobre" variant="secondary">
                Conheça a equipe
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* 6 CONTEÚDO — a seção 7 (Prova) não é modelada e é pulada. */}
      {firstPost ? (
        <Section spacing="loose" aria-labelledby="home-conteudo">
          <Container>
            <SectionLabel>Conteúdo</SectionLabel>
            <Heading as="h2" variant="h2" id="home-conteudo" className="mt-md">
              Conhecimento para quem toma decisões
            </Heading>

            <div className="mt-xl grid grid-cols-1 gap-2xl lg:grid-cols-12">
              <article className="lg:col-span-7">
                <Link
                  href={`/blog/${firstPost.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                >
                  <Text size="metadata" tone="secondary">
                    {firstPost.authorName} ·{" "}
                    {firstPost.publishedAt.toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}{" "}
                    · {firstPost.readingMinutes} min
                  </Text>
                  <Heading
                    as="h3"
                    variant="h2"
                    className="mt-sm text-link group-hover:underline group-focus-visible:underline"
                  >
                    {firstPost.title}
                  </Heading>
                  {firstPost.excerpt ? (
                    <Text tone="secondary" className="mt-sm max-w-reading">
                      {firstPost.excerpt}
                    </Text>
                  ) : null}
                </Link>
              </article>

              {morePosts.length > 0 ? (
                <ul className="space-y-xl lg:col-span-5">
                  {morePosts.map((post) => (
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
                          variant="h4"
                          className="mt-xs text-link group-hover:underline group-focus-visible:underline"
                        >
                          {post.title}
                        </Heading>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-2xl">
              <Button href="/blog" variant="secondary">
                Ver todos os artigos
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* 8 CTA FINAL */}
      <Section tone="dark" spacing="loose" aria-labelledby="home-cta">
        <Container>
          <Heading as="h2" variant="h2" id="home-cta">
            Vamos conversar sobre a sua empresa
          </Heading>
          <Text size="lg" tone="secondary" className="mt-md max-w-reading">
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
