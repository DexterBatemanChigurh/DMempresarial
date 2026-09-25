import type { Metadata } from "next";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { publicMetadata } from "@/components/site/seo";

// Página legal com URL canônica em português (`/termos-de-uso`).
// A chave interna é `terms`. A rota `/terms` é redirecionada permanentemente (301) para cá
// via `next.config.ts` (redirects). Esta rota carrega o conteúdo da página `terms` do CMS.
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageForRoute("terms");
  if (!page) return { title: "Termos de Uso" };
  return publicMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    path: "/termos-de-uso",
  });
}

export default async function TermsPage() {
  // `connection()` marca que a renderização espera a requisição real (dados de requisição).
  // A página legal pode variar conforme o conteúdo do CMS, mas a URL é fixa.
  await connection();
  const page = await getPublishedPageForRoute("terms");
  if (!page) notFound();
  return <InstitutionalPage page={page} />;
}
