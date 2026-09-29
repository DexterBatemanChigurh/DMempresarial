import { Paragraphs } from "@/components/content/paragraphs";
import { Container, Heading, Section, SectionLabel } from "@/components/ui";
import type { LegalDocument } from "@/content/dm";

/** Corpo das páginas legais (Política de Privacidade, Termos de Uso): texto em src/content/dm.ts. */
export function InstitutionalPage({ document }: { document: LegalDocument }) {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>Legal</SectionLabel>
        <Heading as="h1" variant="display-l" className="mt-md">
          {document.title}
        </Heading>
        <Paragraphs items={document.paragraphs} className="mt-xl max-w-reading" />
      </Container>
    </Section>
  );
}
