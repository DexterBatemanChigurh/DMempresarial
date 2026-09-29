import type { Metadata } from "next";
import { connection } from "next/server";
import { Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ContactForm } from "@/components/site/contact-form";
import { CONTACT, CONTACT_PAGE, WHATSAPP_URL } from "@/content/dm";
import { publicMetadata } from "@/components/site/seo";
import { mintFormToken } from "@/server/security/form-token";
import { submitLeadAction } from "./actions";

export const metadata: Metadata = publicMetadata({
  title: "Contato",
  description: CONTACT_PAGE.hero.description,
  path: "/contato",
});

// `mintFormToken()` carrega o instante da requisição — precisa renderizar por requisição, não
// no build (mesmo motivo das rotas `[slug]`).
export const instant = false;

const pad = (n: number) => String(n).padStart(2, "0");

export default async function ContactPage() {
  // `mintFormToken()` usa `new Date()`: sem um ponto explícito de dado de requisição, o Next
  // tenta chamá-la no prerender estático do build, onde não existe "agora" de verdade.
  await connection();
  const formToken = mintFormToken();
  // Contato fixo em src/content/dm.ts: só dado confirmado, nada inventado.
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;

  return (
    <>
      {/* 1 HERO */}
      <Section spacing="loose">
        <Container>
          <SectionLabel>Contato</SectionLabel>
          <Heading as="h1" variant="display-l" className="mt-md max-w-[20ch]">
            {CONTACT_PAGE.hero.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-lg max-w-reading">
            {CONTACT_PAGE.hero.description}
          </Text>
        </Container>
      </Section>

      {/* 2 FORMULÁRIO + INFORMAÇÕES */}
      <Section tone="muted" spacing="loose" aria-labelledby="formulario">
        <Container>
          <h2 id="formulario" className="sr-only">
            Formulário de contato
          </h2>
          <div className="grid gap-2xl lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-3xl">
            <div className="rounded-[20px] border border-border bg-surface p-lg md:p-2xl">
              <ContactForm action={submitLeadAction} formToken={formToken} />
            </div>

            <aside aria-label="DM Empresarial" className="space-y-xl lg:pt-lg">
              <div>
                <p className="font-sans text-label font-semibold tracking-[0.12em] text-text uppercase">
                  DM Empresarial
                </p>
                <p className="mt-md font-serif text-h4 font-medium text-text">Frutal — MG</p>
                <Text tone="secondary" className="mt-xs">
                  {CONTACT.address}
                </Text>
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-md flex aspect-[4/3] flex-col items-center justify-center gap-xs rounded-[16px] border border-border bg-surface font-sans text-sm font-semibold text-link transition-colors duration-150 ease-standard hover:border-link"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="32"
                    height="32"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path d="M12 21s-7-6.3-7-11.5A7 7 0 0 1 19 9.5C19 14.7 12 21 12 21z" />
                    <circle cx="12" cy="9.5" r="2.5" />
                  </svg>
                  Ver localização no mapa
                  <span className="sr-only"> (abre em nova aba)</span>
                </a>
              </div>
              <Text size="sm" tone="secondary">
                {CONTACT.hours}
              </Text>
            </aside>
          </div>
        </Container>
      </Section>

      {/* 3 O QUE ACONTECE DEPOIS */}
      <Section spacing="loose" aria-labelledby="depois">
        <Container>
          <Heading as="h2" variant="h2" id="depois">
            E depois do envio?
          </Heading>
          <ol className="mt-2xl grid gap-xl sm:grid-cols-2 lg:grid-cols-4">
            {CONTACT_PAGE.nextSteps.map((step, i) => (
              <li key={step.name} className="border-t-2 border-action pt-md">
                <span className="font-sans text-label font-semibold text-text-secondary tabular-nums">
                  {pad(i + 1)}
                </span>
                <Heading as="h3" variant="h4" className="mt-xs">
                  {step.name}
                </Heading>
                <Text size="sm" tone="secondary" className="mt-xs">
                  {step.text}
                </Text>
              </li>
            ))}
          </ol>
        </Container>
      </Section>

      {/* 4 OUTRAS FORMAS DE FALAR COM A DM */}
      <Section tone="muted" spacing="loose" aria-labelledby="direto">
        <Container>
          <Heading as="h2" variant="h2" id="direto">
            Prefere falar diretamente?
          </Heading>
          <ul className="mt-2xl grid gap-md md:grid-cols-3">
            <li className="rounded-[16px] border border-border bg-surface p-lg">
              <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                WhatsApp
              </p>
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-sm inline-flex min-h-11 items-center gap-xs font-sans text-body font-semibold text-link hover:underline"
              >
                Falar com a DM <ArrowRightIcon className="size-5" />
                <span className="sr-only"> (abre em nova aba)</span>
              </a>
              <Text size="sm" tone="secondary">
                {CONTACT.phone}
              </Text>
            </li>
            <li className="rounded-[16px] border border-border bg-surface p-lg">
              <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                E-mail
              </p>
              <a
                href={`mailto:${CONTACT.email}`}
                className="mt-sm inline-flex min-h-11 items-center gap-xs font-sans text-body font-semibold text-link hover:underline"
              >
                Enviar e-mail <ArrowRightIcon className="size-5" />
              </a>
              <Text size="sm" tone="secondary" className="break-words">
                {CONTACT.email}
              </Text>
            </li>
            <li className="rounded-[16px] border border-border bg-surface p-lg">
              <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                Endereço
              </p>
              <Text className="mt-sm">{CONTACT.address}</Text>
            </li>
          </ul>
        </Container>
      </Section>
    </>
  );
}
