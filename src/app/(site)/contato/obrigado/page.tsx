import type { Metadata } from "next";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { publicMetadata } from "@/components/site/seo";

// Confirmação de envio (docs/01 §05, medição de conversão). Não indexável: só existe depois de
// um envio real, e o formulário ainda não existe (Fase 7) — ninguém chega aqui organicamente.
export const metadata: Metadata = {
  ...publicMetadata({ title: "Mensagem enviada", path: "/contato/obrigado" }),
  robots: { index: false, follow: false },
};

export default function ContactThanksPage() {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Contato</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          Mensagem recebida
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          Obrigado por escrever para a DM Empresarial. Alguém da equipe entra em contato em breve.
        </Text>
        <div className="mt-xl">
          <Button href="/" size="lg">
            Voltar para a Home
          </Button>
        </div>
      </Container>
    </Section>
  );
}
