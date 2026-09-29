import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";
import { SiteChrome } from "@/app/_site/site-chrome";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

// URLs sem rota nenhuma caem aqui (fora do grupo `(site)`): a moldura do site vem junto, para a
// pessoa não ficar numa tela solta, sem menu.
export default function NotFound() {
  return (
    <SiteChrome>
      <NotFoundContent />
    </SiteChrome>
  );
}
