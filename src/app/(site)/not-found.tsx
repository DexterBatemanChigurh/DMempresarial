import type { Metadata } from "next";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

// Renderiza dentro do layout do grupo `(site)`, então mantém cabeçalho e rodapé.
// Serve tanto para `notFound()` lançado nas páginas quanto para URLs sem rota.
export default function NotFound() {
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
        <div className="mt-xl flex flex-wrap gap-md">
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
