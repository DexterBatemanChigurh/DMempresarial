import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { getPublicSolutionBySlugForRoute } from "@/features/catalog/application/public-solutions";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` (dado de requisição). O conteúdo é cacheado por
// `use cache`/`cacheTag` nas leituras públicas; `instant = false` desativa a validação de
// static shell (os dados vêm do banco a cada requisição, com cache e revalidação por tag).
export const instant = false;

const KIND_LABEL = {
  SITUATION: "Problemas atendidos",
  STEP: "Processo",
  GOAL: "Objetivos e benefícios",
} as const;

const TYPE_LABEL = {
  CONSULTORIA: "Consultoria",
  SERVICO: "Serviço",
} as const;

// `KIND_LABEL` documenta o mapeamento de `items.kind` para os rótulos das seções. As seções são
// renderizadas por filtro (`situations`, `steps`, `goals`) com títulos fixos, então o rótulo por
// item não é usado diretamente — mantido para referência de leitura do modelo de dados.
void KIND_LABEL;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const solution = await getPublicSolutionBySlugForRoute(slug);
  if (!solution) return { title: "Solução não encontrada" };
  return {
    title: solution.seoTitle ?? solution.title,
    description: solution.seoDescription ?? solution.summary,
  };
}

export default async function SolutionDetailPage({ params }: Params) {
  const { slug } = await params;
  const solution = await getPublicSolutionBySlugForRoute(slug);
  if (!solution) notFound();

  const situations = solution.items.filter((i) => i.kind === "SITUATION");
  const steps = solution.items.filter((i) => i.kind === "STEP");
  const goals = solution.items.filter((i) => i.kind === "GOAL");

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>{TYPE_LABEL[solution.type]}</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            {solution.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {solution.summary}
          </Text>
          <div className="mt-xl">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
          </div>
        </Container>
      </Section>

      <Section tone="muted" spacing="loose" aria-labelledby="contexto-titulo">
        <Container>
          <SectionLabel>Contexto</SectionLabel>
          <Heading as="h2" variant="h2" id="contexto-titulo" className="mt-md">
            O que está acontecendo
          </Heading>
          <div className="mt-lg max-w-reading">
            <RichText value={solution.context} />
          </div>
        </Container>
      </Section>

      {situations.length > 0 ? (
        <Section spacing="loose" aria-labelledby="situacoes-titulo">
          <Container>
            <SectionLabel>Problemas atendidos</SectionLabel>
            <Heading as="h2" variant="h2" id="situacoes-titulo" className="mt-md">
              Em quais situações isso se aplica
            </Heading>
            <ul className="mt-lg space-y-md">
              {situations.map((item) => (
                <li key={`${item.kind}-${item.position}`} className="max-w-reading">
                  <Heading as="h3" variant="h4">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <div className="mt-xs">
                      <RichText value={item.body} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section tone="muted" spacing="loose" aria-labelledby="abordagem-titulo">
        <Container>
          <SectionLabel>Abordagem</SectionLabel>
          <Heading as="h2" variant="h2" id="abordagem-titulo" className="mt-md">
            Como a DM atua
          </Heading>
          <div className="mt-lg max-w-reading">
            <RichText value={solution.approach} />
          </div>
        </Container>
      </Section>

      {steps.length > 0 ? (
        <Section spacing="loose" aria-labelledby="processo-titulo">
          <Container>
            <SectionLabel>Processo</SectionLabel>
            <Heading as="h2" variant="h2" id="processo-titulo" className="mt-md">
              Etapas
            </Heading>
            <ol className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
              {steps.map((item, index) => (
                <li key={`${item.kind}-${item.position}`} className="border-t border-border pt-lg">
                  <p
                    aria-hidden="true"
                    className="font-serif text-display-m font-normal text-text-secondary"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <Heading as="h3" variant="h3" className="mt-sm">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <div className="mt-xs">
                      <RichText value={item.body} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          </Container>
        </Section>
      ) : null}

      {goals.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="objetivos-titulo">
          <Container>
            <SectionLabel>Objetivos e benefícios</SectionLabel>
            <Heading as="h2" variant="h2" id="objetivos-titulo" className="mt-md">
              Onde se quer chegar
            </Heading>
            <ul className="mt-lg space-y-md">
              {goals.map((item) => (
                <li key={`${item.kind}-${item.position}`} className="max-w-reading">
                  <Heading as="h3" variant="h4">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <div className="mt-xs">
                      <RichText value={item.body} />
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      <Section spacing="loose" aria-labelledby="cta-solucao">
        <Container>
          <Heading as="h2" variant="h2" id="cta-solucao">
            Vamos conversar sobre o seu caso
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Conte o contexto da sua empresa e a DM explica como pode atuar nesta solução.
          </Text>
          <div className="mt-xl flex flex-wrap gap-md">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
            <Button href="/solucoes" variant="secondary" size="lg">
              Ver todas as soluções
            </Button>
          </div>
          <Text size="sm" tone="secondary" className="mt-lg">
            <Link href="/solucoes" className="text-link underline underline-offset-4">
              ← Voltar para Soluções
            </Link>
          </Text>
        </Container>
      </Section>
    </>
  );
}
