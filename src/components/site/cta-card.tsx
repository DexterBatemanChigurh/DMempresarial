import { Button, Container, Heading, Section, Text } from "@/components/ui";
import { cn } from "@/lib/cn";

type CtaAction = { href: string; label: string };

/**
 * CTA de fim de página, igual em todo o site: cartão claro, título, texto e até duas ações.
 * No celular os botões ocupam a largura toda (alvos grandes, sem larguras desencontradas).
 * `emphasis` pinta o cartão no azul da marca (tom "brand" em globals.css): usado na Home, onde a
 * chamada final fecha a página.
 */
export function CtaCard({
  id,
  title,
  text,
  primary,
  secondary,
  emphasis = false,
}: {
  id: string;
  title: string;
  text: string;
  primary: CtaAction;
  secondary?: CtaAction;
  emphasis?: boolean;
}) {
  return (
    <Section
      // Com destaque, a seção anterior já dá o respiro de cima: só o de baixo fica largo.
      spacing={emphasis ? "none" : "loose"}
      className={emphasis ? "pt-xl pb-4xl md:pt-2xl md:pb-5xl" : undefined}
      aria-labelledby={id}
    >
      <Container>
        <div
          data-tone={emphasis ? "brand" : undefined}
          className={cn(
            "rounded-[28px] px-lg py-2xl text-center md:px-2xl md:py-3xl",
            emphasis ? "bg-surface" : "border border-border bg-surface-muted",
          )}
        >
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
