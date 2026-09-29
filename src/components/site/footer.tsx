import Link from "next/link";
import type { ComponentType, SVGProps } from "react";
import { Container } from "@/components/ui";
import { FacebookIcon, InstagramIcon, LinkedInIcon, WhatsAppIcon } from "@/components/ui/icons";

/**
 * Rodapé público, na composição de uma referência do usuário: uma faixa baixa com a marca à
 * esquerda, o menu e as redes à direita, e uma tira clara fina embaixo. Cores e fontes são as
 * da DM. Dado real ou nada: redes e WhatsApp só aparecem quando `site_settings` os tem (L-05).
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
      <footer>
        <div data-tone="dark" className="bg-surface text-text">
          <Container
            size="wide"
            className="flex flex-col items-center gap-xl py-2xl lg:flex-row lg:justify-between lg:py-xl"
          >
            <Link
              href="/"
              aria-label="DM Empresarial, página inicial"
              className="text-center lg:text-left"
            >
              <span className="block font-serif text-h1 leading-none font-medium">
                DM Empresarial
              </span>
              <span className="mt-2xs block font-sans text-label font-semibold tracking-[0.12em] text-text-secondary uppercase">
                Consultoria empresarial
              </span>
            </Link>

            <div className="flex flex-col items-center gap-lg md:flex-row md:gap-3xl">
              <nav aria-label="Rodapé">
                <ul className="flex flex-wrap justify-center gap-x-xl gap-y-sm font-sans text-body">
                  {NAV.map((item) => (
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
              </nav>

              {socialEntries.length > 0 ? (
                <ul className="flex items-center gap-md">
                  {socialEntries.map(([platform, url]) => {
                    const known = SOCIAL[platform];
                    return (
                      <li key={platform}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`${known?.label ?? platform} (abre em nova aba)`}
                          className="flex size-11 items-center justify-center text-text transition-colors duration-150 ease-standard hover:text-link"
                        >
                          {known ? (
                            <known.Icon className="size-8" />
                          ) : (
                            <span className="font-sans text-body">{platform}</span>
                          )}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>
          </Container>
        </div>

        <div className="bg-surface text-text-secondary">
          <Container
            size="wide"
            className={`flex flex-wrap items-center justify-center gap-x-lg gap-y-2xs pt-sm text-center font-sans text-caption ${
              // Espaço para o botão flutuante do WhatsApp não cobrir o texto no fim da página.
              whatsapp ? "pb-24 md:pb-sm" : "pb-sm"
            }`}
          >
            <p>
              © {year} {settings?.legalName ?? "DM Empresarial"}
              {settings?.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}. Todos os direitos reservados.
            </p>
            {LEGAL.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="underline-offset-[3px] transition-colors hover:text-text hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </Container>
        </div>
      </footer>

      {whatsapp ? (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Conversar com a DM pelo WhatsApp (abre em nova aba)"
          className="fixed right-lg bottom-lg z-40 flex size-14 items-center justify-center rounded-full bg-action text-action-contrast shadow-overlay transition-colors duration-150 ease-standard hover:bg-action-hover"
        >
          <WhatsAppIcon className="size-8" />
        </a>
      ) : null}
    </>
  );
}
