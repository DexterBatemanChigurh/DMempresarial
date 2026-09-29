import { Button, Container, Heading, Section, Text } from "@/components/ui";

type CtaAction = { href: string; label: string };

/**
 * CTA de fim de página, igual em todo o site: cartão claro, título, texto e até duas ações.
 * No celular os botões ocupam a largura toda (alvos grandes, sem larguras desencontradas).
 */
export function CtaCard({
  id,
  title,
  text,
  primary,
  secondary,
}: {
  id: string;
  title: string;
  text: string;
  primary: CtaAction;
  secondary?: CtaAction;
}) {
  return (
    <Section spacing="loose" aria-labelledby={id}>
      <Container>
        <div className="rounded-[28px] border border-border bg-surface-muted px-lg py-2xl text-center md:px-2xl md:py-3xl">
          <Heading as="h2" variant="h2" id={id} className="mx-auto max-w-[36rem] text-balance">
            {title}
          </Heading>
          <Text tone="secondary" className="mx-auto mt-md max-w-reading">
            {text}
          </Text>
          <div className="mt-xl flex flex-col items-stretch justify-center gap-md sm:flex-row sm:items-center">
            <Button href={primary.href}>{primary.label}</Button>
            {secondary ? (
              <Button href={secondary.href} variant="secondary">
                {secondary.label}
              </Button>
            ) : null}
          </div>
        </div>
      </Container>
    </Section>
  );
}
