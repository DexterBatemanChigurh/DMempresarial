import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";

// URL canônica em português (docs/01 §05); a chave interna da página continua "terms"
// (RESERVED_SLUGS bloqueia a string em português como key — convenção já testada).
export async function generateMetadata(): Promise<Metadata> {
  const page = await getPublishedPageForRoute("terms");
  if (!page) return { title: "Página não encontrada" };
  return { title: page.seoTitle ?? page.title, description: page.seoDescription ?? undefined };
}

export default async function TermsOfUsePage() {
  const page = await getPublishedPageForRoute("terms");
  if (!page) notFound();
  return <InstitutionalPage page={page} />;
}
