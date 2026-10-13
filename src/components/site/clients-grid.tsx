import { Container, Heading, Section, SectionLabel } from "@/components/ui";
import { CLIENTS } from "@/content/dm";

/**
 * Seção "Nossos clientes". As imagens em public/clients já vêm recortadas rente ao desenho;
 * a altura de cada logo dá a todos a mesma área visual (~9000 px² no desktop), então logos
 * largos ficam mais baixos e os quadrados mais altos. Ao trocar um logo, recalcule a altura:
 * h = min(100, sqrt(9000 / (largura / altura))), limitando a largura a 200 px.
 */
const LOGO_HEIGHTS: number[] = [
  51, 91, 70, 73, 96, 68, 52, 47, 95, 69, 100, 99, 95, 71, 50, 95, 66, 100, 83, 99,
];

export function ClientsGrid() {
  if (CLIENTS.items.length === 0) return null;

  return (
    <Section tone="default" spacing="loose" aria-labelledby="home-clientes">
      <Container>
        <SectionLabel>{CLIENTS.label}</SectionLabel>
        <Heading as="h2" variant="h2" id="home-clientes" className="mt-md">
          {CLIENTS.heading}
        </Heading>

        <ul className="mt-3xl grid [--logo-scale:0.6] sm:[--logo-scale:0.8] lg:[--logo-scale:1] grid-cols-3 gap-x-8 gap-y-10 sm:grid-cols-4 md:gap-x-12 md:gap-y-14 lg:grid-cols-5">
          {CLIENTS.items.map((client, i) => (
            <li key={client.name} className="flex items-center justify-center">
              {client.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={client.logo}
                  alt={client.name}
                  loading="lazy"
                  style={{ height: `calc(${LOGO_HEIGHTS[i] ?? 80}px * var(--logo-scale))` }}
                  className="w-auto max-w-full object-contain"
                />
              ) : (
                <span className="text-center font-display text-body-sm font-bold text-text-secondary transition-colors hover:text-text">
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
