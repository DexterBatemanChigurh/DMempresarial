import type { Metadata } from "next";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { Button, Container, Heading, Section, SectionLabel, Text, TextLink } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ABOUT, HOME, SOLUTIONS, SOLUTIONS_PAGE, findSolution } from "@/content/dm";
import { env } from "@/server/env";

export const metadata: Metadata = publicMetadata({
  title: "Soluções: dívidas, crédito, estratégia e gestão",
  description:
    "Recuperação de crédito, reorganização de dívidas, consultoria estratégica e reestruturação de gestão. A DM Empresarial entende o caixa e faz o diagnóstico antes de propor, em Frutal/MG.",
  path: "/solucoes",
});

const pad = (n: number) => String(n).padStart(2, "0");

const TYPE_LABEL = { CONSULTORIA: "Consultoria", SERVICO: "Serviço" } as const;

export default function SolutionsIndexPage() {
  const page = SOLUTIONS_PAGE;
  const anchorOf = new Map(
    page.groups.flatMap((g) => g.fronts.map((f) => [f.slug, f.anchor] as const)),
  );

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          itemListElement: SOLUTIONS.map((s, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "Service",
              name: s.title,
              description: s.summary,
              serviceType: TYPE_LABEL[s.type],
              provider: { "@type": "Organization", name: "DM Empresarial", url: env().SITE_URL },
              areaServed: "Frutal e região, MG",
            },
          })),
        }}
      />

      {/* 1 HERO — mesma geometria do Hero da Home (contêiner largo, título com destaque). */}
      <Section tone="dark" spacing="none" className="pt-2xl pb-3xl md:pt-3xl md:pb-4xl">
        <Container>
          <SectionLabel>Soluções · DM Empresarial</SectionLabel>
          <h1 className="mt-lg max-w-[20ch] font-serif text-[2.25rem] leading-[1.05] font-bold tracking-[-0.02em] text-text sm:text-[2.75rem] lg:max-w-[24ch] lg:text-[58px] lg:leading-[1.02]">
            {page.hero.titleStart} <span className="text-link">{page.hero.titleHighlight}</span>.
          </h1>
          <Text size="lg" tone="secondary" className="mt-lg max-w-[570px]">
            {page.hero.description}
          </Text>
          <div className="mt-2xl flex flex-col gap-sm sm:flex-row sm:flex-wrap">
            <Button
              href="/contato"
              size="lg"
              className="bg-ouro! text-verde-tinta! hover:bg-ouro-claro!"
            >
              Conversar com a DM
            </Button>
            <Button href="#solucoes" variant="secondary" size="lg">
              Ver as quatro frentes
            </Button>
          </div>
          <Text size="sm" tone="secondary" className="mt-md">
            {HOME.note}
          </Text>
        </Container>
      </Section>

      {/* 2 IDENTIFICAÇÃO — situações reais; cada uma leva à frente correspondente. */}
      <Section tone="muted" spacing="default" aria-labelledby="situacoes">
        <Container>
          <Heading as="h2" variant="h2" id="situacoes" className="scroll-mt-24">
            Se isso acontece na sua empresa, é aqui que começamos.
          </Heading>
          <ol className="mt-xl border-t border-border">
            {page.situations.map((row, i) => {
              const front = findSolution(row.slug);
              if (!front) return null;
              return (
                <li key={row.slug} className="border-b border-border">
                  <a
                    href={`#${anchorOf.get(row.slug)}`}
                    className="group grid min-h-11 gap-sm py-lg md:grid-cols-[3rem_minmax(0,1.2fr)_minmax(0,1fr)] md:items-center md:gap-lg"
                  >
                    <span className="font-sans text-label font-semibold text-text-secondary tabular-nums">
                      {pad(i + 1)}
                    </span>
                    <span className="font-serif text-h4 font-medium text-text">{row.text}</span>
                    <span className="flex flex-col gap-2xs">
                      <span className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                        Frente da DM
                      </span>
                      <span className="inline-flex items-center gap-xs font-sans text-body font-semibold text-link underline-offset-4 group-hover:underline">
                        {front.title}
                        <ArrowRightIcon className="size-5 shrink-0" />
                      </span>
                    </span>
                  </a>
                </li>
              );
            })}
          </ol>
        </Container>
      </Section>

      {/* 3 SOLUÇÕES — as quatro frentes da Home, agrupadas pelo tipo de problema. */}
      <Section spacing="loose" aria-labelledby="solucoes">
        <Container>
          {/* Destino antigo dos artigos de marketing do blog: cai no início das frentes. */}
          <span id="marketing" className="block scroll-mt-24" />
          <SectionLabel>Soluções</SectionLabel>
          <Heading as="h2" variant="h2" id="solucoes" className="mt-md scroll-mt-40">
            Quatro frentes, aplicadas na ordem que o seu caso exigir.
          </Heading>

          <div className="mt-2xl space-y-3xl">
            {page.groups.map((group) => (
              <div key={group.id} id={group.id} className="scroll-mt-24">
                <Heading as="h3" variant="h4" id={group.headingId} className="scroll-mt-24">
                  {group.title}
                </Heading>
                <Text tone="secondary" className="mt-xs max-w-reading">
                  {group.text}
                </Text>
                <ul className="mt-xl grid gap-xl md:grid-cols-2 md:gap-2xl">
                  {group.fronts.map((front) => {
                    const solution = findSolution(front.slug);
                    if (!solution) return null;
                    return (
                      <li
                        key={front.slug}
                        id={front.anchor}
                        className="scroll-mt-24 border-t-2 border-action pt-md transition-colors target:bg-surface-muted"
                      >
                        <span className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                          {TYPE_LABEL[solution.type]}
                        </span>
                        <Heading as="h4" variant="h3" className="mt-xs">
                          {solution.title}
                        </Heading>
                        <Text tone="secondary" className="mt-sm">
                          {solution.summary}
                        </Text>
                        <p className="mt-xs">
                          <TextLink href="/contato" className="inline-flex min-h-11 items-center">
                            Conversar sobre esta frente
                          </TextLink>
                        </p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* 4 COMO A DM ESCOLHE — diagnóstico antes de proposta (Como trabalhamos). */}
      <Section
        tone="dark"
        spacing="loose"
        className="border-t-[3px] border-ouro"
        aria-labelledby="como-trabalhamos"
      >
        <Container>
          <SectionLabel>Como trabalhamos</SectionLabel>
          <Heading
            as="h2"
            variant="h2"
            id="como-trabalhamos"
            className="mt-md max-w-[24ch] scroll-mt-24"
          >
            {page.process.title}
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            {page.process.text}
          </Text>
          <ol className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-5 lg:gap-lg">
            {page.process.steps.map((step, i) => (
              <li key={step.name} className="border-t-2 border-ouro pt-md">
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

      {/* 5 AUTORIDADE — só números confirmados e quem conduz o trabalho. */}
      <Section spacing="default" aria-labelledby="quem-conduz">
        <Container>
          <div className="grid gap-2xl lg:grid-cols-2 lg:items-center lg:gap-3xl">
            <div>
              <SectionLabel>Experiência</SectionLabel>
              <Heading as="h2" variant="h2" id="quem-conduz" className="mt-md">
                Quem conduz o trabalho.
              </Heading>
              <Text tone="secondary" className="mt-md max-w-reading">
                {ABOUT.whoWeAre[1]}
              </Text>
              <div className="mt-xl">
                <Button href="/sobre" variant="secondary">
                  Conheça a DM
                </Button>
              </div>
            </div>
            <ul className="space-y-lg">
              {HOME.stats.map((stat) => (
                <li key={stat.label} className="border-t border-border pt-md">
                  <span className="font-serif text-[2.75rem] leading-none font-medium text-text">
                    {stat.value}
                  </span>
                  <Text tone="secondary" className="mt-2xs">
                    {stat.label}
                  </Text>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* 6 CTA FINAL — fecha a jornada: uma única ação, conversar e apresentar o cenário. */}
      <Section
        tone="muted"
        spacing="none"
        className="py-3xl md:py-4xl"
        aria-labelledby="solucoes-cta"
      >
        <Container>
          <SectionLabel>{page.cta.eyebrow}</SectionLabel>
          <Heading
            as="h2"
            variant="h1"
            id="solucoes-cta"
            className="mt-md max-w-[20ch] text-balance"
          >
            {page.cta.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-[38rem]">
            {page.cta.text}
          </Text>
          <div className="mt-2xl">
            <Button href="/contato" size="lg" className="w-full sm:w-auto">
              {page.cta.label}
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
