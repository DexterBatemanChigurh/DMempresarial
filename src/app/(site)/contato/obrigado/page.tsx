import type { Metadata } from "next";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

// Página de confirmação (medição de conversão, docs/01 §05): não é conteúdo, não entra no índice.
export const metadata: Metadata = {
  title: "Obrigado pelo contato",
  robots: { index: false, follow: false },
};

export default function ObrigadoPage() {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Contato</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          Obrigado pelo contato
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          Sua mensagem foi recebida. A equipe da DM Empresarial vai ler o seu contexto e responder
          pelo contato que você informou.
        </Text>
        <div className="mt-xl flex flex-wrap gap-md">
          <Button href="/blog" variant="secondary" size="lg">
            Ler o blog
          </Button>
          <Button href="/" variant="tertiary" size="lg">
            Voltar para a Home
          </Button>
        </div>
      </Container>
    </Section>
  );
}
