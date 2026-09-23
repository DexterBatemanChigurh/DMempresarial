import { RichText } from "@/components/content/rich-text";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import type { PublicPage } from "@/features/pages/infrastructure/page-repository";

/** Corpo comum às páginas institucionais servidas por chave (LEGAL: só o campo `body`). */
export function InstitutionalPage({ page }: { page: PublicPage }) {
  const body =
    typeof page.data === "object" && page.data !== null && "body" in page.data
      ? (page.data as { body: unknown }).body
      : null;

  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Legal</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          {page.title}
        </Heading>
        {body ? (
          <div className="mt-xl max-w-reading">
            <RichText value={body} />
          </div>
        ) : (
          <Text tone="secondary" className="mt-lg max-w-reading">
            Este documento ainda não tem conteúdo publicado.
          </Text>
        )}
      </Container>
    </Section>
  );
}
