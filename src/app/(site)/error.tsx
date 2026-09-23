"use client";

import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

// Error boundary do grupo `(site)`: precisa ser Client Component. Não vaza detalhes internos
// para o visitante — em produção a mensagem original é genérica; o `digest` casa com o log do
// servidor (que já registrou o erro), e o projeto proíbe `console` fora de `src/server/logging`.
export default function SiteError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Erro</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          Algo deu errado
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          Não foi possível carregar esta página agora. Tente de novo em instantes.
        </Text>
        <div className="mt-xl flex flex-wrap gap-md">
          <Button onClick={() => retry()} size="lg">
            Tentar de novo
          </Button>
          <Button href="/" variant="secondary" size="lg">
            Ir para a Home
          </Button>
        </div>
        {error.digest ? (
          <Text size="caption" tone="muted" className="mt-lg">
            Código: {error.digest}
          </Text>
        ) : null}
      </Container>
    </Section>
  );
}
