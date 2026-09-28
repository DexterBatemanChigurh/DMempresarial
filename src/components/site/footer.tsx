import Link from "next/link";
import type { ComponentType, ReactNode, SVGProps } from "react";
import { Button, Container } from "@/components/ui";
import {
  ArrowUpIcon,
  ArrowUpRightIcon,
  ChatIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
} from "@/components/ui/icons";

/**
 * Rodapé público (Blueprint 2, seção 17). Faixa escura, dado real ou nada: telefone, e-mail,
 * WhatsApp e redes só aparecem quando `site_settings` os tem preenchidos (L-05). Links legais
 * apontam para as páginas servidas pela rota `src/app/(site)/[key]/page.tsx`.
 */
export type FooterSettings = {
  legalName: string | null;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  social: Record<string, string | undefined>;
};

const NAV = [
  { href: "/sobre", label: "Sobre" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/servicos", label: "Serviços" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

const LEGAL = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

const SOCIAL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

const LINK =
  "group inline-flex items-center rounded-sm text-text transition-colors duration-150 ease-standard hover:text-link";

function ColumnTitle({ children }: { children: ReactNode }) {
  return (
    <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
      {children}
    </p>
  );
}

function ContactItem({
  href,
  Icon,
  children,
}: {
  href: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  children: ReactNode;
}) {
  const external = href.startsWith("http");
  return (
    <li>
      <a
        href={href}
        className={`${LINK} gap-xs break-all`}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        <Icon className="size-5 shrink-0 text-text-secondary transition-colors group-hover:text-link" />
        <span>{children}</span>
        {external ? <span className="sr-only"> (abre em nova aba)</span> : null}
      </a>
    </li>
  );
}

export function Footer({ settings, year }: { settings: FooterSettings | null; year: number }) {
  const socialEntries = Object.entries(settings?.social ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const hasContact = Boolean(settings?.phone || settings?.email || settings?.whatsapp);

  return (
    <footer data-tone="dark" className="relative overflow-hidden bg-surface text-text">
      <Container size="wide">
        <div className="grid grid-cols-2 gap-x-xl gap-y-3xl pt-4xl lg:grid-cols-[minmax(0,1.6fr)_repeat(3,minmax(0,1fr))] lg:gap-2xl md:pt-5xl">
          <div className="col-span-2 lg:col-span-1">
            <ColumnTitle>Consultoria empresarial · Frutal, MG</ColumnTitle>
            <p className="mt-md font-serif text-h1 font-medium text-text">DM Empresarial</p>
            {settings?.address ? (
              <p className="mt-lg flex max-w-[22rem] gap-xs font-sans text-body-sm text-text-secondary">
                <MapPinIcon className="mt-[2px] size-5 shrink-0" />
                <span>{settings.address}</span>
              </p>
            ) : null}
            <div className="mt-xl">
              <Button href="/contato">Fale com a DM →</Button>
            </div>
          </div>

          <nav aria-label="Rodapé">
            <ColumnTitle>Navegação</ColumnTitle>
            <ul className="mt-lg space-y-sm font-sans text-body">
              {NAV.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={LINK}>
                    <span className="h-px w-0 bg-current transition-all duration-200 ease-standard group-hover:mr-xs group-hover:w-md motion-reduce:transition-none" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {hasContact ? (
            <div className="order-last col-span-2 sm:order-none sm:col-span-1">
              <ColumnTitle>Contato</ColumnTitle>
              <ul className="mt-lg space-y-sm font-sans text-body-sm">
                {settings?.phone ? (
                  <ContactItem href={`tel:${settings.phone.replace(/\D/g, "")}`} Icon={PhoneIcon}>
                    {settings.phone}
                  </ContactItem>
                ) : null}
                {settings?.whatsapp ? (
                  <ContactItem
                    href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}
                    Icon={ChatIcon}
                  >
                    WhatsApp
                  </ContactItem>
                ) : null}
                {settings?.email ? (
                  <ContactItem href={`mailto:${settings.email}`} Icon={MailIcon}>
                    {settings.email}
                  </ContactItem>
                ) : null}
              </ul>
            </div>
          ) : null}

          {socialEntries.length > 0 ? (
            <div>
              <ColumnTitle>Redes</ColumnTitle>
              <ul className="mt-lg space-y-sm font-sans text-body">
                {socialEntries.map(([platform, url]) => (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${LINK} gap-xs`}
                    >
                      {SOCIAL_LABEL[platform] ?? platform}
                      <ArrowUpRightIcon className="size-4 transition-transform duration-150 ease-standard group-hover:translate-x-[2px] group-hover:-translate-y-[2px] motion-reduce:transition-none" />
                      <span className="sr-only"> (abre em nova aba)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <div className="mt-4xl flex flex-col gap-md border-t border-border py-xl font-sans text-caption text-text-secondary md:flex-row md:items-center md:justify-between">
          <p>
            © {year} {settings?.legalName ?? "DM Empresarial"}
            {settings?.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}
          </p>
          <ul className="flex flex-wrap items-center gap-x-lg gap-y-xs">
            {LEGAL.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className={LINK}>
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <a href="#" className={`${LINK} gap-xs`}>
                Voltar ao topo
                <ArrowUpIcon className="size-4 transition-transform duration-150 ease-standard group-hover:-translate-y-[2px] motion-reduce:transition-none" />
              </a>
            </li>
          </ul>
        </div>
      </Container>

      {/* Assinatura editorial: o nome em escala de cartaz, quase na cor do fundo e cortado pela
          borda de baixo. Decorativa (o nome já está legível acima), então fica fora da árvore
          de acessibilidade. */}
      <p
        aria-hidden="true"
        className="pointer-events-none -mb-[0.22em] text-center font-serif text-[clamp(3.5rem,13.5vw,15rem)] leading-none font-medium tracking-[-0.03em] whitespace-nowrap text-text/[0.07] select-none"
      >
        DM Empresarial
      </p>
    </footer>
  );
}
