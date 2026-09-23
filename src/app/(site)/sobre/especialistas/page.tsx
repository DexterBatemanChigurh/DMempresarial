import type { Metadata } from "next";
import Link from "next/link";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { listPublicSpecialistsForRoute } from "@/features/people/application/public-specialists";

// Rota própria do diretório (docs/01 §05, separada de /sobre) — grade de retratos.
export const metadata: Metadata = {
  title: "Especialistas",
  description: "Conheça a equipe da DM Empresarial.",
};

function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export default async function SpecialistsDirectoryPage() {
  const specialists = await listPublicSpecialistsForRoute();

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Sobre</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            Especialistas
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            As pessoas por trás do trabalho da DM.
          </Text>
        </Container>
      </Section>

      {specialists.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="diretorio">
          <Container>
            <SectionLabel>Diretório</SectionLabel>
            <Heading as="h2" variant="h2" id="diretorio" className="sr-only">
              Diretório de especialistas
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-2xl sm:grid-cols-2 lg:grid-cols-3">
              {specialists.map((person) => (
                <li key={person.slug}>
                  <Link
                    href={`/sobre/especialistas/${person.slug}`}
                    className="group block focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
                  >
                    <div className="aspect-[4/5] w-full overflow-hidden bg-surface-muted">
                      {person.photoStorageKey ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={mediaUrl(person.photoStorageKey)}
                          alt={`Foto de ${person.name}`}
                          width={800}
                          height={1000}
                          loading="lazy"
                          decoding="async"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="flex h-full w-full items-center justify-center"
                        >
                          <span className="font-serif text-display-m text-text-secondary">
                            {person.name
                              .split(" ")
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join("")}
                          </span>
                        </div>
                      )}
                    </div>
                    <Heading
                      as="h3"
                      variant="h3"
                      className="mt-md text-link group-hover:underline group-focus-visible:underline"
                    >
                      {person.name}
                    </Heading>
                    <Text size="sm" tone="secondary" className="mt-xs">
                      {person.roleTitle}
                    </Text>
                  </Link>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : (
        <Section tone="muted" spacing="loose">
          <Container>
            <Text tone="secondary">Nenhum especialista publicado ainda.</Text>
          </Container>
        </Section>
      )}
    </>
  );
}
