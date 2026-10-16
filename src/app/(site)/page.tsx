import type { Metadata } from "next";
import { CtaCard } from "@/components/site/cta-card";
import { Paragraphs } from "@/components/content/paragraphs";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ClockIcon, UsersIcon, WalletCardsIcon, WhatsAppIcon } from "@/components/ui/icons";

/** Colunas do grid do blog por quantidade real de artigos: menos de 4 nunca deixa um card
 * solitário boiando num grid de 4 (docs/02 §04, grid consistente). */
const BLOG_GRID_COLS: Record<1 | 2 | 3 | 4, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { buildCoverResolverForRoute } from "@/features/media/application/resolve";
import { PostCard } from "@/components/content/post-card";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { ClientsGrid } from "@/components/site/clients-grid";
import { VideoTestimonials } from "@/components/site/video-testimonials";
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
const STAT_ICONS = [UsersIcon, ClockIcon, WalletCardsIcon];
const AUTHORITY_STATS = HOME.stats.map((stat, i) => ({
  ...stat,
  Icon: STAT_ICONS[i] ?? UsersIcon,
}));

export default async function HomePage() {
  const postsPage = await listPublicPostsForRoute({ pageSize: 4 });
  const posts = postsPage.items;

  // Capas dos artigos do blog: resolvidas em lote (uma consulta).
  const coverResolver = await buildCoverResolverForRoute(posts.map((p) => p.coverMediaId));
  const categoryName = new Map(
    (await listPublicCategoriesForRoute()).map((c) => [c.slug, c.name] as const),
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: CONTACT.legalName ?? "DM Empresarial",
          url: env().SITE_URL,
          logo: `${env().SITE_URL}/brand/logo-dm.png`,
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
              <h1 className="mt-lg font-display text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-text sm:text-[2.75rem] lg:text-[58px] lg:leading-[1.02]">
                {HOME.headlineStart} <span className="text-action">{HOME.headlineHighlight}</span>.
              </h1>
              <Text size="lg" tone="secondary" className="mt-lg max-w-[570px]">
                {HOME.description}
              </Text>
              <div className="mt-2xl flex flex-col gap-sm sm:flex-row sm:flex-wrap">
                <Button
                  href={WHATSAPP_URL}
                  variant="whatsapp"
                  size="lg"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <WhatsAppIcon aria-hidden="true" className="size-5" />
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
                // Foto recortada (fundo transparente), apoiada na borda de baixo do cartão.
                <div className="relative aspect-[467/460]">
                  <div
                    aria-hidden="true"
                    className="absolute top-[14%] left-1/2 aspect-square w-[74%] -translate-x-1/2 rounded-full bg-action/12"
                  />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={HOME.heroImage.src}
                    alt={HOME.heroImage.alt}
                    width={703}
                    height={1000}
                    fetchPriority="high"
                    className="absolute bottom-0 left-1/2 h-[93%] w-auto max-w-none -translate-x-1/2"
                  />
                </div>
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
          <ul className="flex flex-col items-start gap-y-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-center sm:gap-x-3xl">
            {AUTHORITY_STATS.map((stat) => (
              <li key={stat.label} className="flex items-center gap-sm">
                <stat.Icon aria-hidden="true" className="size-6 shrink-0 text-action-contrast" />
                <span className="font-sans text-body-sm text-text-secondary">
                  <span className="font-display text-h4 font-bold text-text">{stat.value}</span>{" "}
                  {stat.label}
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      {/* SOBRE NÓS — composição de uma referência do usuário: título centralizado, texto à
          esquerda e, à direita, os valores escritos em volta de um círculo. Texto em
          src/content/dm.ts; sem valores cadastrados, o círculo usa só dados reais da DM. */}
      <Section spacing="loose" aria-labelledby="home-sobre">
        <Container>
          <SectionLabel>Quem somos</SectionLabel>
          <Heading as="h2" variant="h2" id="home-sobre" className="mt-md">
            Sobre nós
          </Heading>
          <div className="mt-2xl grid grid-cols-1 items-start gap-3xl lg:grid-cols-2">
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

      {/* O QUE FAZEMOS — roda com as quatro frentes (texto e paleta definidos pelo usuário). */}
      <ServicesWheel />

      {/* NOSSOS CLIENTES — grid de logos sobre fundo escuro. Dados em src/content/dm.ts → CLIENTS.
          Adicione logos reais em public/clients/ e preencha o campo logo de cada item. */}
      <ClientsGrid />

      {/* DEPOIMENTOS EM VÍDEO — dados em src/content/dm.ts → TESTIMONIALS (vazio = cards "em breve"). */}
      <VideoTestimonials />

      {/* BLOG — artigos reais do CMS, nunca placeholder. Fundo branco: alterna com o creme dos
          depoimentos logo acima. */}
      {posts.length > 0 ? (
        <Section spacing="loose" aria-labelledby="home-blog">
          <Container>
            <SectionLabel>Blog</SectionLabel>
            <Heading as="h2" variant="h2" id="home-blog" className="mt-md">
              Conhecimento para quem toma decisões
            </Heading>

            <ul
              className={`mt-2xl grid gap-xl ${BLOG_GRID_COLS[Math.min(posts.length, 4) as 1 | 2 | 3 | 4]}`}
            >
              {posts.map((post) => (
                <li key={post.slug}>
                  <PostCard
                    post={post}
                    resolve={coverResolver}
                    categoryName={categoryName.get(post.primaryCategorySlug ?? "")}
                  />
                </li>
              ))}
            </ul>

            <div className="mt-2xl">
              <Button href="/blog" variant="secondary">
                Ver todos os artigos
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* CTA final — texto e botões definidos pelo usuário. */}
      <CtaCard
        id="home-cta"
        emphasis
        title="Sua empresa pode estar pronta para o próximo passo."
        text="Conte-nos o que está acontecendo. A partir disso, podemos entender o cenário e conversar sobre os caminhos possíveis."
        primary={{ href: "/contato", label: "Conversar com a DM" }}
        secondary={{ href: "/solucoes", label: "Conhecer nossas soluções" }}
      />
    </>
  );
}
