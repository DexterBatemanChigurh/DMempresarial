import type { Metadata } from "next";
import { CtaCard } from "@/components/site/cta-card";
import Link from "next/link";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { SOLUTIONS_PAGE, SPECIALISTS, type SolutionLink } from "@/content/dm";
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Soluções",
  description: SOLUTIONS_PAGE.hero.description,
  path: "/solucoes",
});

const pad = (n: number) => String(n).padStart(2, "0");

/** Nome da solução: com página própria vira link; sem página, só o nome (nunca link vazio). */
function SolutionName({ item, className = "" }: { item: SolutionLink; className?: string }) {
  if (!item.slug) {
    return <span className={`font-sans text-body text-text ${className}`}>{item.label}</span>;
  }
  return (
    <Link
      href={`/solucoes/${item.slug}`}
      className={`inline-flex min-h-11 items-center gap-xs font-sans text-body font-semibold text-link underline-offset-4 hover:underline ${className}`}
    >
      {item.label}
      <ArrowRightIcon className="size-5" />
    </Link>
  );
}

export default async function SolutionsIndexPage() {
  const page = SOLUTIONS_PAGE;
  const [postsPage, categories] = await Promise.all([
    listPublicPostsForRoute({ pageSize: 3 }),
    listPublicCategoriesForRoute(),
  ]);
  const posts = postsPage.items;
  const categoryName = new Map(categories.map((c) => [c.slug, c.name]));

  return (
    <>
      {/* 1 HERO */}
      <Section spacing="loose">
        <Container>
          <SectionLabel>Soluções</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md max-w-[20ch]">
            {page.hero.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {page.hero.description}
          </Text>
          <div className="mt-2xl">
            <Button href="/contato" size="lg">
              Falar com a DM →
            </Button>
          </div>
        </Container>
      </Section>

      {/* 2 PROBLEMA → SOLUÇÃO */}
      <Section tone="muted" spacing="loose" aria-labelledby="avancar">
        <Container>
          <Heading as="h2" variant="h2" id="avancar">
            Onde sua empresa precisa avançar?
          </Heading>
          <ul className="mt-xl border-t border-border">
            {page.problems.map((row) => (
              <li key={row.problem} className="border-b border-border">
                <a
                  href={`#${row.anchor}`}
                  className="group grid min-h-11 gap-2xs py-md md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center md:gap-lg"
                >
                  <span className="font-sans text-body text-text-secondary">{row.problem}</span>
                  <span className="font-serif text-h4 font-medium text-text group-hover:text-link">
                    {row.solution}
                  </span>
                  <ArrowRightIcon className="hidden size-5 text-link md:block" />
                </a>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 3a CONSULTORIAS — bloco editorial por área */}
      <Section spacing="loose" aria-labelledby="consultorias">
        <Container>
          <SectionLabel>Consultorias</SectionLabel>
          <Heading as="h2" variant="h2" id="consultorias" className="mt-md">
            Começam pelo diagnóstico do seu negócio.
          </Heading>
          <ol className="mt-2xl border-t border-border">
            {page.areas.map((area, i) => (
              <li
                key={area.id}
                id={area.id}
                className="grid scroll-mt-24 gap-md border-b border-border py-xl md:grid-cols-[5rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-xl"
              >
                <span className="font-serif text-h3 text-text-secondary tabular-nums">
                  {pad(i + 1)}
                </span>
                <div>
                  <Heading as="h3" variant="h3">
                    {area.name}
                  </Heading>
                  <Text tone="secondary" className="mt-xs">
                    {area.tagline}
                  </Text>
                </div>
                <ul className="space-y-2xs md:pt-xs">
                  {area.links.map((item) => (
                    <li key={item.label}>
                      <SolutionName item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* 3b SERVIÇOS — soluções específicas e direcionadas */}
      <Section tone="muted" spacing="loose" aria-labelledby="servicos-titulo">
        <Container>
          <div id="servicos" className="scroll-mt-24" />
          <SectionLabel>Serviços</SectionLabel>
          <Heading as="h2" variant="h2" id="servicos-titulo" className="mt-md">
            Soluções específicas e direcionadas.
          </Heading>
          <ul className="mt-2xl grid gap-md sm:grid-cols-2">
            {page.services.map((item) => (
              <li key={item.label} className="rounded-[12px] border border-border bg-surface p-lg">
                <SolutionName item={item} />
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* 5 COMO TRABALHAMOS */}
      <Section spacing="loose" aria-labelledby="como-trabalhamos">
        <Container>
          <SectionLabel>Como trabalhamos</SectionLabel>
          <Heading as="h2" variant="h2" id="como-trabalhamos" className="mt-md">
            Entendemos antes de propor.
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            A abordagem geral da DM. Cada projeto se ajusta ao cenário da empresa.
          </Text>
          <ol className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-5 lg:gap-lg">
            {page.steps.map((step, i) => (
              <li key={step.name} className="border-t-2 border-action pt-md">
                <span className="font-sans text-label font-semibold text-text-secondary tabular-nums">
                  {pad(i + 1)}
                </span>
                <Heading as="h3" variant="h4" className="mt-xs">
                  {step.name}
                </Heading>
                <Text size="sm" tone="secondary" className="mt-xs">
                  {step.text}
                </Text>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* 6 ESCOLHA POR NECESSIDADE */}
      <Section tone="muted" spacing="loose" aria-labelledby="necessidade">
        <Container>
          <Heading as="h2" variant="h2" id="necessidade">
            O que sua empresa precisa neste momento?
          </Heading>
          <ul className="mt-2xl grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {page.needs.map((item) => {
              const talk = item.href === "/contato";
              return (
                <li key={item.need}>
                  <Link
                    href={item.href}
                    className={`group flex h-full flex-col justify-between gap-md rounded-[12px] border p-lg transition-colors duration-150 ease-standard ${
                      talk
                        ? "border-action bg-action text-action-contrast hover:bg-action-hover"
                        : "border-border bg-surface text-text hover:border-link"
                    }`}
                  >
                    <span className="font-serif text-h4 font-medium">{item.need}</span>
                    <span
                      className={`inline-flex items-center gap-xs font-sans text-sm font-semibold ${
                        talk ? "" : "text-link"
                      }`}
                    >
                      {item.answer}
                      <ArrowRightIcon className="size-5" />
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Container>
      </Section>

      {/* 7 ESPECIALISTAS */}
      {SPECIALISTS.length > 0 ? (
        <Section spacing="loose" aria-labelledby="especialistas">
          <Container>
            <SectionLabel>Especialistas</SectionLabel>
            <Heading as="h2" variant="h2" id="especialistas" className="mt-md">
              Experiência aplicada ao seu negócio.
            </Heading>
            <ul className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-3">
              {SPECIALISTS.map((person) => (
                <li key={person.slug}>
                  <Link href={`/sobre/especialistas/${person.slug}`} className="group block">
                    <div className="aspect-[4/5] overflow-hidden rounded-[12px] bg-surface-muted">
                      {person.photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={person.photo}
                          alt={`Foto de ${person.name}`}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-full items-center justify-center font-serif text-display-m text-text-secondary"
                        >
                          {person.name
                            .split(" ")
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join("")}
                        </div>
                      )}
                    </div>
                    <Heading as="h3" variant="h4" className="mt-md">
                      {person.name}
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-2xs">
                      {person.roleTitle}
                    </Text>
                    <span className="mt-sm inline-flex items-center gap-xs font-sans text-sm font-semibold text-link group-hover:underline">
                      Ver especialista <ArrowRightIcon className="size-5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* 8 CONTEÚDO RELACIONADO — artigos reais, nunca placeholder */}
      {posts.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="conteudo">
          <Container>
            <SectionLabel>Blog</SectionLabel>
            <Heading as="h2" variant="h2" id="conteudo" className="mt-md">
              Conhecimento para tomar decisões melhores.
            </Heading>
            <ul className="mt-2xl grid gap-xl md:grid-cols-3">
              {posts.map((post) => (
                <li key={post.slug} className="border-t border-border pt-lg">
                  <Link href={`/blog/${post.slug}`} className="group block">
                    {post.primaryCategorySlug ? (
                      <span className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                        {categoryName.get(post.primaryCategorySlug) ?? post.primaryCategorySlug}
                      </span>
                    ) : null}
                    <Heading
                      as="h3"
                      variant="h4"
                      className="mt-xs group-hover:text-link group-hover:underline"
                    >
                      {post.title}
                    </Heading>
                    <span className="mt-sm inline-flex items-center gap-xs font-sans text-sm font-semibold text-link">
                      Ler artigo <ArrowRightIcon className="size-5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {/* 9 CTA FINAL */}
      <CtaCard
        id="solucoes-cta"
        title={page.cta.title}
        text={page.cta.text}
        primary={{ href: "/contato", label: "Conversar com a DM →" }}
        secondary={{ href: "/sobre/especialistas", label: "Conhecer os especialistas →" }}
      />
    </>
  );
}
