import type { Metadata } from "next";
import Link from "next/link";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { publicMetadata } from "@/components/site/seo";
import { listPublicSolutionsForRoute } from "@/features/catalog/application/public-solutions";

export const metadata: Metadata = publicMetadata({
  title: "Serviços",
  description: "Serviços da DM Empresarial para empresas de Frutal e região.",
  path: "/servicos",
});

/**
 * Serviços (Prompt 1 §5/§6): VISÃO FILTRADA das soluções do tipo Serviço (docs/01, decisão D1).
 * Cada serviço continua tendo uma única URL canônica, em `/solucoes/<slug>`; `/servicos/<slug>`
 * redireciona para lá (next.config.ts).
 */
export default async function ServicesPage() {
  const services = (await listPublicSolutionsForRoute()).filter((s) => s.type === "SERVICO");

  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Serviços</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          Serviços
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          Entregas com escopo definido. Para diagnóstico e acompanhamento contínuo, veja também as{" "}
          <Link href="/solucoes" className="text-link underline underline-offset-4">
            consultorias
          </Link>
          .
        </Text>

        {services.length === 0 ? (
          <Text tone="secondary" className="mt-2xl">
            Os serviços publicados aparecem aqui.
          </Text>
        ) : (
          <ul className="mt-3xl grid grid-cols-1 gap-xl md:grid-cols-2">
            {services.map((service) => (
              <li key={service.slug} className="border-t border-border pt-lg">
                <Link
                  href={`/solucoes/${service.slug}`}
                  className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                >
                  <Heading
                    as="h2"
                    variant="h3"
                    className="text-link group-hover:underline group-focus-visible:underline"
                  >
                    {service.title}
                  </Heading>
                  <Text tone="secondary" className="mt-sm max-w-reading">
                    {service.summary}
                  </Text>
                  <Text as="span" size="sm" className="mt-md inline-block text-link">
                    Conheça o serviço →
                  </Text>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3xl">
          <Button href="/contato" size="lg">
            Fale com a DM
          </Button>
        </div>
      </Container>
    </Section>
  );
}
