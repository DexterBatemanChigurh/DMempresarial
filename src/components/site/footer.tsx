import { Container, Section, Text, TextLink } from "@/components/ui";

/**
 * Rodapé público (Blueprint 2, seção 17). Faixa escura, dado real ou nada: telefone, e-mail,
 * WhatsApp e redes só aparecem quando `site_settings` os tem preenchidos (L-05). Sem links
 * legais por enquanto — as páginas de privacidade/termos ainda não têm rota pública.
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
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

const SOCIAL_LABEL: Record<string, string> = {
  instagram: "Instagram",
  linkedin: "LinkedIn",
  facebook: "Facebook",
};

export function Footer({ settings }: { settings: FooterSettings | null }) {
  const year = new Date().getFullYear();
  const socialEntries = Object.entries(settings?.social ?? {}).filter(
    (entry): entry is [string, string] => Boolean(entry[1]),
  );
  const hasContact = Boolean(settings?.phone || settings?.email || settings?.whatsapp);

  return (
    <Section tone="dark" spacing="loose" aria-labelledby="rodape-titulo">
      <Container size="wide">
        <h2 id="rodape-titulo" className="sr-only">
          Rodapé
        </h2>
        <div className="grid grid-cols-1 gap-2xl sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="font-serif text-h4 font-medium">DM Empresarial</p>
            {settings?.address ? (
              <Text tone="secondary" className="mt-sm">
                {settings.address}
              </Text>
            ) : null}
          </div>

          <nav aria-label="Rodapé">
            <p className="font-sans text-caption font-semibold tracking-[0.02em] text-text-secondary">
              Navegação
            </p>
            <ul className="mt-sm space-y-xs">
              {NAV.map((item) => (
                <li key={item.href}>
                  <TextLink href={item.href}>{item.label}</TextLink>
                </li>
              ))}
            </ul>
          </nav>

          {hasContact ? (
            <div>
              <p className="font-sans text-caption font-semibold tracking-[0.02em] text-text-secondary">
                Contato
              </p>
              <ul className="mt-sm space-y-xs">
                {settings?.phone ? (
                  <li>
                    <TextLink href={`tel:${settings.phone.replace(/\D/g, "")}`}>
                      {settings.phone}
                    </TextLink>
                  </li>
                ) : null}
                {settings?.whatsapp ? (
                  <li>
                    <TextLink href={`https://wa.me/${settings.whatsapp.replace(/\D/g, "")}`}>
                      WhatsApp
                    </TextLink>
                  </li>
                ) : null}
                {settings?.email ? (
                  <li>
                    <TextLink href={`mailto:${settings.email}`}>{settings.email}</TextLink>
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}

          {socialEntries.length > 0 ? (
            <div>
              <p className="font-sans text-caption font-semibold tracking-[0.02em] text-text-secondary">
                Redes
              </p>
              <ul className="mt-sm space-y-xs">
                {socialEntries.map(([platform, url]) => (
                  <li key={platform}>
                    <TextLink href={url}>{SOCIAL_LABEL[platform] ?? platform}</TextLink>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>

        <Text size="caption" tone="secondary" className="mt-2xl">
          © {year} {settings?.legalName ?? "DM Empresarial"}
          {settings?.cnpj ? ` · CNPJ ${settings.cnpj}` : ""}
        </Text>
      </Container>
    </Section>
  );
}
