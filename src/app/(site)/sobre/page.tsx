import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { listPublicSpecialistsForRoute } from "@/features/people/application/public-specialists";
import { aboutDataSchema } from "@/features/pages/domain/page-schemas";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Sobre",
  description:
    "Conheça a DM Empresarial: quem somos, como pensamos, como trabalhamos e quem faz parte da equipe.",
  path: "/sobre",
});

function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export default async function AboutPage() {
  const [page, specialists] = await Promise.all([
    getPublishedPageForRoute("about"),
    listPublicSpecialistsForRoute(),
  ]);

  const parsed = page ? aboutDataSchema.safeParse(page.data) : null;
  const data = parsed?.success ? parsed.data : null;
  const values = data?.values ?? [];

  return (
    <>
      <Section spacing="loose">
        <Container>
          <SectionLabel>Sobre</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md">
            {page?.title ?? "DM Empresarial"}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            Consultoria empresarial em Frutal/MG. Método, acompanhamento e gente de verdade por trás
            de cada decisão.
          </Text>
        </Container>
      </Section>

      {data?.whoWeAre ? (
        <Section tone="muted" spacing="loose" aria-labelledby="quem-somos">
          <Container>
            <SectionLabel>Quem somos</SectionLabel>
            <Heading as="h2" variant="h2" id="quem-somos" className="mt-md">
              Quem somos
            </Heading>
            <div className="mt-lg max-w-reading">
              <RichText value={data.whoWeAre} />
            </div>
          </Container>
        </Section>
      ) : null}

      {data?.howWeThink ? (
        <Section spacing="loose" aria-labelledby="como-pensamos">
          <Container>
            <SectionLabel>Como pensamos</SectionLabel>
            <Heading as="h2" variant="h2" id="como-pensamos" className="mt-md">
              Como pensamos
            </Heading>
            <div className="mt-lg max-w-reading">
              <RichText value={data.howWeThink} />
            </div>
          </Container>
        </Section>
      ) : null}

      {data?.howWeWork ? (
        <Section tone="muted" spacing="loose" aria-labelledby="como-trabalhamos">
          <Container>
            <SectionLabel>Como trabalhamos</SectionLabel>
            <Heading as="h2" variant="h2" id="como-trabalhamos" className="mt-md">
              Como trabalhamos
            </Heading>
            <div className="mt-lg max-w-reading">
              <RichText value={data.howWeWork} />
            </div>
          </Container>
        </Section>
      ) : null}

      {values.length > 0 ? (
        <Section spacing="loose" aria-labelledby="valores">
          <Container>
            <SectionLabel>Valores</SectionLabel>
            <Heading as="h2" variant="h2" id="valores" className="mt-md">
              O que nos orienta
            </Heading>
            <ul className="mt-xl grid grid-cols-1 gap-xl sm:grid-cols-2 lg:grid-cols-3">
              {values.map((value) => (
                <li key={value.name} className="border-t border-border pt-lg">
                  <Heading as="h3" variant="h3">
                    {value.name}
                  </Heading>
                  <Text tone="secondary" className="mt-sm">
                    {value.practice}
                  </Text>
                </li>
              ))}
            </ul>
          </Container>
        </Section>
      ) : null}

      {specialists.length > 0 ? (
        <Section tone="muted" spacing="loose" aria-labelledby="especialistas">
          <Container>
            <SectionLabel>Especialistas</SectionLabel>
            <Heading as="h2" variant="h2" id="especialistas" className="mt-md">
              Quem está por trás
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
                    {person.summary ? (
                      <Text tone="secondary" className="mt-sm">
                        {person.summary}
                      </Text>
                    ) : null}
                    <Text as="span" size="sm" className="mt-sm inline-block text-link">
                      Conheça o especialista →
                    </Text>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-2xl">
              <Button href="/sobre/especialistas" variant="secondary">
                Ver todos os especialistas
              </Button>
            </div>
          </Container>
        </Section>
      ) : null}

      <Section spacing="loose" aria-labelledby="cta-sobre">
        <Container>
          <Heading as="h2" variant="h2" id="cta-sobre">
            Quer conversar com a gente?
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Conte o contexto da sua empresa e a DM explica como pode ajudar.
          </Text>
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
