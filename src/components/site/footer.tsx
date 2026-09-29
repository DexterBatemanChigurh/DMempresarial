import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/ui";
import {
  ArrowRightIcon,
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  WhatsAppIcon,
} from "@/components/ui/icons";

/**
 * Rodapé público (composição definida pelo usuário): marca com chamada, quatro colunas de links
 * e uma linha final com copyright, páginas legais e redes. Dado real ou nada: redes e WhatsApp só aparecem quando `site_settings` os tem (L-05).
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

type FooterLink = { href: string; label: string };

/** Colunas do rodapé (composição definida pelo usuário). Só links para páginas que existem. */
const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Empresa",
    links: [
      { href: "/sobre", label: "Sobre a DM" },
      { href: "/sobre/especialistas", label: "Especialistas" },
      { href: "/sobre#como-trabalhamos", label: "Nossa abordagem" },
    ],
  },
  {
    title: "Soluções",
    links: [
      { href: "/solucoes/consultoria-estrategica", label: "Consultorias" },
      { href: "/solucoes#servicos", label: "Serviços" },
      { href: "/solucoes", label: "Soluções" },
    ],
  },
  {
    title: "Conteúdo",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/blog/categoria/gestao", label: "Gestão" },
      { href: "/blog/categoria/financas", label: "Finanças" },
      { href: "/blog/categoria/negocios-em-frutal-e-regiao", label: "Negócios" },
    ],
  },
];

const LEGAL = [
  { href: "/politica-de-privacidade", label: "Política de Privacidade" },
  { href: "/termos-de-uso", label: "Termos de Uso" },
];

const SOCIAL: Record<string, { label: string; Icon: ComponentType<SVGProps<SVGSVGElement>> }> = {
  instagram: { label: "Instagram", Icon: InstagramIcon },
  linkedin: { label: "LinkedIn", Icon: LinkedInIcon },
  facebook: { label: "Facebook", Icon: FacebookIcon },
};

export function Footer({ settings, year }: { settings: FooterSettings | null; year: number }) {
  const socialEntries = Object.entries(settings?.social ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const whatsapp = settings?.whatsapp?.replace(/\D/g, "");

  return (
    <>
      <footer data-tone="dark" className="bg-surface text-text">
        {/* Marca e chamada */}
        <Container size="wide" className="border-b border-border py-2xl">
          <p className="font-sans text-label font-semibold tracking-[0.12em] uppercase">
            DM Empresarial
          </p>
          <p className="mt-sm max-w-[28rem] font-serif text-h3 font-medium text-text">
            Estratégia, gestão e soluções para empresas que querem avançar.
          </p>
          <Link
            href="/sobre"
            className="mt-lg inline-flex min-h-11 items-center gap-xs rounded-control border-[1.5px] border-text px-lg font-sans text-sm font-semibold text-text transition-colors duration-150 ease-standard hover:bg-text hover:text-surface"
          >
            Conheça a DM <ArrowRightIcon className="size-5" />
          </Link>
        </Container>

        {/* Colunas */}
        <Container size="wide" className="border-b border-border py-2xl">
          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-x-lg gap-y-xl md:grid-cols-4">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h2 className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                  {column.title}
                </h2>
                <ul className="mt-md space-y-xs font-sans text-body-sm">
                  {column.links.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="text-text transition-colors duration-150 ease-standard hover:text-link"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <div>
              <h2 className="font-sans text-label font-semibold tracking-[0.08em] text-text-secondary uppercase">
                Contato
              </h2>
              <ul className="mt-md space-y-xs font-sans text-body-sm text-text">
                <li>Frutal — MG</li>
                {settings?.address ? (
                  <li className="text-text-secondary">{settings.address}</li>
                ) : null}
                <li>
                  <Link
                    href="/contato"
                    className="font-semibold text-link transition-colors duration-150 ease-standard hover:underline"
                  >
                    Falar com a DM →
                  </Link>
                </li>
              </ul>
            </div>
          </nav>
        </Container>

        {/* Linha final */}
        <Container
          size="wide"
          className={`flex flex-col gap-md py-lg font-sans text-caption text-text-secondary md:flex-row md:items-center md:justify-between ${
            // Espaço para o botão flutuante do WhatsApp não cobrir o texto no fim da página.
            whatsapp ? "pb-24 md:pb-lg" : ""
          }`}
        >
          <div className="space-y-2xs">
            <p>
              © {year} {settings?.legalName ?? "DM Empresarial"}
              {settings?.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}
            </p>
            <p className="flex flex-wrap gap-x-xs">
              {LEGAL.map((item, i) => (
                <span key={item.href}>
                  {i > 0 ? <span aria-hidden="true">· </span> : null}
                  <Link
                    href={item.href}
                    className="underline-offset-[3px] transition-colors hover:text-text hover:underline"
                  >
                    {item.label}
                  </Link>
                </span>
              ))}
            </p>
          </div>

          {socialEntries.length > 0 ? (
            <ul className="flex items-center gap-lg">
              {socialEntries.map(([platform, url]) => {
                const known = SOCIAL[platform];
                return (
                  <li key={platform}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${known?.label ?? platform} (abre em nova aba)`}
                      className="inline-flex min-h-11 items-center gap-xs text-text transition-colors duration-150 ease-standard hover:text-link"
                    >
                      {known ? <known.Icon className="size-5" /> : null}
                      {known?.label ?? platform}
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </Container>
      </footer>

      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar com a DM pelo WhatsApp (abre em nova aba)"
          className="fixed right-lg bottom-lg z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-papel shadow-overlay transition-colors duration-150 ease-standard hover:bg-whatsapp-texto"
        >
          <WhatsAppIcon className="size-8" />
        </a>
      ) : null}
    </>
  );
}
