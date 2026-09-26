import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { SkipLink } from "@/components/ui";
import { env } from "@/server/env";
import "./globals.css";

// Fontes do Design System (Blueprint 2, seção 07), hospedadas pelo próprio Next (sem requisição
// a terceiros em produção). Newsreader é a voz editorial (títulos, texto longo); Instrument Sans,
// a voz de interface. SEM o eixo óptico `opsz`: medido em 21/09/2026, com ele a Newsreader
// (normal + itálico, subconjunto latino) pesa 272 KB; sem ele, 120 KB. Total das fontes: ~149 KB,
// dentro do orçamento do Blueprint 2 (seção 07). Reavaliar só se a revisão de design exigir.
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-newsreader",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-instrument-sans",
});

// `metadataBase` resolve os `canonical`/Open Graph relativos que cada página declara para URL
// absoluta — sem isso o Next usa a URL da própria requisição, que não é estável atrás de proxy.
export const metadata: Metadata = {
  metadataBase: new URL(env().SITE_URL),
  title: { default: "DM Empresarial", template: "%s · DM Empresarial" },
  description: "Consultoria empresarial em Frutal, MG.",
  openGraph: {
    siteName: "DM Empresarial",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${instrumentSans.variable}`}>
      <body>
        <SkipLink />
        {/* O <main id="conteudo"> fica em cada área (site, painel, login): assim cabeçalho e
            rodapé ficam FORA dele e o link "Ir para o conteúdo" pula de fato a navegação. */}
        {children}
      </body>
    </html>
  );
}
