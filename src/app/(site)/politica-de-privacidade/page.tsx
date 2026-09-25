import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { publicMetadata } from "@/components/site/seo";

// Página legal com URL canônica em português (`/politica-de-privacidade`).
// A chave interna é `privacy`. A rota `/privacy` é redirecionada permanentemente (301) para cá
// via `next.config.ts` (redirects). Esta rota carrega o conteúdo da página `privacy` do CMS.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageForRoute("privacy");
  if (!page) return { title: "Política de Privacidade" };
  return publicMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    path: "/politica-de-privacidade",
  });
}

export default async function PrivacyPage() {
  // `connection()` marca que a renderização espera a requisição real (dados de requisição).
  // A página legal pode variar conforme o conteúdo do CMS, mas a URL é fixa.
  await connection();
  const page = await getPublishedPageForRoute("privacy");
  if (!page) notFound();
  return <InstitutionalPage page={page} />;
}
