import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

/** Conteúdo da página 404 (usado dentro do grupo `(site)` e na 404 raiz). */
export function NotFoundContent() {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>404</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          Página não encontrada
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          O endereço que você abriu não existe ou o conteúdo foi removido.
        </Text>
        <div className="mt-xl flex flex-col gap-md sm:flex-row sm:flex-wrap">
          <Button href="/" size="lg">
            Ir para a Home
          </Button>
          <Button href="/solucoes" variant="secondary" size="lg">
            Ver soluções
          </Button>
          <Button href="/contato" variant="secondary" size="lg">
            Fale com a DM
          </Button>
        </div>
      </Container>
    </Section>
  );
}
