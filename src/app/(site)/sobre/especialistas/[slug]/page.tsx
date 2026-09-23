import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { getPublicSpecialistBySlugForRoute } from "@/features/people/application/public-specialists";
import { publicMetadata } from "@/components/site/seo";

type Params = { params: Promise<{ slug: string }> };

// Rota dinâmica que lê `params` (dado de requisição); `instant = false` como em `/solucoes/[slug]`.
export const instant = false;

function mediaUrl(storageKey: string): string {
  return `/media/${storageKey}`;
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const person = await getPublicSpecialistBySlugForRoute(slug);
  if (!person) return { title: "Especialista não encontrado" };
  return publicMetadata({
    title: person.seoTitle ?? `${person.name} — ${person.roleTitle}`,
    description: person.seoDescription ?? person.summary ?? undefined,
    path: `/sobre/especialistas/${person.slug}`,
  });
}

export default async function SpecialistProfilePage({ params }: Params) {
  const { slug } = await params;
  const person = await getPublicSpecialistBySlugForRoute(slug);
  if (!person) notFound();

  return (
    <>
      <Section spacing="loose">
        <Container>
          <div className="grid grid-cols-1 gap-2xl lg:grid-cols-12">
            <div className="lg:col-span-5">
              <div className="aspect-[4/5] w-full overflow-hidden bg-surface-muted">
                {person.photoStorageKey ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={mediaUrl(person.photoStorageKey)}
                    alt={`Foto de ${person.name}`}
                    width={800}
                    height={1000}
                    loading="eager"
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    aria-hidden="true"
                    className="flex h-full w-full items-center justify-center"
                  >
                    <span className="font-serif text-display-l text-text-secondary">
                      {person.name
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="lg:col-span-7">
              <SectionLabel>Especialista</SectionLabel>
              <Heading as="h1" variant="display-l" className="mt-md">
                {person.name}
              </Heading>
              <Text size="lg" tone="secondary" className="mt-sm">
                {person.roleTitle}
              </Text>
              {person.summary ? (
                <Text size="lg" className="mt-lg max-w-reading">
                  {person.summary}
                </Text>
              ) : null}
              <div className="mt-xl">
                <Button href="/contato" size="lg">
                  Fale com a DM
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>

      {person.bio ? (
        <Section tone="muted" spacing="loose" aria-labelledby="biografia">
          <Container>
            <SectionLabel>Biografia</SectionLabel>
            <Heading as="h2" variant="h2" id="biografia" className="mt-md">
              Sobre {person.name.split(" ")[0]}
            </Heading>
            <div className="mt-lg max-w-reading">
              <RichText value={person.bio} />
            </div>
          </Container>
        </Section>
      ) : null}

      <Section spacing="loose" aria-labelledby="cta-perfil">
        <Container>
          <Heading as="h2" variant="h2" id="cta-perfil">
            Quer conversar com a DM?
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Conte o contexto da sua empresa e a DM explica como pode ajudar.
          </Text>
          <div className="mt-xl flex flex-wrap gap-md">
            <Button href="/contato" size="lg">
              Fale com a DM
            </Button>
            <Button href="/sobre" variant="secondary" size="lg">
              Conheça a equipe
            </Button>
          </div>
          <Text size="sm" tone="secondary" className="mt-lg">
            <Link href="/sobre" className="text-link underline underline-offset-4">
              ← Voltar para Sobre
            </Link>
          </Text>
        </Container>
      </Section>
    </>
  );
}
