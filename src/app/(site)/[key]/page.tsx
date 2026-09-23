import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";

// Rotas estáticas (`/sobre`, `/contato`, `/solucoes`, `/blog`) resolvem antes desta rota
// dinâmica, então ela só atende chaves que não têm rota própria — páginas legais
// (`privacy`, `terms`) e quaisquer outras que a DM criar pelo painel.
export const instant = false;

type Params = { params: Promise<{ key: string }> };

const RESERVED = new Set(["sobre", "contato", "solucoes", "blog", "admin", "api"]);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { key } = await params;
  if (RESERVED.has(key)) return { title: "Página não encontrada" };
  const page = await getPublishedPageForRoute(key);
  if (!page) return { title: "Página não encontrada" };
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function InstitutionalPage({ params }: Params) {
  const { key } = await params;
  if (RESERVED.has(key)) notFound();

  const page = await getPublishedPageForRoute(key);
  if (!page) notFound();

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
