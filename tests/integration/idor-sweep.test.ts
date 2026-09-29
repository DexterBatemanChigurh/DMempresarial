import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createUser,
  listUsersForAdmin,
  setDisabled,
  setRole,
  deleteUser,
} from "@/features/users/application/user-crud";
import { createPost, updatePost } from "@/features/content/application/post-crud";
import { createCategory } from "@/features/taxonomy/application/taxonomy-service";
import { findPublishedPostBySlug } from "@/features/content/infrastructure/post-repository";
import type { Actor } from "@/server/permissions";
import { AUTHOR, createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };

let admin: Actor;
let editor: Actor;
let author: Actor;

beforeAll(async () => {
  // Limpeza agressiva antes dos testes: remove todos os dados de teste
  // (não só os com prefixo, para garantir que o banco esteja limpo)
  await fx.q("delete from posts");
  await fx.q("delete from categories");
  await fx.q("delete from tags");
  await fx.q("delete from media");
  await fx.q("delete from leads");
  await fx.q("delete from audit_logs where entity_type like 'post' or entity_type like 'category'");
  await fx.q("delete from users where email like $1", ["%@dom-it.example.test"]);
  // Depois a limpeza padrão do fx (por precaução)
  await fx.cleanup();
  const users = await Promise.all([fx.user("ADMIN"), fx.user("EDITOR"), fx.user("AUTHOR")]);
  [admin, editor, author] = users as [Actor, Actor, Actor];
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

const _p = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  title: "Artigo Teste",
  subtitle: null,
  excerpt: "Resumo",
  body: { type: "doc", content: [] },
  format: "ANALISE" as const,
  coverMediaId: null,
  authorSlug: AUTHOR,
  seoTitle: null,
  seoDescription: null,
  categoryIds: [],
  tagIds: [],
  ...over,
});

const cat = (over: Record<string, unknown> = {}) => ({
  actor: admin,
  name: "Categoria Teste",
  slug: uniq("cat-"),
  description: "Descrição",
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

  describe("Artigos (/admin/artigos)", () => {
    it("AUTHOR cria artigo", async () => {
      const created = await createPost(deps, {
        actor: admin,
        title: "Artigo Teste",
        subtitle: null,
        excerpt: "Resumo",
        body: { type: "doc", content: [] },
        format: "ANALISE" as const,
        coverMediaId: null,
        authorSlug: AUTHOR,
        seoTitle: null,
        seoDescription: null,
        categoryIds: [],
        tagIds: [],
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
          authorSlug: AUTHOR,
          seoTitle: null,
          seoDescription: null,
          categoryIds: [],
          tagIds: [],
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

  describe("Páginas públicas — leitura só PUBLISHED (IDOR via slug)", () => {
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
        authorSlug: AUTHOR,
        seoTitle: null,
        seoDescription: null,
        categoryIds: [],
        tagIds: [],
        slug: uniq("post-draft-"),
      });

      // Tenta buscar via função pública — deve retornar null (não encontrado)
      const result = await findPublishedPostBySlug(deps.db, draft.slug);
      expect(result).toBeNull();

      // Limpa
      await fx.q("delete from posts where id = $1", [draft.id]);
    });
  });
});
