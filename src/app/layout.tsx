import type { Metadata } from "next";
import "./globals.css";

// Metadata provisória, só com dados confirmados. A metadata real (por página, com fallback)
// entra na fase de SEO.
export const metadata: Metadata = {
  title: "DM Empresarial",
  description: "Consultoria empresarial em Frutal, MG.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
