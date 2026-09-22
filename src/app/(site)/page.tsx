import { Container, Heading, Section, Text } from "@/components/ui";

// Página provisória da fundação. Será substituída pela Home (fase de páginas públicas), que
// segue o Product Blueprint. Só dados confirmados da DM: nome, ramo e cidade.
export default function HomePage() {
  return (
    <Section spacing="loose">
      <Container>
        <Heading as="h1" variant="display-l">
          DM Empresarial
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg">
          Consultoria empresarial • Frutal/MG
        </Text>
      </Container>
    </Section>
  );
}
