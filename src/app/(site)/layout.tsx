import { Footer } from "@/components/site/footer";
import { Header } from "@/components/site/header";
import { getPublicSettingsForRoute } from "@/features/settings/application/settings-crud";

// Provisório: sem isto, o Next tenta gerar estas páginas como estáticas no build e o rodapé
// (consulta direta ao banco, não `fetch`) fica congelado com o dado de quando o build rodou —
// `revalidateTag` de Configurações não alcança uma consulta Drizzle. Sai quando a Fase 5 ligar
// `cacheComponents` com `use cache`/`cacheTag` nas leituras públicas (docs/03, parte 25).
export const dynamic = "force-dynamic";

// Cabeçalho e rodapé só nas páginas públicas — o painel (`/admin`) fica fora deste grupo de
// rotas e não herda esta faixa de navegação.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const settings = await getPublicSettingsForRoute();

  return (
    <>
      <Header />
      {children}
      <Footer
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
