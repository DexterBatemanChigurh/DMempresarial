import type { Metadata } from "next";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { publicMetadata } from "@/components/site/seo";
import { TestimonialList } from "@/components/site/testimonial-list";
import { listPublicTestimonialsForRoute } from "@/features/proof/application/public-proof";

export const metadata: Metadata = publicMetadata({
  title: "Depoimentos",
  description: "O que clientes da DM Empresarial dizem sobre o trabalho da consultoria.",
  path: "/depoimentos",
});

export default async function TestimonialsPage() {
  const testimonials = await listPublicTestimonialsForRoute();

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Depoimentos</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            O que dizem os clientes
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {testimonials.length > 0
              ? "Palavras de quem trabalhou com a DM, com a origem de cada uma."
              : "Os depoimentos de clientes aparecem aqui assim que forem publicados."}
          </Text>
        </Container>
      </Section>

      {testimonials.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-label="Depoimentos">
          <Container>
            <TestimonialList items={testimonials} />
          </Container>
        </Section>
      ) : null}

      <Section spacing="loose" aria-labelledby="cta-depoimentos">
        <Container>
          <Heading as="h2" variant="h2" id="cta-depoimentos">
            Vamos conversar sobre a sua empresa
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Conte o contexto da sua empresa e a DM explica como pode ajudar.
          </Text>
          <div className="mt-xl">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
