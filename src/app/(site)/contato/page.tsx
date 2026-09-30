import type { Metadata } from "next";
import { connection } from "next/server";
import { Button, Container, Heading, Section, SectionLabel, Text } from "@/components/ui";
import { ArrowRightIcon } from "@/components/ui/icons";
import { ContactForm } from "@/components/site/contact-form";
import { CONTACT, CONTACT_PAGE, WHATSAPP_URL } from "@/content/dm";
import { publicMetadata } from "@/components/site/seo";
import { mintFormToken } from "@/server/security/form-token";
import { submitLeadAction } from "./actions";

export const metadata: Metadata = publicMetadata({
  title: "Contato: conte a situação da sua empresa",
  description: CONTACT_PAGE.hero.description,
  path: "/contato",
});

// `mintFormToken()` carrega o instante da requisição — precisa renderizar por requisição, não
// no build (mesmo motivo das rotas `[slug]`).
export const instant = false;

export default async function ContactPage() {
  // `mintFormToken()` usa `new Date()`: sem um ponto explícito de dado de requisição, o Next
  // tenta chamá-la no prerender estático do build, onde não existe "agora" de verdade.
  await connection();
  const formToken = mintFormToken();
  // Contato fixo em src/content/dm.ts: só dado confirmado, nada inventado.
  // Rua e cidade, separadas na última vírgula do endereço real (nada é escrito à mão aqui).
  const cut = CONTACT.address.lastIndexOf(", ");
  const street = CONTACT.address.slice(0, cut);
  const city = CONTACT.address.slice(cut + 2);
  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CONTACT.address)}`;

  return (
    <>
      {/* 1 HERO — curto e sem botão: prepara o preenchimento e deixa o formulário logo abaixo. */}
      <Section tone="dark" spacing="none" className="pt-xl pb-2xl md:pt-2xl md:pb-2xl">
        <Container>
          <SectionLabel>Contato</SectionLabel>
          <Heading as="h1" variant="h1" className="mt-lg max-w-[22ch] text-balance">
            {CONTACT_PAGE.hero.title}
          </Heading>
          <Text size="lg" tone="secondary" className="mt-md max-w-[40rem]">
            {CONTACT_PAGE.hero.description}
          </Text>
        </Container>
      </Section>

      {/* 2 FORMULÁRIO + INFORMAÇÕES */}
      <Section
        tone="muted"
        spacing="none"
        className="py-2xl md:py-3xl"
        aria-labelledby="formulario"
      >
        <Container>
          <h2 id="formulario" className="sr-only">
            Formulário de contato
          </h2>
          <div className="grid gap-2xl lg:grid-cols-[minmax(0,7fr)_minmax(0,4fr)] lg:gap-3xl">
            <div className="max-w-[40rem]">
              <ContactForm action={submitLeadAction} formToken={formToken} />
            </div>

            {/* LOCALIZAÇÃO — endereço em texto real (rua e cidade, sem repetir), um link que abre o
                endereço no Google Maps e nada mais: sem mapa desenhado nem coordenadas. */}
            <aside aria-labelledby="localizacao" className="lg:pt-lg">
              <Heading as="h2" variant="h4" id="localizacao">
                {CONTACT_PAGE.location.title}
              </Heading>
              <address className="mt-md font-serif text-h4 leading-snug font-medium text-text not-italic">
                <span className="block">{street}</span>
                <span className="block">{city}</span>
              </address>
              <div className="mt-lg">
                <Button
                  href={mapUrl}
                  variant="secondary"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  {CONTACT_PAGE.location.action}
                  <span className="sr-only"> (abre em nova aba)</span>
                </Button>
              </div>
            </aside>
          </div>
        </Container>
      </Section>

      {/* 3 E DEPOIS DO ENVIO? — o que acontece com a mensagem, em três momentos curtos (Agora,
          Em seguida, Depois), só com o que o sistema faz de verdade. Lista simples com rótulo de
          tempo à esquerda: sem números, cards nem etapas de consultoria. */}
      <Section
        tone="dark"
        spacing="none"
        className="border-t-[3px] border-ouro py-2xl md:py-3xl"
        aria-labelledby="depois"
      >
        <Container>
          <Heading as="h2" variant="h2" id="depois" className="scroll-mt-24">
            {CONTACT_PAGE.afterSend.title}
          </Heading>
          <Text tone="secondary" className="mt-sm max-w-reading">
            {CONTACT_PAGE.afterSend.intro}
          </Text>
          <ol className="mt-xl max-w-[46rem] border-t border-border-strong">
            {CONTACT_PAGE.afterSend.steps.map((step) => (
              <li
                key={step.name}
                className="grid gap-xs border-b border-border py-lg sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-lg"
              >
                <p className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                  {step.when}
                </p>
                <div>
                  <Heading as="h3" variant="h4">
                    {step.name}
                  </Heading>
                  <Text tone="secondary" className="mt-xs">
                    {step.text}
                  </Text>
                </div>
              </li>
            ))}
          </ol>
          <Text size="sm" tone="secondary" className="mt-lg max-w-[46rem]">
            {CONTACT_PAGE.afterSend.note}
          </Text>
        </Container>
      </Section>

      {/* 4 CANAIS DIRETOS — alternativa ao formulário: duas linhas em que o próprio número e o
          próprio e-mail são o link (visíveis, sem esconder atrás de botão). Sem cards; o endereço
          já está na lateral do formulário. Dados só de CONTACT / WHATSAPP_URL. */}
      <Section tone="muted" spacing="none" className="py-2xl md:py-3xl" aria-labelledby="direto">
        <Container>
          <Heading as="h2" variant="h2" id="direto" className="scroll-mt-24">
            {CONTACT_PAGE.direct.title}
          </Heading>
          <Text tone="secondary" className="mt-sm max-w-reading text-balance">
            {CONTACT_PAGE.direct.text} {CONTACT.hours}
          </Text>
          <ul className="mt-xl grid max-w-[46rem] gap-0 lg:max-w-none lg:grid-cols-2 lg:gap-2xl">
            <li className="border-t border-border-strong">
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="group block min-h-11 py-lg"
              >
                <span className="block font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                  {CONTACT_PAGE.direct.whatsappLabel}
                </span>
                <span className="mt-sm block font-serif text-h3 font-medium text-text">
                  {CONTACT.phone}
                </span>
                <span className="mt-xs inline-flex items-center gap-xs font-sans text-body font-semibold text-link underline-offset-4 group-hover:underline">
                  {CONTACT_PAGE.direct.whatsappAction}
                  <ArrowRightIcon className="size-5 shrink-0" />
                  <span className="sr-only"> (abre em nova aba)</span>
                </span>
              </a>
            </li>
            <li className="border-t border-border-strong">
              <a href={`mailto:${CONTACT.email}`} className="group block min-h-11 py-lg">
                <span className="block font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                  {CONTACT_PAGE.direct.emailLabel}
                </span>
                <span className="mt-sm block font-serif text-[1.25rem] font-medium break-words text-text sm:text-h3">
                  {CONTACT.email}
                </span>
                <span className="mt-xs inline-flex items-center gap-xs font-sans text-body font-semibold text-link underline-offset-4 group-hover:underline">
                  {CONTACT_PAGE.direct.emailAction}
                  <ArrowRightIcon className="size-5 shrink-0" />
                </span>
              </a>
            </li>
          </ul>
        </Container>
      </Section>
    </>
  );
}
