import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { getPublicSettings } from "@/features/settings/application/settings-crud";
import {
  getPublicPostBySlug,
  listPublicPosts,
  searchPublicPosts,
} from "@/features/content/application/public-posts";
import { listPublicCategories } from "@/features/taxonomy/application/public-taxonomy";
import { AUTHOR, createFixtures } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Cobertura da superfície pública que vem do banco (Blog, categorias, configurações): cada leitura só
 * `PUBLISHED` sai daqui, e sem dado a lista/objeto vem vazio — nunca um rascunho, nunca erro.
 * Testa as funções `{ db }` diretamente (sem `"use cache"`, que só existe em runtime Next).
 */
const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };

beforeAll(async () => {
  await fx.cleanup();
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

describe("listPublicPosts / searchPublicPosts / getPublicPostBySlug", () => {
  let categoryId: string;
  let categorySlug: string;

  beforeAll(async () => {
    const category = await fx.category();
    categoryId = category.id;
    categorySlug = category.slug;
  });

  it("rascunho nunca vaza para o público (lista, busca, nem por slug direto)", async () => {
    const draft = await fx.post({ status: "DRAFT", categoryId });
    const listed = (await listPublicPosts(deps)).items.map((p) => p.slug);
    expect(listed).not.toContain(draft.slug);
    expect(await getPublicPostBySlug(deps, draft.slug)).toBeNull();

    const searched = await searchPublicPosts(deps, draft.slug);
    expect(searched.items.map((p) => p.slug)).not.toContain(draft.slug);
  });

  it("artigo publicado aparece na lista e por slug, com a categoria primária", async () => {
    const published = await fx.post({
      status: "PUBLISHED",
      categoryId,
      bodyText: "Texto publicado de verdade",
    });
    const found = await getPublicPostBySlug(deps, published.slug);
    expect(found?.slug).toBe(published.slug);
    expect(found?.primaryCategorySlug).toBe(categorySlug);

    const listed = await listPublicPosts(deps);
    expect(listed.items.some((p) => p.slug === published.slug)).toBe(true);
  });

  it("o nome do autor vem da lista fixa de especialistas (src/content/dm.ts)", async () => {
    const published = await fx.post({ authorSlug: AUTHOR, status: "PUBLISHED", categoryId });
    const found = await getPublicPostBySlug(deps, published.slug);
    expect(found?.authorSlug).toBe(AUTHOR);
    expect(found?.authorName).toBe("Especialista DM");
  });

  it("filtro por categoria só traz posts dessa categoria primária", async () => {
    const otherCategory = await fx.category();
    const inCategory = await fx.post({ status: "PUBLISHED", categoryId });
    const otherPost = await fx.post({
      status: "PUBLISHED",
      categoryId: otherCategory.id,
    });

    const filtered = await listPublicPosts(deps, { categorySlug, pageSize: 50 });
    const slugs = filtered.items.map((p) => p.slug);
    expect(slugs).toContain(inCategory.slug);
    expect(slugs).not.toContain(otherPost.slug);
  });
});

describe("listPublicCategories", () => {
  it("conta só artigos publicados por categoria", async () => {
    const category = await fx.category();
    await fx.post({ status: "PUBLISHED", categoryId: category.id });
    await fx.post({ status: "DRAFT", categoryId: category.id });

    const found = (await listPublicCategories(deps)).find((c) => c.slug === category.slug);
    expect(found?.postCount).toBe(1);
  });
});

describe("getPublicSettings", () => {
  it("nunca dá erro mesmo sem sessão (não é uma leitura administrativa)", async () => {
    await expect(getPublicSettings(deps)).resolves.not.toThrow();
  });
});
