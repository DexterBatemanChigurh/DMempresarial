import { SiteChrome } from "@/app/_site/site-chrome";

// Cabeçalho e rodapé só nas páginas públicas — o painel (`/admin`) fica fora deste grupo de
// rotas e não herda esta faixa de navegação.
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return <SiteChrome>{children}</SiteChrome>;
}
