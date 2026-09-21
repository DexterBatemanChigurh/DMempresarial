import type { Metadata } from "next";
import { Instrument_Sans, Newsreader } from "next/font/google";
import { SkipLink } from "@/components/ui";
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

// Metadata provisória, só com dados confirmados. A metadata real (por página, com fallback)
// entra na fase de SEO.
export const metadata: Metadata = {
  title: "DM Empresarial",
  description: "Consultoria empresarial em Frutal, MG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${newsreader.variable} ${instrumentSans.variable}`}>
      <body>
        <SkipLink />
        <main id="conteudo">{children}</main>
      </body>
    </html>
  );
}
