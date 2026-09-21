import type { Metadata } from "next";

// O painel nunca é indexado nem aparece em buscadores (além de `robots.txt` e do cabeçalho
// X-Robots-Tag definido no Proxy).
export const metadata: Metadata = {
  title: { default: "Painel", template: "%s · Painel DM Empresarial" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
