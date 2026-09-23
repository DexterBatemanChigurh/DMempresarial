import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Container, Heading, Section, Text } from "@/components/ui";
import { env } from "@/server/env";
import { EditorDemo } from "./editor-demo";

// Demonstração do editor de texto rico. Só existe fora de produção e nunca é indexada.
// Usa `await connection()` por requisição; com Cache Components isso bloqueia o static shell —
// é intencional (`instant = false`).
export const instant = false;
export const metadata: Metadata = { title: "Editor", robots: { index: false, follow: false } };

export default async function EditorDemoPage() {
  await connection();
  if (env().APP_ENV === "production") notFound();

  return (
    <Section>
      <Container size="wide">
        <Heading as="h1" variant="display-m">
          Editor de texto rico
        </Heading>
        <Text tone="secondary" className="mt-md mb-2xl max-w-reading">
          O editor só produz o que a lista de permissão aceita. Ao lado, o resultado da validação do
          servidor e a pré-visualização do texto publicado.
        </Text>
        <EditorDemo />
      </Container>
    </Section>
  );
}
