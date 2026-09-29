import { Suspense } from "react";
import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { CONTACT } from "@/content/dm";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";
import { getCurrentYear } from "@/server/current-year";

/**
 * Moldura das páginas públicas (cabeçalho, conteúdo, rodapé). Usada pelo layout do grupo `(site)`
 * e pela 404 raiz (`app/not-found.tsx`), que atende URLs sem rota e fica fora do grupo.
 * A leitura de `site_settings` é cacheada com `"use cache"` + `cacheTag("site-settings")`.
 */
export async function SiteChrome({ children }: { children: React.ReactNode }) {
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
        settings={{
          legalName: settings?.legalName ?? null,
          cnpj: settings?.cnpj ?? null,
          // Contato fixo em src/content/dm.ts; razão social, CNPJ e redes seguem nas Configurações.
          address: CONTACT.address,
          phone: CONTACT.phone,
          email: CONTACT.email,
          whatsapp: CONTACT.whatsapp,
          social: (settings?.social ?? {}) as Record<string, string | undefined>,
        }}
      />
    </>
  );
}
