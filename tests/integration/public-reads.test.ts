import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { getPublicSettings } from "@/features/settings/application/settings-crud";
import { getPublishedPage } from "@/features/pages/application/public-page";
import {
  getPublicSolutionBySlug,
  listPublicSolutions,
} from "@/features/catalog/application/public-solutions";
import { listPublicSpecialists } from "@/features/people/application/public-specialists";
import {
  getPublicPostBySlug,
  listPublicPosts,
  searchPublicPosts,
} from "@/features/content/application/public-posts";
import { listPublicCategories } from "@/features/taxonomy/application/public-taxonomy";
import { createFixtures, doc, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Cobertura da superfície pública inteira (Home/Soluções/Sobre/Contato/Blog): cada leitura só
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

describe("getPublishedPage", () => {
  it("devolve null para chave inexistente ou não publicada", async () => {
    expect(await getPublishedPage(deps, uniq("pag-"))).toBeNull();
    const draft = await fx.page({ status: "DRAFT" });
    expect(await getPublishedPage(deps, draft.key)).toBeNull();
  });

  it("devolve a página quando publicada", async () => {
    const published = await fx.page({ status: "PUBLISHED", data: { body: doc("Texto.") } });
    const found = await getPublishedPage(deps, published.key);
    expect(found?.key).toBe(published.key);
  });
});

describe("listPublicSolutions / getPublicSolutionBySlug", () => {
  it("só lista soluções publicadas", async () => {
    const published = await fx.solution({ status: "PUBLISHED" });
    const draft = await fx.solution({ status: "DRAFT" });
    const slugs = (await listPublicSolutions(deps)).map((s) => s.slug);
    expect(slugs).toContain(published.slug);
    expect(slugs).not.toContain(draft.slug);
  });

  it("getPublicSolutionBySlug devolve null para rascunho ou inexistente", async () => {
    const draft = await fx.solution({ status: "DRAFT" });
    expect(await getPublicSolutionBySlug(deps, draft.slug)).toBeNull();
    expect(await getPublicSolutionBySlug(deps, uniq("sol-"))).toBeNull();
  });
});

describe("listPublicSpecialists", () => {
  it("só lista especialistas TEAM publicados (nunca GUEST nem rascunho)", async () => {
    const team = await fx.specialist({ kind: "TEAM", status: "PUBLISHED" });
    // GUEST nunca publica — é regra de negócio reforçada por CHECK no próprio banco
    // (specialists_guest_not_public), então nem dá para construir o estado "GUEST publicado".
    const guest = await fx.specialist({ kind: "GUEST", status: "DRAFT" });
    const draft = await fx.specialist({ kind: "TEAM", status: "DRAFT" });
    const slugs = (await listPublicSpecialists(deps)).map((s) => s.slug);
    expect(slugs).toContain(team.slug);
    expect(slugs).not.toContain(guest.slug);
    expect(slugs).not.toContain(draft.slug);
  });
});

describe("listPublicPosts / searchPublicPosts / getPublicPostBySlug", () => {
  let authorId: string;
  let categoryId: string;
  let categorySlug: string;

  beforeAll(async () => {
    authorId = (await fx.specialist({ kind: "TEAM", status: "PUBLISHED" })).id;
    const category = await fx.category();
    categoryId = category.id;
    categorySlug = category.slug;
  });

  it("rascunho nunca vaza para o público (lista, busca, nem por slug direto)", async () => {
    const draft = await fx.post({ authorId, status: "DRAFT", categoryId });
    const listed = (await listPublicPosts(deps)).items.map((p) => p.slug);
    expect(listed).not.toContain(draft.slug);
    expect(await getPublicPostBySlug(deps, draft.slug)).toBeNull();

    const searched = await searchPublicPosts(deps, draft.slug);
    expect(searched.items.map((p) => p.slug)).not.toContain(draft.slug);
  });

  it("artigo publicado aparece na lista e por slug, com a categoria primária", async () => {
    const published = await fx.post({
      authorId,
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

  it("filtro por categoria só traz posts dessa categoria primária", async () => {
    const otherCategory = await fx.category();
    const inCategory = await fx.post({ authorId, status: "PUBLISHED", categoryId });
    const otherPost = await fx.post({
      authorId,
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
    const authorId = (await fx.specialist({ kind: "TEAM", status: "PUBLISHED" })).id;
    const category = await fx.category();
    await fx.post({ authorId, status: "PUBLISHED", categoryId: category.id });
    await fx.post({ authorId, status: "DRAFT", categoryId: category.id });

    const found = (await listPublicCategories(deps)).find((c) => c.slug === category.slug);
    expect(found?.postCount).toBe(1);
  });
});

describe("getPublicSettings", () => {
  it("nunca dá erro mesmo sem sessão (não é uma leitura administrativa)", async () => {
    await expect(getPublicSettings(deps)).resolves.not.toThrow();
  });
});
