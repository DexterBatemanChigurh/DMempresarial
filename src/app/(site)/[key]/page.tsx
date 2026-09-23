import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { getPublishedPageForRoute } from "@/features/pages/application/public-page";

// Rotas estáticas (`/sobre`, `/contato`, `/solucoes`, `/blog`, `/politica-de-privacidade`,
// `/termos-de-uso`) resolvem antes desta rota dinâmica, então ela só atende chaves que não têm
// rota própria — `privacy`/`terms` têm rota dedicada em português (URL canônica, docs/01 §05) e
// ficam reservadas aqui por defesa em profundidade; o resto é o que a DM criar pelo painel.
export const instant = false;

type Params = { params: Promise<{ key: string }> };

const RESERVED = new Set([
  "sobre",
  "contato",
  "solucoes",
  "blog",
  "admin",
  "api",
  "privacy",
  "terms",
]);

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { key } = await params;
  if (RESERVED.has(key)) return { title: "Página não encontrada" };
  const page = await getPublishedPageForRoute(key);
  if (!page) return { title: "Página não encontrada" };
  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? undefined,
  };
}

export default async function DynamicInstitutionalPage({ params }: Params) {
  const { key } = await params;
  if (RESERVED.has(key)) notFound();

  const page = await getPublishedPageForRoute(key);
  if (!page) notFound();

  return <InstitutionalPage page={page} />;
}
