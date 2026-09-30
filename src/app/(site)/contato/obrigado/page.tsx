import type { Metadata } from "next";
import { Button, Container, Heading, Section, Text } from "@/components/ui";
import { CheckCircleIcon } from "@/components/ui/icons";
import { WHATSAPP_URL } from "@/content/dm";

// Página de confirmação (medição de conversão, docs/01 §05): não é conteúdo, não entra no índice.
export const metadata: Metadata = {
  title: "Obrigado pelo contato",
  robots: { index: false, follow: false },
};

export default function ObrigadoPage() {
  return (
    <Section spacing="loose">
      <Container>
        <div className="mx-auto max-w-[36rem] rounded-[28px] border border-border bg-surface-muted px-lg py-2xl text-center md:px-2xl md:py-3xl">
          <CheckCircleIcon aria-hidden="true" className="mx-auto size-12 text-success" />
          <Heading as="h1" variant="h1" className="mt-md">
            Mensagem recebida.
          </Heading>
          <Text size="lg" tone="secondary" className="mt-md">
            Obrigado por escrever para a DM Empresarial. Sua mensagem foi registrada e um
            responsável pode retornar pelos dados que você informou.
          </Text>
          <div className="mt-xl flex flex-col items-center justify-center gap-md sm:flex-row">
            <Button href="/">Voltar ao site</Button>
            <Button href={WHATSAPP_URL} variant="secondary">
              Prefere continuar pelo WhatsApp?
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
