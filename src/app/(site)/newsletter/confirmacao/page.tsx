import { Metadata } from "next";
import { Suspense } from "react";
import { Container, Section, Heading, Text, TextLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Confirmação de newsletter — DM Empresarial",
  description: "Confirmação de inscrição na newsletter DM Empresarial.",
};

const messages = {
  sucesso: {
    title: "Inscrição confirmada!",
    text: "Seu e-mail foi confirmado com sucesso. Você passará a receber nossas atualizações.",
  },
  erro: {
    title: "Não foi possível confirmar",
    text: "O link de confirmação é inválido, expirou ou já foi usado. Tente se inscrever novamente.",
  },
  invalido: {
    title: "Link inválido",
    text: "Este link de confirmação não é válido. Verifique se copiou o endereço completo do e-mail.",
  },
} as const;

type Status = keyof typeof messages;

async function NewsletterConfirmacaoContent({
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

export default function NewsletterConfirmacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <NewsletterConfirmacaoContent searchParams={searchParams} />
    </Suspense>
  );
}
