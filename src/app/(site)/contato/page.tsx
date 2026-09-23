import type { Metadata } from "next";
import { RichText } from "@/components/content/rich-text";
import {
  Button,
  Container,
  FormMessage,
  Heading,
  Section,
  SectionLabel,
  Text,
  TextareaField,
  TextField,
} from "@/components/ui";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import { contactDataSchema } from "@/features/pages/domain/page-schemas";
import { publicMetadata } from "@/components/site/seo";

export const metadata: Metadata = publicMetadata({
  title: "Contato",
  description: "Fale com a DM Empresarial. Endereço, canais e formulário de contato.",
  path: "/contato",
});

export default async function ContactPage() {
  const [page, settings] = await Promise.all([
    getPublishedPageForRoute("contact"),
    getPublicSettingsForRoute(),
  ]);

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

            <div className="lg:col-span-7">
              <SectionLabel>Formulário</SectionLabel>
              <Heading as="h2" variant="h2" className="mt-md">
                Escreva para a gente
              </Heading>

              <FormMessage tone="info" className="mt-lg">
                O envio pelo site ainda não está disponível. Use um dos canais ao lado — telefone,
                WhatsApp ou e-mail.
              </FormMessage>

              <form noValidate aria-label="Formulário de contato (em construção)" className="mt-xl">
                <fieldset disabled className="space-y-lg opacity-60">
                  <TextField id="contato-nome" label="Nome" required />
                  <TextField id="contato-email" label="E-mail" type="email" required />
                  <TextField id="contato-telefone" label="Telefone" type="tel" />
                  <TextField id="contato-empresa" label="Empresa" />
                  <TextareaField id="contato-mensagem" label="Mensagem" required />
                </fieldset>
              </form>

              <Text size="sm" tone="secondary" className="mt-lg max-w-reading">
                Preferindo contato direto?{" "}
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
