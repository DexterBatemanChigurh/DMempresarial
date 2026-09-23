import type { Metadata } from "next";
import { connection } from "next/server";
import { RichText } from "@/components/content/rich-text";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ContactForm } from "@/components/site/contact-form";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import { contactDataSchema } from "@/features/pages/domain/page-schemas";
import { publicMetadata } from "@/components/site/seo";
import { mintFormToken } from "@/server/security/form-token";
import { submitLeadAction } from "./actions";

export const metadata: Metadata = publicMetadata({
  title: "Contato",
  description: "Fale com a DM Empresarial. Endereço, canais e formulário de contato.",
  path: "/contato",
});

// `mintFormToken()` carrega o instante da requisição — precisa renderizar por requisição, não
// no build (mesmo motivo das rotas `[slug]`).
export const instant = false;

export default async function ContactPage() {
  // `mintFormToken()` usa `new Date()`: sem um ponto explícito de dado de requisição, o Next
  // tenta chamá-la no prerender estático do build, onde não existe "agora" de verdade.
  await connection();
  const [page, settings] = await Promise.all([
    getPublishedPageForRoute("contact"),
    getPublicSettingsForRoute(),
  ]);
  const formToken = mintFormToken();

  const parsed = page ? contactDataSchema.safeParse(page.data) : null;
  const intro = parsed?.success ? parsed.data.intro : null;

  const hasAddress = Boolean(settings?.address);
  const hasChannels = Boolean(settings?.phone || settings?.email || settings?.whatsapp);
  const mapQuery = settings?.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.address)}`
    : null;

  return (
    <>
      <Section spacing="loose">
        <Container>
          <div className="grid grid-cols-1 gap-3xl lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionLabel>Contato</SectionLabel>
              <Heading as="h1" variant="display-l" className="mt-md">
                Fale com a DM
              </Heading>
              {intro ? (
                <div className="mt-lg max-w-reading">
                  <RichText value={intro} />
                </div>
              ) : (
                <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
                  Conte o contexto da sua empresa e a DM explica como pode ajudar.
                </Text>
              )}

              <div className="mt-2xl space-y-xl">
                {hasAddress ? (
                  <div>
                    <SectionLabel>Endereço</SectionLabel>
                    <Text className="mt-sm">{settings?.address}</Text>
                    {mapQuery ? (
                      <Text size="sm" className="mt-xs">
                        <a
                          href={mapQuery}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-link underline underline-offset-4"
                        >
                          Ver no mapa
                          <span className="sr-only"> (abre em nova aba)</span>
                        </a>
                      </Text>
                    ) : null}
                  </div>
                ) : null}

                {hasChannels ? (
                  <div>
                    <SectionLabel>Canais</SectionLabel>
                    <ul className="mt-sm space-y-xs">
                      {settings?.phone ? (
                        <li>
                          <a
                            href={`tel:${settings.phone.replace(/\D/g, "")}`}
                            className="text-link underline underline-offset-4"
                          >
                            {settings.phone}
                          </a>
                        </li>
                      ) : null}
                      {settings?.whatsapp ? (
                        <li>
                          <a
                            href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-link underline underline-offset-4"
                          >
                            WhatsApp
                            <span className="sr-only"> (abre em nova aba)</span>
                          </a>
                        </li>
                      ) : null}
                      {settings?.email ? (
                        <li>
                          <a
                            href={`mailto:${settings.email}`}
                            className="text-link underline underline-offset-4"
                          >
                            {settings.email}
                          </a>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

                {!hasAddress && !hasChannels ? (
                  <Text tone="secondary">
                    Os canais de contato serão publicados assim que confirmados pela DM.
                  </Text>
                ) : null}
              </div>
            </div>

            <div className="lg:col-span-7 relative overflow-hidden rounded-control border border-border bg-surface-raised p-xl">
              <SectionLabel>Formulário</SectionLabel>
              <Heading as="h2" variant="h2" className="mt-md">
                Escreva para a gente
              </Heading>

              <div className="mt-xl">
                <ContactForm action={submitLeadAction} formToken={formToken} />
              </div>

              <Text size="sm" tone="secondary" className="mt-lg max-w-reading">
                Prefere contato direto?{" "}
                {settings?.email ? (
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-link underline underline-offset-4"
                  >
                    Escreva para {settings.email}
                  </a>
                ) : settings?.phone ? (
                  <a
                    href={`tel:${settings.phone.replace(/\D/g, "")}`}
                    className="text-link underline underline-offset-4"
                  >
                    ligue para {settings.phone}
                  </a>
                ) : settings?.whatsapp ? (
                  <a
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-link underline underline-offset-4"
                  >
                    chame no WhatsApp
                    <span className="sr-only"> (abre em nova aba)</span>
                  </a>
                ) : (
                  "use um dos canais de contato da DM."
                )}
                .
              </Text>

              <div className="mt-2xl">
                <Button href="/" variant="secondary" size="lg">
                  Voltar para a Home
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </Section>
    </>
  );
}
