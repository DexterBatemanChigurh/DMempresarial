import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

export const metadata: Metadata = {
  title: "Obrigado pelo contato",
  description:
    "Sua mensagem foi recebida com sucesso. A DM Empresarial entrará em contato em breve.",
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
          Sua mensagem foi recebida com sucesso. A equipe da DM Empresarial analisará seu contato e
          retornará o mais breve possível.
        </Text>
        <div className="mt-xl flex flex-wrap gap-md">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-xs rounded-control font-sans font-semibold transition-colors duration-150 ease-standard h-14 px-xl text-base bg-action text-action-contrast hover:bg-action-hover disabled:bg-surface-disabled disabled:text-text-disabled"
          >
            Voltar para a Home
          </Link>
          <Link
            href="/contato"
            className="inline-flex items-center justify-center gap-xs rounded-control font-sans font-semibold transition-colors duration-150 ease-standard h-14 px-xl text-base border-[1.5px] border-text text-text hover:bg-text/10 disabled:border-transparent disabled:bg-surface-disabled disabled:text-text-disabled"
          >
            Enviar outra mensagem
          </Link>
        </div>
      </Container>
    </Section>
  );
}
