import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { listPublicSolutionsForRoute } from "@/features/catalog/application/public-solutions";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Soluções",
  description:
    "Consultoria e serviços da DM Empresarial para empresas que precisam de método e acompanhamento.",
  path: "/solucoes",
});

type Group = {
  label: string;
  items: { slug: string; title: string; summary: string; isFeatured: boolean }[];
};

const TYPE_LABEL = {
  CONSULTORIA: "Consultorias",
  SERVICO: "Serviços",
} as const;

export default async function SolutionsIndexPage() {
  const solutions = await listPublicSolutionsForRoute();

  const groups: Group[] = (["CONSULTORIA", "SERVICO"] as const)
    .map((type) => ({
      label: TYPE_LABEL[type],
      items: solutions
        .filter((s) => s.type === type)
        .map(({ slug, title, summary, isFeatured }) => ({ slug, title, summary, isFeatured })),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Soluções</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            O que fazemos
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            Consultoria e serviços descritos pelo problema que resolvem, pelo método que a DM aplica
            e pelo que se busca alcançar. Sem tabela de preços: cada conversa começa pelo contexto
            da sua empresa.
          </Text>

          {groups.length === 0 ? (
            <Text tone="secondary" className="mt-2xl">
              As soluções publicadas aparecem aqui, agrupadas por tipo.
            </Text>
          ) : (
            <div className="mt-3xl space-y-4xl">
              {groups.map((group) => (
                <section key={group.label} aria-labelledby={`grupo-${group.label}`}>
                  <SectionLabel>{group.label}</SectionLabel>
                  <Heading as="h2" variant="h2" id={`grupo-${group.label}`} className="mt-md">
                    {group.label}
                  </Heading>
                  <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2">
                    {group.items.map((item) => (
                      <li
                        key={item.slug}
                        className={
                          item.isFeatured
                            ? "border-t-2 border-border-strong pt-lg md:col-span-2"
                            : "border-t border-border pt-lg"
                        }
                      >
                        <Link
                          href={`/solucoes/${item.slug}`}
                          className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                        >
                          <Heading
                            as="h3"
                            variant={item.isFeatured ? "h2" : "h3"}
                            className="text-link group-hover:underline group-focus-visible:underline"
                          >
                            {item.title}
                          </Heading>
                          <Text tone="secondary" className="mt-sm max-w-reading">
                            {item.summary}
                          </Text>
                          <Text
                            as="span"
                            size="sm"
                            tone="secondary"
                            className="mt-md inline-block text-link"
                          >
                            Conheça a solução →
                          </Text>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}

          <div className="mt-3xl">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
