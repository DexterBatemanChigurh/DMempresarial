import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon, ChartIcon, ClockIcon, UsersIcon } from "@/components/ui/icons";

/** Colunas do grid do blog por quantidade real de artigos: menos de 4 nunca deixa um card
 * solitário boiando num grid de 4 (docs/02 §04, grid consistente). */
const BLOG_GRID_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
import { listPublicSolutionsForRoute } from "@/features/catalog/application/public-solutions";
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { buildMediaResolverForRoute } from "@/features/media/application/resolve";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { homeDataSchema } from "@/features/pages/domain/page-schemas";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import type { RichDoc } from "@/lib/rich-text";
import { JsonLd, publicMetadata } from "@/components/site/seo";
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

/**
 * Números reais confirmados pela DM (26–27/09/2026): nunca inventar prova social (Prompt 1 §20).
 * Aparecem resumidos sob o CTA do hero e ampliados na faixa de autoridade.
 */
const AUTHORITY_STATS = [
  { value: "+300", label: "empresas atendidas", Icon: UsersIcon },
  { value: "14 anos", label: "no mercado", Icon: ClockIcon },
  { value: "+R$ 2 Bi", label: "administrados para nossos clientes", Icon: ChartIcon },
] as const;

// As duas únicas cores usadas no gráfico de soluções — tons já existentes da paleta da DM
// (docs/02 §15: paleta contida, nunca cor nova só para "colorir um gráfico").
const SOLUTION_TYPE_COLOR: Record<"CONSULTORIA" | "SERVICO", string> = {
  CONSULTORIA: "var(--color-azul-marca)",
  SERVICO: "var(--color-verde-tinta)",
};
const SOLUTION_TYPE_LABEL: Record<"CONSULTORIA" | "SERVICO", string> = {
  CONSULTORIA: "Consultoria",
  SERVICO: "Serviço",
};

export default async function HomePage() {
  const [homePage, solutions, postsPage, settings] = await Promise.all([
    getPublishedPageForRoute("home"),
    listPublicSolutionsForRoute(),
    listPublicPostsForRoute({ pageSize: 4 }),
    getPublicSettingsForRoute(),
  ]);

  const parsed = homePage ? homeDataSchema.safeParse(homePage.data) : null;
  const homeData = parsed?.success ? parsed.data : null;

  const description = homeData?.description ?? null;
  const posts = postsPage.items;

  // Foto do hero (docs/03, parte 21): sem uma escolhida em /admin/paginas ainda, a home mostra um
  // estado vazio (nunca um "headshot corporativo genérico", Prompt 2 §18).
  const heroImageDoc: RichDoc | null = homeData?.heroImageId
    ? { type: "doc", content: [{ type: "image", attrs: { mediaId: homeData.heroImageId } }] }
    : null;

  // Capas dos artigos do blog: resolvidas em lote (uma consulta), mesma técnica da foto do hero.
  const coverIds = posts.map((p) => p.coverMediaId).filter((id): id is string => id !== null);
  const coverDoc: RichDoc | null =
    coverIds.length > 0
      ? { type: "doc", content: coverIds.map((mediaId) => ({ type: "image", attrs: { mediaId } })) }
      : null;
  const [heroResolver, coverResolver] = await Promise.all([
    heroImageDoc ? buildMediaResolverForRoute(heroImageDoc) : Promise.resolve(null),
    coverDoc ? buildMediaResolverForRoute(coverDoc) : Promise.resolve(null),
  ]);

  // Gráfico de soluções: fatias iguais por solução publicada, coloridas pelo tipo (só 2 tons da
  // paleta da DM — nunca uma cor nova só para decorar um gráfico).
  const solutionSlices = solutions.map((s, i) => {
    const start = (360 / solutions.length) * i;
    const end = (360 / solutions.length) * (i + 1);
    return { ...s, start, end };
  });
  const donutGradient =
    solutions.length > 0
      ? `conic-gradient(${solutionSlices
          .map((s) => `${SOLUTION_TYPE_COLOR[s.type]} ${s.start}deg ${s.end}deg`)
          .join(", ")})`
      : undefined;
  const consultoriaCount = solutions.filter((s) => s.type === "CONSULTORIA").length;
  const servicoCount = solutions.filter((s) => s.type === "SERVICO").length;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: settings?.legalName ?? "DM Empresarial",
          url: env().SITE_URL,
          // SEO local (docs/03 §22): só o que site_settings já confirma — nada inventado, e some
          // sozinho quando o campo estiver vazio (mesma regra do rodapé).
          ...(settings?.address
            ? {
                address: {
                  "@type": "PostalAddress",
                  streetAddress: settings.address,
                  addressRegion: "MG",
                  addressCountry: "BR",
                },
              }
            : {}),
          ...(settings?.phone ? { telephone: settings.phone } : {}),
          ...(settings?.email ? { email: settings.email } : {}),
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
              {homeData?.headline ? (
                <h1 className="mt-lg font-serif text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-text sm:text-[2.75rem] lg:text-[58px] lg:leading-[1.02]">
                  {homeData.headline}
                </h1>
              ) : (
                <h1 className="mt-lg font-serif text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-text sm:text-[2.75rem] lg:text-[58px] lg:leading-[1.02]">
                  Consultoria empresarial com{" "}
                  <span className="text-action">método, acompanhamento e gente de verdade</span>.
                </h1>
              )}
              {description ? (
                <div className="mt-lg max-w-[570px]">
                  <RichText value={description} />
                </div>
              ) : (
                <Text size="lg" tone="secondary" className="mt-lg max-w-[570px]">
                  Diagnóstico claro, plano prático e alguém acompanhando de perto — da decisão até o
                  resultado.
                </Text>
              )}
              <div className="mt-2xl flex flex-wrap gap-sm">
                <Button href="/contato" size="lg">
                  Fale com a DM →
                </Button>
                <Button href="/solucoes" variant="secondary" size="lg">
                  Conheça nossas soluções
                </Button>
              </div>
            </div>

            <div className="overflow-hidden rounded-[16px] border border-border bg-surface-muted lg:mt-[3px]">
              {heroImageDoc && heroResolver ? (
                <RichText value={heroImageDoc} resolveMedia={heroResolver} />
              ) : (
                <div className="flex aspect-[467/460] flex-col items-center justify-center gap-md p-xl text-center">
                  <UsersIcon aria-hidden="true" className="size-9 text-text-muted" />
                  <Text size="sm" tone="secondary" className="max-w-[220px]">
                    A foto da equipe da DM aparece aqui assim que for publicada em Configurações.
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

      {/* 4 SOLUÇÕES — soluções reais, agrupadas por tipo num gráfico simples (nunca fatias
          decorativas sem significado: cada fatia é uma solução publicada de verdade). */}
      {solutions.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="home-solucoes">
          <Container>
            <SectionLabel>Soluções</SectionLabel>
            <Heading as="h2" variant="h2" id="home-solucoes" className="mt-md">
              O que fazemos
            </Heading>

            <div className="mt-2xl grid grid-cols-1 items-center gap-2xl lg:grid-cols-[auto_1fr] lg:gap-x-4xl">
              <div className="flex flex-col items-center gap-md justify-self-center">
                <div
                  className="relative flex size-[220px] items-center justify-center rounded-full sm:size-[280px]"
                  style={{ background: donutGradient }}
                >
                  <div className="flex size-[70%] flex-col items-center justify-center rounded-full bg-surface-muted text-center">
                    <Text as="span" size="sm" tone="secondary">
                      soluções
                    </Text>
                    <Text as="span" className="font-serif text-display-m text-text">
                      {solutions.length}
                    </Text>
                  </div>
                </div>
                <ul className="flex gap-lg">
                  <li className="flex items-center gap-xs">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ background: SOLUTION_TYPE_COLOR.CONSULTORIA }}
                    />
                    <Text size="sm" tone="secondary">
                      {SOLUTION_TYPE_LABEL.CONSULTORIA} ({consultoriaCount})
                    </Text>
                  </li>
                  <li className="flex items-center gap-xs">
                    <span
                      aria-hidden="true"
                      className="size-2.5 rounded-full"
                      style={{ background: SOLUTION_TYPE_COLOR.SERVICO }}
                    />
                    <Text size="sm" tone="secondary">
                      {SOLUTION_TYPE_LABEL.SERVICO} ({servicoCount})
                    </Text>
                  </li>
                </ul>
              </div>

              <ul className="grid min-w-0 max-w-[48rem] grid-cols-1 gap-lg sm:grid-cols-2">
                {solutions.map((item) => (
                  <li key={item.slug} className="relative pl-md">
                    <span
                      aria-hidden="true"
                      className="absolute top-2xs bottom-2xs left-0 w-1 rounded-full"
                      style={{ background: SOLUTION_TYPE_COLOR[item.type] }}
                    />
                    <Link
                      href={`/solucoes/${item.slug}`}
                      className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                    >
                      <Heading
                        as="h3"
                        variant="h4"
                        className="text-link group-hover:underline group-focus-visible:underline"
                      >
                        {item.title}
                      </Heading>
                      <Text size="sm" tone="secondary" className="mt-2xs">
                        {item.summary}
                      </Text>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-2xl">
              <Button href="/solucoes" variant="secondary">
                Ver todas as soluções
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* 5 CTA — geometria da referência do usuário (dois cartões flutuantes, não colados na
          borda do viewport): duas faixas empilhadas com pontas arredondadas alternadas (a de
          cima abre à direita, a de baixo à esquerda), um círculo sobrepondo a ponta arredondada
          da primeira (meio dentro meio fora DO CARTÃO, não da tela — por isso ele fica inteiro,
          nunca cortado), e um botão circular flutuando na costura da segunda com o fundo. Cores,
          texto e o círculo (sem foto real ainda) continuam os da DM. */}
      <Section spacing="loose" aria-labelledby="home-cta">
        <h2 id="home-cta" className="sr-only">
          Fale com a DM
        </h2>
        <Container>
          <div className="flex flex-col gap-3xl">
            {/* Soluções — arredonda só a ponta direita; o círculo (foto da equipe, quando houver)
                sobrepõe essa ponta, meio dentro meio fora, como na referência. */}
            <div
              data-tone="dark"
              className="relative flex flex-col justify-center gap-lg rounded-[28px] bg-surface p-2xl lg:rounded-l-[28px] lg:rounded-r-[999px] lg:py-3xl lg:pr-[200px] lg:pl-2xl"
            >
              <SectionLabel>Soluções</SectionLabel>
              <Text size="lg" className="max-w-[28rem] text-text">
                Consultoria e serviços descritos pelo problema que resolvem — sem tabela de preços,
                cada conversa começa pelo contexto da sua empresa.
              </Text>
              <div>
                <Button href="/solucoes" variant="secondary" size="sm">
                  Conheça as soluções →
                </Button>
              </div>

              <div
                aria-hidden="true"
                className="mt-lg flex size-24 items-center justify-center self-center rounded-full border border-border bg-surface-muted lg:absolute lg:top-1/2 lg:right-0 lg:mt-0 lg:size-40 lg:translate-x-1/4 min-[1360px]:translate-x-3/5 lg:-translate-y-1/2 lg:self-auto"
              >
                <UsersIcon className="size-8 text-text-muted lg:size-10" />
              </div>
            </div>

            {/* Fale com um especialista — arredonda só a ponta esquerda; título e texto lado a
                lado (não empilhados); botão circular flutuando na costura de baixo. */}
            <div className="relative rounded-[28px] bg-action p-2xl pb-3xl lg:rounded-r-[28px] lg:rounded-l-[999px] lg:py-3xl lg:pr-2xl lg:pl-4xl">
              <div className="grid grid-cols-1 gap-lg lg:grid-cols-[minmax(0,22rem)_minmax(0,24rem)] lg:items-center">
                {/* `Heading`/`Text` sempre aplicam a própria cor de texto (`text-text`); nesta
                    faixa a cor certa é a de contraste da ação, então usamos a tag crua com as
                    MESMAS classes tipográficas dos componentes, evitando a disputa entre duas
                    classes de cor no mesmo elemento (`cn` só concatena, não resolve prioridade). */}
                <h3 className="font-serif text-h2 font-medium text-action-contrast">
                  Fale com um especialista
                </h3>
                <p className="font-sans text-body text-action-contrast/85">
                  Conte o contexto da sua empresa e a DM explica como pode ajudar.
                </p>
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
