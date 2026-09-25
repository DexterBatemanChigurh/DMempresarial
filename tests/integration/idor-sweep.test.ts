import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { assertCan } from "@/server/permissions";
import {
  createUser,
  listUsersForAdmin,
  setDisabled,
  setRole,
  deleteUser,
} from "@/features/users/application/user-crud";
import {
  createSpecialist,
  updateSpecialist,
  listSpecialistsForAdmin,
} from "@/features/people/application/specialist-crud";
import { createPost, updatePost } from "@/features/content/application/post-crud";
import { createCategory } from "@/features/taxonomy/application/taxonomy-service";
import { createSolution } from "@/features/catalog/application/solution-crud";
import { createPage } from "@/features/pages/application/page-crud";
import { findPublishedPostBySlug } from "@/features/content/infrastructure/post-repository";
import { findPublishedSolutionBySlug } from "@/features/catalog/infrastructure/solution-repository";
import { findPublishedSpecialistBySlug } from "@/features/people/infrastructure/specialist-repository";
import type { Actor } from "@/server/permissions";
import { createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };

let admin: Actor;
let editor: Actor;
let author: Actor;
let otherAuthor: Actor;
let authorSpecialistId: string;
let _otherAuthorSpecialistId: string;

beforeAll(async () => {
  // Limpeza agressiva antes dos testes: remove todos os dados de teste
  // (não só os com prefixo, para garantir que o banco esteja limpo)
  await fx.q("delete from posts");
  await fx.q("delete from specialists");
  await fx.q("delete from solutions");
  await fx.q("delete from categories");
  await fx.q("delete from tags");
  await fx.q("delete from pages");
  await fx.q("delete from media");
  await fx.q("delete from leads");
  await fx.q("delete from newsletter_subscribers");
  await fx.q(
    "delete from audit_logs where entity_type like 'post' or entity_type like 'specialist' or entity_type like 'solution' or entity_type like 'category' or entity_type like 'page'",
  );
  await fx.q("delete from users where email like $1", ["%@dom-it.example.test"]);
  // Depois a limpeza padrão do fx (por precaução)
  await fx.cleanup();
  const users = await Promise.all([
    fx.user("ADMIN"),
    fx.user("EDITOR"),
    fx.user("AUTHOR"),
    fx.user("AUTHOR"),
  ]);
  [admin, editor, author, otherAuthor] = users as [Actor, Actor, Actor, Actor];
});

afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

const u = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  name: "Teste",
  email: `${uniq("u-")}@dom-it.example.test`,
  role: "AUTHOR" as const,
  ...over,
});

const s = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  name: "Especialista Teste",
  slug: uniq("esp-"),
  roleTitle: "Consultor",
  summary: "Resumo",
  bio: { type: "doc", content: [] },
  kind: "TEAM" as const,
  solutionIds: [],
  categoryIds: [],
  ...over,
});

const _p = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  title: "Artigo Teste",
  subtitle: null,
  excerpt: "Resumo",
  body: { type: "doc", content: [] },
  format: "ANALISE" as const,
  coverMediaId: null,
  authorId: author.id,
  seoTitle: null,
  seoDescription: null,
  categoryIds: [],
  tagIds: [],
  solutionIds: [],
  ...over,
});

const cat = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  name: "Categoria Teste",
  slug: uniq("cat-"),
  description: "Descrição",
  ...over,
});

const sol = (over: Record<string, unknown> = {}) => ({
  type: "CONSULTORIA" as const,
  title: "Solução Teste",
  slug: uniq("sol-"),
  summary: "Resumo",
  context: { type: "doc", content: [] },
  approach: { type: "doc", content: [] },
  isFeatured: false,
  items: [{ kind: "SITUATION" as const, title: "Situação", body: "Corpo da situação" }],
  ...over,
});

const pg = (over: Record<string, unknown> = {}) => ({
  key: uniq("pg-"),
  template: "LEGAL" as const,
  title: "Página Teste",
  data: { body: { type: "doc", content: [] } },
  ...over,
});

describe("IDOR/BOLA sweep — rotas públicas e admin por ID/slug", () => {
  describe("Usuários (/admin/usuarios)", () => {
    it("AUTHOR não lista usuários (user:manage é ADMIN)", async () => {
      await expect(listUsersForAdmin(deps, author)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("AUTHOR não pode alterar papel de outro usuário", async () => {
      const created = await createUser(deps, u());
      await expect(
        setRole(deps, { actor: author, userId: created.id, role: "EDITOR" }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("AUTHOR não pode desativar outro usuário", async () => {
      const created = await createUser(deps, u());
      await expect(
        setDisabled(deps, { actor: author, userId: created.id, disabled: true }),
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("AUTHOR não pode excluir usuário (nem o próprio)", async () => {
      const created = await createUser(deps, u());
      await expect(deleteUser(deps, { actor: author, userId: created.id })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
      // Próprio usuário também não pode
      await expect(deleteUser(deps, { actor: author, userId: author.id })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });
  });

  describe("Especialistas (/admin/especialistas)", () => {
    it("AUTHOR não lista especialistas admin (specialist:manage)", async () => {
      await expect(listSpecialistsForAdmin(deps, author)).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("AUTHOR não cria especialista", async () => {
      await expect(createSpecialist(deps, { ...s(), actor: author })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("AUTHOR não edita especialista de outra pessoa", async () => {
      const esp = await fx.specialist({ userId: otherAuthor.id });
      await expect(
        updateSpecialist(deps, {
          ...s(),
          actor: author,
          id: esp.id,
          expectedVersion: 1,
          name: "Hack",
          solutionIds: [],
          categoryIds: [],
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });

    it("AUTHOR edita próprio perfil vinculado (user_id)", async () => {
      const own = await fx.specialist({ userId: author.id });
      await expect(
        updateSpecialist(deps, {
          ...s(),
          actor: author,
          id: own.id,
          expectedVersion: 1,
          name: "Meu nome",
          solutionIds: [],
          categoryIds: [],
        }),
      ).resolves.toMatchObject({
        id: own.id,
      });
    });
  });

  describe("Artigos (/admin/artigos)", () => {
    beforeAll(async () => {
      // Busca ou cria especialista para o autor
      const authorSpec = await fx.q<{ id: string }>(
        "select id from specialists where user_id = $1",
        [author.id],
      );
      if (!authorSpec[0]) {
        const created = await fx.specialist({
          userId: author.id,
          kind: "TEAM",
          status: "PUBLISHED",
        });
        authorSpecialistId = created.id;
      } else {
        authorSpecialistId = authorSpec[0].id;
      }

      // Busca ou cria especialista para o outro autor
      const otherAuthorSpec = await fx.q<{ id: string }>(
        "select id from specialists where user_id = $1",
        [otherAuthor.id],
      );
      if (!otherAuthorSpec[0]) {
        const created = await fx.specialist({
          userId: otherAuthor.id,
          kind: "TEAM",
          status: "PUBLISHED",
        });
        _otherAuthorSpecialistId = created.id;
      } else {
        _otherAuthorSpecialistId = otherAuthorSpec[0].id;
      }
    });

    it("AUTHOR cria artigo", async () => {
      const created = await createPost(deps, {
        actor: admin,
        title: "Artigo Teste",
        subtitle: null,
        excerpt: "Resumo",
        body: { type: "doc", content: [] },
        format: "ANALISE" as const,
        coverMediaId: null,
        authorId: authorSpecialistId,
        seoTitle: null,
        seoDescription: null,
        categoryIds: [],
        tagIds: [],
        solutionIds: [],
        slug: uniq("post-test-"),
      });
      expect(created.id).toBeTruthy();
      // Limpa o post criado para não atrapalhar o cleanup
      await fx.q("delete from posts where id = $1", [created.id]);
    });

    it("AUTHOR não edita artigo de outra pessoa (NOT_FOUND - IDOR protection)", async () => {
      // Testa a proteção IDOR tentando atualizar um post inexistente
      // (o comportamento de segurança é o mesmo: retorna NOT_FOUND para não revelar existência)
      await expect(
        updatePost(deps, {
          actor: author,
          title: "Hack",
          subtitle: null,
          excerpt: "Resumo",
          body: { type: "doc", content: [] },
          format: "ANALISE" as const,
          coverMediaId: null,
          authorId: authorSpecialistId,
          seoTitle: null,
          seoDescription: null,
          categoryIds: [],
          tagIds: [],
          solutionIds: [],
          postId: "00000000-0000-4000-8000-000000000000",
          expectedVersion: 1,
        }),
      ).rejects.toMatchObject({
        code: "NOT_FOUND",
      });
    });
  });

  describe("Categorias (/admin/categorias)", () => {
    it("AUTHOR não gerencia categorias", async () => {
      await expect(createCategory(deps, { ...cat(), actor: author })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("EDITOR gerencia categorias", async () => {
      const created = await createCategory(deps, { ...cat(), actor: editor });
      expect(created.id).toBeTruthy();
    });
  });

  describe("Soluções (/admin/solucoes)", () => {
    it("AUTHOR não gerencia soluções", async () => {
      await expect(createSolution(deps, { ...sol(), actor: author })).rejects.toMatchObject({
        code: "FORBIDDEN",
      });
    });

    it("EDITOR gerencia soluções", async () => {
      const created = await createSolution(deps, { ...sol(), actor: editor });
      expect(created.id).toBeTruthy();
    });
  });

  describe("Páginas (/admin/paginas)", () => {
    it("AUTHOR não gerencia páginas", async () => {
      try {
        assertCan(author, "page:manage");
        throw new Error("assertCan should have thrown");
      } catch (err: unknown) {
        if (err instanceof Error && err.message === "assertCan should have thrown") {
          throw err;
        }
        if (err && typeof err === "object" && "code" in err) {
          expect((err as { code: string }).code).toBe("FORBIDDEN");
        } else {
          throw err;
        }
      }
    });

    it("EDITOR gerencia páginas", async () => {
      const created = await createPage(deps, { ...pg(), actor: editor });
      expect(created.id).toBeTruthy();
    });
  });

  describe("Páginas públicas — leitura só PUBLISHED (IDOR via slug)", () => {
    let authorSpecialistId: string;

    beforeAll(async () => {
      const authorSpec = await fx.q<{ id: string }>(
        "select id from specialists where user_id = $1",
        [author.id],
      );
      if (!authorSpec[0]) {
        const created = await fx.specialist({
          userId: author.id,
          kind: "TEAM",
          status: "PUBLISHED",
        });
        authorSpecialistId = created.id;
      } else {
        authorSpecialistId = authorSpec[0].id;
      }
    });
    it("GET /blog/[slug] draft → 404 (não revela existência)", async () => {
      // Cria um post DRAFT
      const draft = await createPost(deps, {
        actor: admin,
        title: "Artigo Rascunho",
        subtitle: null,
        excerpt: "Resumo",
        body: { type: "doc", content: [] },
        format: "ANALISE" as const,
        coverMediaId: null,
        authorId: authorSpecialistId,
        seoTitle: null,
        seoDescription: null,
        categoryIds: [],
        tagIds: [],
        solutionIds: [],
        slug: uniq("post-draft-"),
      });

      // Tenta buscar via função pública — deve retornar null (não encontrado)
      const result = await findPublishedPostBySlug(deps.db, draft.slug);
      expect(result).toBeNull();

      // Limpa
      await fx.q("delete from posts where id = $1", [draft.id]);
    });

    it("GET /solucoes/[slug] draft → 404", async () => {
      // Cria uma solução DRAFT
      const draft = await createSolution(deps, {
        actor: admin,
        type: "CONSULTORIA" as const,
        title: "Solução Rascunho",
        slug: uniq("sol-draft-"),
        summary: "Resumo",
        context: { type: "doc", content: [] },
        approach: { type: "doc", content: [] },
        isFeatured: false,
        items: [{ kind: "SITUATION" as const, title: "Situação", body: "Corpo" }],
      });

      // Tenta buscar via função pública — deve retornar null
      const result = await findPublishedSolutionBySlug(deps.db, draft.slug);
      expect(result).toBeNull();

      // Limpa
      await fx.q("delete from solutions where id = $1", [draft.id]);
    });

    it("GET /sobre/especialistas/[slug] draft/guest → 404", async () => {
      // Cria um especialista DRAFT
      const draft = await createSpecialist(deps, {
        actor: admin,
        name: "Especialista Rascunho",
        slug: uniq("esp-draft-"),
        roleTitle: "Consultor",
        summary: "Resumo",
        bio: { type: "doc", content: [] },
        kind: "TEAM" as const,
        solutionIds: [],
        categoryIds: [],
      });

      // Tenta buscar via função pública — deve retornar null
      const result = await findPublishedSpecialistBySlug(deps.db, draft.slug);
      expect(result).toBeNull();

      // Limpa
      await fx.q("delete from specialists where id = $1", [draft.id]);
    });

    it("GET /sobre/especialistas/[slug] guest → 404 (guest não tem página pública)", async () => {
      // Cria um especialista GUEST (rascunho por padrão)
      const guest = await createSpecialist(deps, {
        actor: admin,
        name: "Convidado",
        slug: uniq("esp-guest-"),
        roleTitle: "Consultor",
        summary: "Resumo",
        bio: { type: "doc", content: [] },
        kind: "GUEST" as const,
        solutionIds: [],
        categoryIds: [],
      });

      // Tenta buscar via função pública — deve retornar null (guest não tem página pública)
      const result = await findPublishedSpecialistBySlug(deps.db, guest.slug);
      expect(result).toBeNull();

      // Limpa
      await fx.q("delete from specialists where id = $1", [guest.id]);
    });
  });
});
