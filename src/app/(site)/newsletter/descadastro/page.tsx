import { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section, Heading, Text, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Descadastro de newsletter — DM Empresarial",
  description: "Cancelamento de inscrição na newsletter DM Empresarial.",
};

const messages = {
  sucesso: {
    title: "Inscrição cancelada",
    text: "Você foi descadastrado da nossa newsletter. Não enviaremos mais e-mails para este endereço.",
  },
  erro: {
    title: "Não foi possível cancelar",
    text: "O link de descadastro é inválido ou expirou. Se quiser sair da lista, entre em contato conosco.",
  },
  invalido: {
    title: "Link inválido",
    text: "Este link de descadastro não é válido. Verifique se copiou o endereço completo do e-mail.",
  },
} as const;

type Status = keyof typeof messages;

async function NewsletterDescadastroContent({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status = "erro" } = await searchParams;
  const msg = messages[status as Status] ?? messages.erro;

  return (
    <Container size="narrow">
      <Section>
        <Heading as="h1">{msg.title}</Heading>
        <Text size="lg" tone="secondary" className="mt-md">
          {msg.text}
        </Text>
      </Section>
      <Section>
        <TextLink href="/">Voltar à home</TextLink>
      </Section>
    </Container>
  );
}

function LoadingFallback() {
  return (
    <Container size="narrow">
      <Section>
        <Text size="lg" tone="secondary">
          Carregando…
        </Text>
      </Section>
    </Container>
  );
}

export default function NewsletterDescadastroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewsletterDescadastroContent searchParams={searchParams} />
    </Suspense>
  );
}
