import { Button, Container, Section, SectionLabel } from "@/components/ui";
import { listPublicDepoimentosForRoute } from "@/features/proof/application/public-proof";

export const metadata = {
  title: "Depoimentos",
  description: "O que nossos clientes dizem sobre a DM Empresarial.",
};

export default async function ProofPage() {
  const depoimentos = await listPublicDepoimentosForRoute();

  if (depoimentos.length === 0) {
    return (
      <Section spacing="loose">
        <Container>
          <SectionLabel>Depoimentos</SectionLabel>
          <h1 className="font-serif text-display-l font-normal mt-md">Depoimentos</h1>
          <p className="mt-lg max-w-reading font-sans text-body text-text-secondary">
            Ainda não há depoimentos publicados. Em breve, clientes compartilharão suas
            experiências.
          </p>
        </Container>
      </Section>
    );
  }

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Depoimentos</SectionLabel>
          <h1 className="font-serif text-display-l font-normal mt-md">
            O que dizem nossos clientes
          </h1>
          <p className="mt-lg max-w-reading font-sans text-body text-text-secondary">
            Avaliações reais de clientes que confiaram na DM Empresarial para transformar seus
            negócios.
          </p>
        </Container>
      </Section>

      <Section tone="muted" spacing="loose" aria-labelledby="depoimentos-lista">
        <Container>
          <ul className="mt-xl grid grid-cols-1 gap-xl md:grid-cols-2 lg:grid-cols-3">
            {depoimentos.map((depoimento) => (
              <li
                key={depoimento.autor}
                className="border-t border-border pt-lg bg-surface-raised rounded-control p-lg"
              >
                <div className="flex gap-sm mb-sm">
                  {[...Array(depoimento.estrelas)].map((_, i) => (
                    <span key={i} aria-hidden="true">
                      ★
                    </span>
                  ))}
                </div>
                <blockquote className="font-serif text-article text-text italic">
                  &ldquo;{depoimento.texto}&rdquo;
                </blockquote>
                <footer className="mt-sm flex items-center gap-sm text-text-secondary">
                  <cite className="font-sans not-italic text-body-sm">{depoimento.autor}</cite>
                  {depoimento.data && (
                    <time dateTime={depoimento.data} className="text-caption text-text-muted">
                      {new Date(depoimento.data).toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </time>
                  )}
                </footer>
              </li>
            ))}
          </ul>
        </Container>
      </Section>

      <Section spacing="loose" aria-labelledby="cta-prova">
        <Container>
          <h2 className="font-serif text-h2 font-medium">Quer resultados como esses?</h2>
          <p className="mt-md max-w-reading font-sans text-body text-text-secondary">
            Conte o contexto da sua empresa e a DM explica como pode ajudar.
          </p>
          <div className="mt-xl">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
          </div>
        </Container>
      </Section>
    </>
  );
}
