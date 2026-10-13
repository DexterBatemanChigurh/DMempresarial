import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { CONTACT } from "@/content/dm";
import { getCurrentYear } from "@/server/current-year";

/**
 * Moldura das páginas públicas (cabeçalho, conteúdo, rodapé). Usada pelo layout do grupo `(site)`
 * e pela 404 raiz (`app/not-found.tsx`), que atende URLs sem rota e fica fora do grupo.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
  const year = await getCurrentYear();

  return (
    <>
      {/* O Header lê `usePathname`; em rotas dinâmicas (`/[key]`) o caminho só existe na
          requisição, então o Suspense deixa o restante do shell estático pré-renderizado. */}
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      <main id="conteudo" tabIndex={-1} className="outline-none">
        {children}
      </main>
      <Footer
        year={year}
        settings={{
          legalName: CONTACT.legalName,
          cnpj: CONTACT.cnpj,
          address: CONTACT.address,
          phone: CONTACT.phone,
          email: CONTACT.email,
          whatsapp: CONTACT.whatsapp,
          social: CONTACT.social,
        }}
      />
    </>
  );
}
