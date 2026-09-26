import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { listPublicSolutionsForRoute } from "@/features/catalog/application/public-solutions";
import { listPublicPostsForRoute } from "@/features/content/application/public-posts";
import { listPublicSpecialistsForRoute } from "@/features/people/application/public-specialists";
import { listPublicCategoriesForRoute } from "@/features/taxonomy/application/public-taxonomy";
import { listPublicTestimonialsForRoute } from "@/features/proof/application/public-proof";
import { env } from "@/server/env";

// Só o público (docs/03, critério de saída da Fase 5/8): nada de rascunho, `/admin` ou `/api`.
// Lido a cada requisição (`connection()`), não no build — mesmo motivo do `robots.ts`.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const base = env().SITE_URL;
  const url = (path: string) => `${base}${path}`;

  const [solutions, specialists, posts, categories, testimonials] = await Promise.all([
    listPublicSolutionsForRoute(),
    listPublicSpecialistsForRoute(),
    listPublicPostsForRoute({ pageSize: 50 }),
    listPublicCategoriesForRoute(),
    listPublicTestimonialsForRoute(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: url("/"), changeFrequency: "weekly", priority: 1 },
    { url: url("/sobre"), changeFrequency: "monthly", priority: 0.8 },
    { url: url("/sobre/especialistas"), changeFrequency: "monthly", priority: 0.6 },
    { url: url("/solucoes"), changeFrequency: "monthly", priority: 0.9 },
    { url: url("/servicos"), changeFrequency: "monthly", priority: 0.7 },
    { url: url("/blog"), changeFrequency: "daily", priority: 0.8 },
    { url: url("/contato"), changeFrequency: "yearly", priority: 0.5 },
    { url: url("/politica-de-privacidade"), changeFrequency: "yearly", priority: 0.1 },
    { url: url("/termos-de-uso"), changeFrequency: "yearly", priority: 0.1 },
  ];

  const solutionRoutes: MetadataRoute.Sitemap = solutions.map((s) => ({
    url: url(`/solucoes/${s.slug}`),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const specialistRoutes: MetadataRoute.Sitemap = specialists.map((p) => ({
    url: url(`/sobre/especialistas/${p.slug}`),
    changeFrequency: "monthly",
    priority: 0.5,
  }));

  const postRoutes: MetadataRoute.Sitemap = posts.items.map((p) => ({
    url: url(`/blog/${p.slug}`),
    lastModified: p.publishedAt ?? undefined,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((c) => ({
    url: url(`/blog/categoria/${c.slug}`),
    changeFrequency: "weekly",
    priority: 0.4,
  }));

  // Sem depoimento publicado a página é só um estado vazio: fica fora do índice.
  const proofRoutes: MetadataRoute.Sitemap =
    testimonials.length > 0
      ? [{ url: url("/depoimentos"), changeFrequency: "monthly", priority: 0.5 }]
      : [];

  return [
    ...staticRoutes,
    ...proofRoutes,
    ...solutionRoutes,
    ...specialistRoutes,
    ...postRoutes,
    ...categoryRoutes,
  ];
}
