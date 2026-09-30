import type { Metadata } from "next";
import { Paragraphs } from "@/components/content/paragraphs";
import { Button, Container, Heading, Section, SectionLabel, Text, TextLink } from "@/components/ui";
import { ABOUT } from "@/content/dm";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Sobre a DM: consultoria empresarial em Frutal/MG",
  description:
    "Quem é a DM Empresarial, consultoria de Frutal/MG: como pensa, como trabalha, o que orienta a atuação e quem conduz o trabalho.",
  path: "/sobre",
});

export default function AboutPage() {
  const data = ABOUT;
  const values = ABOUT.values;

  return (
    <>
      {/* HERO — abertura editorial: título grande, uma assinatura (o fundador) e um texto curto.
          Sem imagem (não há foto real no projeto) e sem botões: é apresentação, não conversão. */}
      <Section tone="dark" spacing="none" className="pt-2xl pb-3xl md:pt-3xl md:pb-4xl">
        <Container>
          <SectionLabel>{data.hero.eyebrow}</SectionLabel>
          <h1 className="mt-xl max-w-[16ch] font-serif text-[2.5rem] leading-[1.02] font-bold tracking-[-0.025em] text-text sm:max-w-[20ch] sm:text-[3.5rem] lg:text-[5rem] xl:text-[5.5rem]">
            {data.hero.titleStart} <span className="text-link">{data.hero.titleHighlight}</span>.
          </h1>
          <div className="mt-2xl grid gap-xl border-t border-border pt-lg lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-3xl">
            <div className="order-2 lg:order-1">
              <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                {data.hero.founderLabel}
              </p>
              <p className="mt-2xs font-serif text-h4 font-medium text-text">
                {data.hero.founderName}
              </p>
            </div>
            <div className="order-1 lg:order-2">
              <Text size="lg" tone="secondary" className="max-w-[38rem]">
                {data.hero.text}
              </Text>
              <p className="mt-md">
                <TextLink href="#quem-somos" className="inline-flex min-h-11 items-center">
                  {data.hero.link}
                </TextLink>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* QUEM SOMOS — texto em duas colunas (título à esquerda, leitura à direita). Sem cards,
          listas nem serviços: aqui é a identidade da DM; o que ela faz fica em /solucoes. */}
      <Section tone="muted" spacing="loose" aria-labelledby="quem-somos">
        <Container>
          <div className="grid gap-xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-3xl">
            <div>
              <SectionLabel>{data.identity.label}</SectionLabel>
              <Heading
                as="h2"
                variant="h2"
                id="quem-somos"
                className="mt-md max-w-[20ch] scroll-mt-40 text-balance"
              >
                {data.identity.title}
              </Heading>
            </div>
            <div className="max-w-reading lg:pt-[calc(var(--spacing-md)+2.25rem)]">
              <p className="font-serif text-h4 leading-snug font-medium text-text">
                {data.identity.lead}
              </p>
              <div className="mt-lg">
                <Paragraphs items={data.identity.body} />
              </div>
              <p className="mt-xl border-l-2 border-action pl-md font-serif text-h4 leading-snug font-medium text-text">
                {data.identity.note}
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* COMO PENSAMOS — a lógica de raciocínio da DM em pares "não parte de / parte de".
          Composição editorial (título à esquerda, pares em linhas à direita); sem cards, sem
          números e sem as etapas de trabalho, que pertencem a "Como trabalhamos". */}
      <Section spacing="loose" aria-labelledby="como-pensamos">
        <Container>
          <div className="grid gap-2xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-3xl">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <SectionLabel>{data.thinking.label}</SectionLabel>
              <Heading
                as="h2"
                variant="h2"
                id="como-pensamos"
                className="mt-md max-w-[18ch] scroll-mt-40 text-balance"
              >
                {data.thinking.title}
              </Heading>
              <Text tone="secondary" className="mt-lg max-w-reading">
                {data.thinking.text}
              </Text>
            </div>
            <ul className="border-t border-border-strong">
              {data.thinking.pairs.map((pair) => (
                <li
                  key={pair.to}
                  className="grid gap-md border-b border-border py-xl md:grid-cols-2 md:gap-xl"
                >
                  <div>
                    <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                      {data.thinking.fromLabel}
                    </p>
                    <p className="mt-xs font-sans text-body text-text-secondary">{pair.from}</p>
                  </div>
                  <div>
                    <p className="font-sans text-label font-semibold tracking-[0.08em] text-action uppercase">
                      {data.thinking.toLabel}
                    </p>
                    <p className="mt-xs font-serif text-h4 leading-snug font-medium text-text">
                      {pair.to}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </Section>

      {/* COMO TRABALHAMOS — a experiência de trabalhar com a DM. Título largo no topo e, abaixo,
          um texto corrido com um fio vertical contínuo (a relação), sem etapas nem numeração:
          o processo em sequência é assunto de /solucoes. */}
      <Section tone="muted" spacing="loose" aria-labelledby="como-trabalhamos">
        <Container>
          <SectionLabel>{data.working.label}</SectionLabel>
          <Heading
            as="h2"
            variant="display-m"
            id="como-trabalhamos"
            className="mt-md max-w-[22ch] scroll-mt-40 text-balance"
          >
            {data.working.title}
          </Heading>
          <div className="mt-2xl grid gap-xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-3xl">
            <Text tone="secondary" className="max-w-[26rem]">
              {data.working.intro}
            </Text>
            <div className="max-w-reading space-y-xl border-l-2 border-border-strong pl-lg md:pl-xl">
              {data.working.items.map((item) => (
                <div key={item.lead}>
                  <h3 className="font-serif text-h4 leading-snug font-medium text-text">
                    {item.lead}
                  </h3>
                  <Text tone="secondary" className="mt-xs">
                    {item.text}
                  </Text>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* O QUE NOS ORIENTA — os cinco princípios em coluna central estreita: cada um é uma
          afirmação curta e, abaixo, o que o cliente pode esperar. Composição centralizada, sem
          cards, sem numeração e sem CTA (a página já tem o CTA final). */}
      {values.length > 0 ? (
        <Section
          tone="dark"
          spacing="loose"
          className="border-t-[3px] border-ouro"
          aria-labelledby="valores"
        >
          <Container>
            <div className="mx-auto max-w-[40rem] text-center">
              <Heading
                as="h2"
                variant="display-m"
                id="valores"
                className="scroll-mt-24 text-balance"
              >
                {data.valuesIntro.title}
              </Heading>
              <Text tone="secondary" className="mx-auto mt-md max-w-[30rem]">
                {data.valuesIntro.text}
              </Text>
              <ul className="mt-3xl space-y-2xl">
                {values.map((value) => (
                  <li key={value.name}>
                    <span aria-hidden="true" className="mx-auto mb-md block h-0.5 w-10 bg-ouro" />
                    <Heading as="h3" variant="h3" className="text-balance">
                      {value.name}
                    </Heading>
                    {value.practice ? (
                      <Text tone="secondary" className="mx-auto mt-xs max-w-[32rem]">
                        {value.practice}
                      </Text>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </Container>
        </Section>
      ) : null}

      {/* QUEM ESTÁ POR TRÁS — composição tipográfica: não há foto nem biografia no projeto, então
          o nome é o elemento principal e só entram fatos confirmados (fundador, condução do
          trabalho, autoria do livro). Sem card, avatar nem links para páginas provisórias. */}
      <Section spacing="loose" aria-labelledby="quem-esta-por-tras">
        <Container>
          <SectionLabel>{data.founder.label}</SectionLabel>
          <div className="mt-xl grid gap-xl lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-3xl">
            <Heading
              as="h2"
              variant="display-l"
              id="quem-esta-por-tras"
              className="scroll-mt-40 max-w-[12ch] text-balance"
            >
              {data.founder.name}
            </Heading>
            <div className="max-w-reading lg:border-l lg:border-border-strong lg:pl-xl">
              <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                {data.founder.role}
              </p>
              <div className="mt-md">
                <Paragraphs items={data.founder.text} />
              </div>
              <p className="mt-xl font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                {data.founder.bookLabel}
              </p>
              <p className="mt-2xs font-serif text-h4 leading-snug font-medium text-text">
                <em>{data.founder.bookTitle}</em>
              </p>
            </div>
          </div>
        </Container>
      </Section>

      {/* CTA FINAL — fecha a narrativa: título à esquerda, texto e uma única ação à direita.
          Fundo claro e composição assimétrica (o CTA de /solucoes é uma faixa bege alinhada à
          esquerda). Destino real: /contato, formulário de mensagem. */}
      <Section tone="muted" spacing="loose" aria-labelledby="cta-sobre">
        <Container>
          <div className="grid gap-xl border-t border-border-strong pt-lg lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-end lg:gap-3xl">
            <div>
              <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
                {data.cta.eyebrow}
              </p>
              <Heading
                as="h2"
                variant="display-m"
                id="cta-sobre"
                className="mt-md max-w-[18ch] text-balance"
              >
                {data.cta.title}
              </Heading>
            </div>
            <div>
              <Text tone="secondary" className="max-w-[28rem]">
                {data.cta.text}
              </Text>
              <div className="mt-lg">
                <Button href="/contato" size="lg" className="w-full sm:w-auto">
                  {data.cta.label}
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
