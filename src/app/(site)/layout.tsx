import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import { getCurrentYear } from "@/server/current-year";

// Cabeçalho e rodapé só nas páginas públicas — o painel (`/admin`) fica fora deste grupo de
// rotas e não herda esta faixa de navegação. A leitura de `site_settings` é cacheada com
// `"use cache"` + `cacheTag("site-settings")` em `settings-crud.ts`, então o dado do rodapé
// não congela no build e ainda responde a `revalidateTag` do painel.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [settings, year] = await Promise.all([getPublicSettingsForRoute(), getCurrentYear()]);

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
        settings={
          settings
            ? {
                legalName: settings.legalName,
                cnpj: settings.cnpj,
                address: settings.address,
                phone: settings.phone,
                email: settings.email,
                whatsapp: settings.whatsapp,
                social: (settings.social ?? {}) as Record<string, string | undefined>,
              }
            : null
        }
      />
    </>
  );
}
