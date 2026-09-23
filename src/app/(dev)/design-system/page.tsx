import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import {
  Button,
  CheckboxField,
  Container,
  FormMessage,
  Heading,
  SectionLabel,
  Section,
  SelectField,
  Text,
  TextareaField,
  TextField,
  TextLink,
  type SectionTone,
} from "@/components/ui";
import { env } from "@/server/env";

// Página de REFERÊNCIA do Design System: mostra tokens, escala e componentes com estados.
// Só existe fora de produção e nunca é indexada. Os textos são exemplos de interface, não
// conteúdo da DM. Usa `await connection()` (avaliada por requisição) para decidir se existe —
// com Cache Components isso bloqueia o static shell; é intencional (`instant = false`).
export const instant = false;

export const metadata: Metadata = {
  title: "Design System",
  robots: { index: false, follow: false },
};

const PALETTE = [
  ["papel", "bg-papel"],
  ["papel-elevado", "bg-papel-elevado"],
  ["areia", "bg-areia"],
  ["tinta", "bg-tinta"],
  ["tinta-secundaria", "bg-tinta-secundaria"],
  ["tinta-suave", "bg-tinta-suave"],
  ["verde-tinta", "bg-verde-tinta"],
  ["terracota", "bg-terracota"],
  ["terracota-escura", "bg-terracota-escura"],
  ["linha", "bg-linha"],
  ["borda-campo", "bg-borda-campo"],
  ["sucesso", "bg-sucesso"],
  ["aviso", "bg-aviso"],
  ["erro", "bg-erro"],
] as const;

const TYPE_SCALE = [
  ["Display XL", "font-serif text-display-xl"],
  ["Display L", "font-serif text-display-l"],
  ["Display M", "font-serif text-display-m"],
  ["H1", "font-serif text-h1 font-medium"],
  ["H2", "font-serif text-h2 font-medium"],
  ["H3", "font-serif text-h3 font-medium"],
  ["H4", "font-sans text-h4 font-semibold"],
  ["Body Large", "font-sans text-body-lg"],
  ["Body", "font-sans text-body"],
  ["Body Small", "font-sans text-body-sm"],
  ["Texto de artigo", "font-serif text-article"],
  ["Caption", "font-sans text-caption"],
  ["Metadata", "font-sans text-metadata font-medium"],
] as const;

const SPACING = ["2xs", "xs", "sm", "md", "lg", "xl", "2xl", "3xl", "4xl", "5xl"] as const;

const TONES: { tone: SectionTone; name: string }[] = [
  { tone: "default", name: "Papel (padrão)" },
  { tone: "muted", name: "Areia (apoio)" },
  { tone: "dark", name: "Verde-tinta (escura)" },
];

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-3xl">
      <SectionLabel>{title}</SectionLabel>
      <div className="mt-lg">{children}</div>
    </div>
  );
}

export default async function DesignSystemPage() {
  // Avaliado por requisição: o build estático não pode decidir sozinho se estamos em produção.
  await connection();
  if (env().APP_ENV === "production") notFound();

  return (
    <>
      <Section>
        <Container>
          <Heading as="h1" variant="display-m">
            Design System
          </Heading>
          <Text tone="secondary" className="mt-md max-w-reading">
            Referência viva dos tokens e componentes (docs/02). Só existe fora de produção.
          </Text>

          <Block title="Cores (primitivos)">
            <ul className="grid grid-cols-2 gap-md sm:grid-cols-3 lg:grid-cols-5">
              {PALETTE.map(([name, swatch]) => (
                <li key={name}>
                  <div className={`h-16 rounded-none border border-border ${swatch}`} />
                  <Text size="caption" tone="secondary" className="mt-xs">
                    {name}
                  </Text>
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Escala tipográfica (fluida, 320 → 1280 px)">
            <dl className="divide-y divide-border">
              {TYPE_SCALE.map(([name, classes]) => (
                <div key={name} className="py-md">
                  <dt className="font-sans text-caption text-text-secondary">{name}</dt>
                  <dd className={`mt-2xs ${classes}`}>Texto de exemplo para a escala</dd>
                </div>
              ))}
            </dl>
          </Block>

          <Block title="Espaçamento (base 4 px)">
            <ul className="space-y-xs">
              {SPACING.map((token) => (
                <li key={token} className="flex items-center gap-md">
                  <span className="w-12 font-sans text-caption text-text-secondary">{token}</span>
                  <span
                    className="h-3 bg-tinta"
                    style={{ width: `var(--spacing-${token})` }}
                    aria-hidden="true"
                  />
                </li>
              ))}
            </ul>
          </Block>

          <Block title="Botões">
            <div className="flex flex-wrap items-center gap-md">
              <Button variant="primary">Ação principal</Button>
              <Button variant="secondary">Ação alternativa</Button>
              <Button variant="tertiary" href="#botoes">
                Continuar
              </Button>
              <Button variant="primary" size="sm">
                Compacto
              </Button>
              <Button variant="primary" size="lg">
                Grande
              </Button>
              <Button variant="primary" disabled>
                Desabilitado
              </Button>
              <Button variant="secondary" disabled>
                Desabilitado
              </Button>
              <Button variant="primary" loading loadingLabel="Enviando…">
                Enviar
              </Button>
            </div>
            <Text tone="secondary" className="mt-lg max-w-reading">
              Um <TextLink href="#botoes">link em texto corrido</TextLink> e um{" "}
              <TextLink href="https://example.test">link externo</TextLink>.
            </Text>
          </Block>

          <Block title="Formulários (estados)">
            <form noValidate className="max-w-narrow space-y-lg" aria-label="Exemplo de formulário">
              <TextField id="ds-nome" label="Nome" required hint="Como devemos chamar você." />
              <TextField
                id="ds-email"
                label="E-mail"
                type="email"
                required
                defaultValue="pessoa@"
                error="Confira o e-mail: parece faltar o domínio."
              />
              <TextField id="ds-desativado" label="Campo desabilitado" disabled />
              <SelectField
                id="ds-segmento"
                label="Segmento"
                placeholder="Selecione"
                options={[
                  { value: "a", label: "Opção A" },
                  { value: "b", label: "Opção B" },
                ]}
              />
              <TextareaField id="ds-mensagem" label="Mensagem" required />
              <CheckboxField id="ds-aceite" required>
                Li e aceito a <TextLink href="#formularios">Política de Privacidade</TextLink>.
              </CheckboxField>
              <FormMessage tone="error" title="Não conseguimos enviar agora.">
                Tente de novo em instantes.
              </FormMessage>
              <FormMessage tone="success" title="Mensagem recebida." />
              <FormMessage tone="info">Informação neutra, sem urgência.</FormMessage>
            </form>
          </Block>
        </Container>
      </Section>

      {TONES.map(({ tone, name }) => (
        <Section key={tone} tone={tone}>
          <Container>
            <SectionLabel>Faixa: {name}</SectionLabel>
            <Heading as="h2" variant="display-m" className="mt-md">
              Título sobre esta faixa
            </Heading>
            <Text tone="secondary" className="mt-md max-w-reading">
              Texto secundário: o contraste é garantido em cada faixa por teste automatizado.
            </Text>
            <Text tone="muted" size="caption" className="mt-sm">
              Metadata (tinta suave; sobre areia usa a secundária).
            </Text>
            <div className="mt-lg flex flex-wrap gap-md">
              <Button variant="primary">Ação principal</Button>
              <Button variant="secondary">Ação alternativa</Button>
            </div>
            <Text className="mt-lg">
              <TextLink href="#faixas">Link nesta faixa</TextLink>
            </Text>
          </Container>
        </Section>
      ))}
    </>
  );
}
