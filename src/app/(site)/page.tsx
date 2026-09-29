import type { Metadata } from "next";
import Link from "next/link";
import { Paragraphs } from "@/components/content/paragraphs";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";

/** Colunas do grid do blog por quantidade real de artigos: menos de 4 nunca deixa um card
 * solitário boiando num grid de 4 (docs/02 §04, grid consistente). */
const BLOG_GRID_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { buildMediaResolverForRoute } from "@/features/media/application/resolve";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import type { RichDoc } from "@/lib/rich-text";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { ServicesWheel } from "@/components/site/services-wheel";
import { ValuesCircle } from "@/components/site/values-circle";
import { ABOUT, CONTACT, HOME, WHATSAPP_URL } from "@/content/dm";
import { env } from "@/server/env";

const homeMetadata = publicMetadata({
  title: "DM Empresarial — Consultoria empresarial em Frutal/MG",
  description:
    "Consultoria empresarial em Frutal/MG. Método, acompanhamento e gente de verdade por trás de cada decisão.",
  path: "/",
});

// O título da Home já traz a marca: `absolute` evita o sufixo " · DM Empresarial" do template.
export const metadata: Metadata = {
  ...homeMetadata,
  title: { absolute: "DM Empresarial — Consultoria empresarial em Frutal/MG" },
};

/** Números da faixa de autoridade (texto em src/content/dm.ts), cada um com o seu ícone. */
const STAT_ICONS = [UsersIcon, ClockIcon];
const AUTHORITY_STATS = HOME.stats.map((stat, i) => ({
  ...stat,
  Icon: STAT_ICONS[i] ?? UsersIcon,
}));

export default async function HomePage() {
  const [postsPage, settings] = await Promise.all([
    listPublicPostsForRoute({ pageSize: 4 }),
    getPublicSettingsForRoute(),
  ]);
  const posts = postsPage.items;

  // Capas dos artigos do blog: resolvidas em lote (uma consulta).
  const coverIds = posts.map((p) => p.coverMediaId).filter((id): id is string => id !== null);
  const coverDoc: RichDoc | null =
    coverIds.length > 0
      ? { type: "doc", content: coverIds.map((mediaId) => ({ type: "image", attrs: { mediaId } })) }
      : null;
  const coverResolver = coverDoc ? await buildMediaResolverForRoute(coverDoc) : null;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: settings?.legalName ?? "DM Empresarial",
          url: env().SITE_URL,
          // SEO local (docs/03 §22): dados de contato confirmados (src/content/dm.ts).
          address: {
            "@type": "PostalAddress",
            streetAddress: CONTACT.address,
            addressRegion: "MG",
            addressCountry: "BR",
          },
          telephone: CONTACT.phone,
          email: CONTACT.email,
        }}
      />

      {/* 1 HERO — geometria de uma referência do usuário (proporções, posições, espaçamentos);
          cores e fontes continuam as da DM (docs/02), nunca as da referência. Topo mais justo de
          propósito (o cabeçalho já separa visualmente). */}
      <Section spacing="none" className="pt-lg pb-3xl md:pt-xl md:pb-4xl">
        <Container size="wide">
          <div className="grid grid-cols-1 items-start gap-2xl lg:grid-cols-[5fr_4fr] lg:gap-x-[120px]">
            <div className="min-w-0">
              <SectionLabel>Consultoria empresarial · Frutal, MG</SectionLabel>
              <h1 className="mt-lg font-serif text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-text sm:text-[2.75rem] lg:text-[58px] lg:leading-[1.02]">
                {HOME.headlineStart} <span className="text-action">{HOME.headlineHighlight}</span>.
              </h1>
              <Text size="lg" tone="secondary" className="mt-lg max-w-[570px]">
                {HOME.description}
              </Text>
              <div className="mt-2xl flex flex-wrap gap-sm">
                <Button href={WHATSAPP_URL} size="lg" target="_blank" rel="noopener noreferrer">
                  Conversar pelo WhatsApp
                  <span className="sr-only"> (abre em nova aba)</span>
                </Button>
                <Button href="#home-o-que-fazemos" variant="secondary" size="lg">
                  Ver o que fazemos
                </Button>
              </div>
              <Text size="sm" tone="secondary" className="mt-md">
                {HOME.note}
              </Text>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-border bg-surface-muted lg:mt-[3px]">
              {HOME.heroImage ? (
                // Imagem estática de /public, escolhida em src/content/dm.ts.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={HOME.heroImage.src}
                  alt={HOME.heroImage.alt}
                  className="aspect-[467/460] w-full object-cover"
                />
              ) : (
                <div className="flex aspect-[467/460] flex-col items-center justify-center gap-md p-xl text-center">
                  <UsersIcon aria-hidden="true" className="size-9 text-text-muted" />
                  <Text size="sm" tone="secondary" className="max-w-[220px]">
                    A foto da equipe da DM aparece aqui.
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Container>
      </Section>

      {/* 2 FAIXA DE AUTORIDADE — faixa fina: número e rótulo lado a lado, não empilhados. */}
      <Section
        tone="dark"
        spacing="none"
        className="py-xl md:py-2xl"
        aria-labelledby="home-autoridade"
      >
        <h2 id="home-autoridade" className="sr-only">
          Números da DM
        </h2>
        <Container>
          <ul className="flex flex-wrap items-center justify-center gap-x-3xl gap-y-sm">
            {AUTHORITY_STATS.map((stat) => (
              <li key={stat.label} className="flex items-center gap-sm">
                <stat.Icon aria-hidden="true" className="size-6 shrink-0 text-action-contrast" />
                <span className="font-sans text-body-sm text-text-secondary">
                  <span className="font-serif text-h4 font-medium text-text">{stat.value}</span>{" "}
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* O QUE FAZEMOS — roda com as quatro frentes (texto e paleta definidos pelo usuário). */}
      <ServicesWheel />

      {/* 3 BLOG — artigos reais do CMS, nunca placeholder. */}
      {posts.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="home-blog">
          <Container>
            <SectionLabel>Blog</SectionLabel>
            <Heading as="h2" variant="h2" id="home-blog" className="mt-md">
              Conhecimento para quem toma decisões
            </Heading>

            <ul
              className={`mt-2xl grid gap-xl ${BLOG_GRID_COLS[Math.min(posts.length, 4) as 1 | 2 | 3 | 4]}`}
            >
              {posts.map((post) => {
                const cover = post.coverMediaId ? coverResolver?.(post.coverMediaId) : null;
                return (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                    >
                      <div className="relative aspect-[16/10] overflow-hidden rounded-[12px] border border-border bg-surface-muted">
                        {cover ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={cover.url}
                            alt={cover.alt}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover transition-transform duration-base group-hover:scale-[1.03]"
                          />
                        ) : null}
                        <span className="absolute bottom-sm left-sm rounded-control bg-action px-sm py-2xs font-sans text-caption font-semibold text-action-contrast">
                          Ler artigo
                        </span>
                      </div>
                      <Text size="metadata" tone="secondary" className="mt-md">
                        {post.authorName} · {post.readingMinutes} min
                      </Text>
                      <Heading
                        as="h3"
                        variant="h4"
                        className="mt-xs text-link group-hover:underline group-focus-visible:underline"
                      >
                        {post.title}
                      </Heading>
                      {post.publishedAt ? (
                        <Text size="sm" tone="secondary" className="mt-xs">
                          {post.publishedAt.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "long",
                            year: "numeric",
                          })}
                        </Text>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-2xl">
              <Button href="/blog" variant="secondary">
                Ver todos os artigos
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* SOBRE NÓS — composição de uma referência do usuário: título centralizado, texto à
          esquerda e, à direita, os valores escritos em volta de um círculo. Texto em
          src/content/dm.ts; sem valores cadastrados, o círculo usa só dados reais da DM. */}
      <Section
        tone="muted"
        spacing="loose"
        aria-labelledby="home-sobre"
        className="relative overflow-hidden"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 260 200"
          className="pointer-events-none absolute top-0 right-0 w-[160px] fill-none stroke-border-strong sm:w-[260px]"
        >
          <path d="M 60 0 C 70 110 150 170 260 176" strokeWidth={4} strokeLinecap="round" />
        </svg>
        <Container>
          <Heading as="h2" variant="display-m" id="home-sobre" className="text-center">
            Sobre nós
          </Heading>
          <div className="mt-3xl grid grid-cols-1 items-center gap-3xl lg:grid-cols-2">
            <div className="max-w-reading">
              <Paragraphs items={ABOUT.whoWeAre} />
              <div className="mt-xl">
                <Button href="/sobre" variant="secondary">
                  Conheça a DM
                </Button>
              </div>
            </div>
            <ValuesCircle
              names={
                ABOUT.values.length > 0
                  ? ABOUT.values.map((v) => v.name)
                  : ["DM Empresarial", "Consultoria empresarial", "Frutal, MG"]
              }
            />
          </div>
        </Container>
      </Section>

      {/* CTA — cartão com a ponta esquerda arredondada e um botão circular flutuando na costura
          de baixo (geometria de uma referência do usuário; cores e texto da DM). */}
      <Section spacing="loose" aria-labelledby="home-cta">
        <h2 id="home-cta" className="sr-only">
          Fale com a DM
        </h2>
        <Container>
          <div className="flex flex-col gap-3xl">
            {/* Vamos conversar — arredonda só a ponta esquerda; título e texto lado a
                lado (não empilhados); botão circular flutuando na costura de baixo. */}
            <div className="relative rounded-[28px] bg-action p-2xl pb-3xl lg:rounded-r-[28px] lg:rounded-l-[999px] lg:py-3xl lg:pr-2xl lg:pl-4xl">
              <div className="grid grid-cols-1 gap-lg lg:grid-cols-[minmax(0,22rem)_minmax(0,24rem)] lg:items-center">
                {/* `Heading`/`Text` sempre aplicam a própria cor de texto (`text-text`); nesta
                    faixa a cor certa é a de contraste da ação, então usamos a tag crua com as
                    MESMAS classes tipográficas dos componentes, evitando a disputa entre duas
                    classes de cor no mesmo elemento (`cn` só concatena, não resolve prioridade). */}
                <h3 className="font-serif text-h2 font-medium text-action-contrast">
                  {CONTACT.title}
                </h3>
                <p className="font-sans text-body text-action-contrast/85">{CONTACT.intro}</p>
              </div>

              <Link
                href="/contato"
                aria-label="Fale com a DM"
                data-tone="dark"
                className="mt-lg flex size-14 items-center justify-center rounded-full bg-surface text-text transition-colors duration-150 ease-standard hover:bg-surface-muted lg:absolute lg:bottom-0 lg:left-1/2 lg:mt-0 lg:-translate-x-1/2 lg:translate-y-1/2"
              >
                <ArrowRightIcon className="size-6" />
              </Link>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
