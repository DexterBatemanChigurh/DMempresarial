import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";
import { publicMetadata } from "@/components/site/seo";

// URL canônica em português (docs/01 §05); a chave interna da página continua "privacy"
// (RESERVED_SLUGS bloqueia a string em português como key — convenção já testada).
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageForRoute("privacy");
  if (!page) return { title: "Página não encontrada" };
  return publicMetadata({
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
    path: "/politica-de-privacidade",
  });
}

export default async function PrivacyPolicyPage() {
  const page = await getPublishedPageForRoute("privacy");
  if (!page) notFound();
  return <InstitutionalPage page={page} />;
}
