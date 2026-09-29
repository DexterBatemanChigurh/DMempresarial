import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Paragraphs } from "@/components/content/paragraphs";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { findSolution } from "@/content/dm";
import { JsonLd, publicMetadata } from "@/components/site/seo";
import { env } from "@/server/env";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` (dado de requisição). O conteúdo é cacheado por
// `use cache`/`cacheTag` nas leituras públicas; `instant = false` desativa a validação de
// static shell (os dados vêm do banco a cada requisição, com cache e revalidação por tag).
export const instant = false;

const TYPE_LABEL = {
  CONSULTORIA: "Consultoria",
  SERVICO: "Serviço",
} as const;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const solution = findSolution(slug);
  if (!solution) return { title: "Solução não encontrada" };
  return publicMetadata({
    title: solution.title,
    description: solution.summary,
    path: `/solucoes/${solution.slug}`,
  });
}

export default async function SolutionDetailPage({ params }: Params) {
  const { slug } = await params;
  const solution = findSolution(slug);
  if (!solution) notFound();

  const { situations, steps, goals } = solution;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: solution.title,
          description: solution.summary,
          url: `${env().SITE_URL}/solucoes/${solution.slug}`,
          provider: { "@type": "Organization", name: "DM Empresarial" },
          serviceType: TYPE_LABEL[solution.type],
          areaServed: "Frutal e região, MG",
        }}
      />

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
            <Paragraphs items={solution.context} />
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
                <li key={item.title} className="max-w-reading">
                  <Heading as="h3" variant="h4">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <Text tone="secondary" className="mt-xs">
                      {item.body}
                    </Text>
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
            <Paragraphs items={solution.approach} />
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
                <li key={item.title} className="border-t border-border pt-lg">
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
                    <Text tone="secondary" className="mt-xs">
                      {item.body}
                    </Text>
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
                <li key={item.title} className="max-w-reading">
                  <Heading as="h3" variant="h4">
                    {item.title}
                  </Heading>
                  {item.body ? (
                    <Text tone="secondary" className="mt-xs">
                      {item.body}
                    </Text>
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
