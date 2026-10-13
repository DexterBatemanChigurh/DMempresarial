import { cn } from "@/lib/cn";
import { Container, Heading, Section, SectionLabel } from "@/components/ui";
import { CLIENTS } from "@/content/dm";

/**
 * Seção "Nossos clientes" — fundo escuro, grid de logos.
 * Inspirada no layout de grade de clientes da Sequoia Estratégia (sequoiaestrategia.com.br).
 *
 * • Com logo (ClientItem.logo preenchido): exibe a imagem invertida para branco no fundo dark.
 * • Sem logo (logo: null): exibe o nome da empresa em texto tipográfico.
 *
 * Para remover a seção: esvazie CLIENTS.items em src/content/dm.ts.
 * Para adicionar logos: coloque SVG/PNG em public/clients/ e preencha o campo logo de cada item.
 */
export function ClientsGrid() {
  if (CLIENTS.items.length === 0) return null;

  return (
    <Section tone="default" spacing="loose" aria-labelledby="home-clientes">
      <Container>
        <SectionLabel>{CLIENTS.label}</SectionLabel>
        <Heading as="h2" variant="h2" id="home-clientes" className="mt-md">
          {CLIENTS.heading}
        </Heading>

        <ul
          className={cn("mt-3xl grid grid-cols-2", "sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6")}
        >
          {CLIENTS.items.map((client) => (
            <li
              key={client.name}
              className="flex min-h-[88px] items-center justify-center px-md py-lg"
            >
              {client.logo ? (
                // Imagem de logo: invertida para branco no fundo escuro.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.logo}
                  alt={client.name}
                  width={120}
                  height={44}
                  loading="lazy"
                  className="max-h-14 w-auto object-contain transition-opacity duration-200 hover:opacity-80"
                />
              ) : (
                <span className="px-xs text-center font-serif text-body-sm font-semibold leading-tight text-text-secondary transition-colors duration-200 hover:text-text">
                  {client.name}
                </span>
              )}
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
