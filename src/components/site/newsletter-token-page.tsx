import { Suspense } from "react";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";

/**
 * Páginas de confirmação e de descadastro da newsletter. Com `?token=` mostram o botão que
 * dispara a ação (POST): o link do e-mail sozinho nunca muda estado. Com `?status=` mostram o
 * resultado.
 */
type Kind = "confirm" | "unsubscribe";

const COPY = {
  confirm: {
    label: "Newsletter",
    ask: {
      title: "Confirme sua inscrição",
      text: "Falta um passo: confirme para começar a receber os conteúdos da DM.",
      button: "Confirmar inscrição",
    },
    sucesso: {
      title: "Inscrição confirmada",
      text: "Pronto. Você passa a receber os conteúdos da DM neste e-mail.",
    },
    erro: {
      title: "Não foi possível confirmar",
      text: "O link é inválido, expirou ou já foi usado. Se quiser, faça a inscrição de novo.",
    },
    invalido: {
      title: "Link incompleto",
      text: "Confira se o endereço do e-mail foi copiado inteiro.",
    },
  },
  unsubscribe: {
    label: "Newsletter",
    ask: {
      title: "Cancelar inscrição",
      text: "Confirme para deixar de receber os e-mails da DM neste endereço.",
      button: "Cancelar inscrição",
    },
    sucesso: {
      title: "Inscrição cancelada",
      text: "Você não recebe mais e-mails da DM neste endereço.",
    },
    erro: {
      title: "Não foi possível cancelar",
      text: "O link é inválido ou a inscrição já estava cancelada.",
    },
    invalido: {
      title: "Link incompleto",
      text: "Confira se o endereço do e-mail foi copiado inteiro.",
    },
  },
} as const;

type Params = Promise<{ token?: string; status?: string }>;

async function Content({
  kind,
  searchParams,
  action,
}: {
  kind: Kind;
  searchParams: Params;
  action: (formData: FormData) => Promise<void>;
}) {
  const { token, status } = await searchParams;
  const copy = COPY[kind];

  if (token && !status) {
    return (
      <>
        <Heading as="h1" variant="display-m" className="mt-md">
          {copy.ask.title}
        </Heading>
        <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
          {copy.ask.text}
        </Text>
        <form action={action} className="mt-xl">
          <input type="hidden" name="token" value={token} />
          <Button type="submit" size="lg">
            {copy.ask.button}
          </Button>
        </form>
      </>
    );
  }

  const msg =
    status === "sucesso" ? copy.sucesso : status === "invalido" ? copy.invalido : copy.erro;
  return (
    <>
      <Heading as="h1" variant="display-m" className="mt-md">
        {msg.title}
      </Heading>
      <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
        {msg.text}
      </Text>
      <div className="mt-xl flex flex-wrap gap-md">
        <Button href="/blog" size="lg">
          Ler o blog
        </Button>
        <Button href="/" variant="secondary" size="lg">
          Voltar para a Home
        </Button>
      </div>
    </>
  );
}

export function NewsletterTokenPage({
  kind,
  searchParams,
  action,
}: {
  kind: Kind;
  searchParams: Params;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <Section spacing="loose">
      <Container>
        <SectionLabel>{COPY[kind].label}</SectionLabel>
        <Suspense fallback={<Text className="mt-md">Carregando…</Text>}>
          <Content kind={kind} searchParams={searchParams} action={action} />
        </Suspense>
      </Container>
    </Section>
  );
}
