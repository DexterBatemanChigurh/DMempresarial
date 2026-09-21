import { describe, expect, it } from "vitest";
import {
  canTransitionLead,
  canTransitionSubscriber,
  normalizeEmail,
} from "./conversion/domain/lead";
import { solutionPublishBlockers } from "./catalog/domain/solution-rules";
import {
  POST_STATUSES,
  POST_TRANSITIONS,
  canTransition,
  isPubliclyVisible,
  requiresPublishChecks,
  type PostStatus,
} from "./content/domain/post-status";
import { postPublishBlockers, type PostForPublish } from "./content/domain/publish-rules";
import { specialistPublishBlockers } from "./people/domain/specialist-rules";

const doc = (text: string) => ({
  type: "doc",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

describe("máquina de estados do artigo", () => {
  it("permite exatamente as transições do blueprint", () => {
    expect(POST_TRANSITIONS).toEqual({
      DRAFT: ["REVIEW", "SCHEDULED", "PUBLISHED"],
      REVIEW: ["DRAFT", "SCHEDULED", "PUBLISHED"],
      SCHEDULED: ["DRAFT", "PUBLISHED"],
      PUBLISHED: ["ARCHIVED"],
      ARCHIVED: ["DRAFT"],
    });
  });

  it("recusa toda transição fora da tabela (produto cartesiano completo)", () => {
    for (const from of POST_STATUSES) {
      for (const to of POST_STATUSES) {
        const allowed = (POST_TRANSITIONS[from] as readonly PostStatus[]).includes(to);
        expect(canTransition(from, to), `${from} → ${to}`).toBe(allowed);
      }
    }
  });

  it("um artigo publicado NÃO volta a rascunho direto: só arquiva", () => {
    expect(canTransition("PUBLISHED", "DRAFT")).toBe(false);
    expect(canTransition("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransition("DRAFT", "ARCHIVED")).toBe(false);
  });

  it("só PUBLISHED é visível ao público", () => {
    for (const status of POST_STATUSES) {
      expect(isPubliclyVisible(status)).toBe(status === "PUBLISHED");
    }
  });

  it("publicar e agendar exigem os pré-requisitos; os demais estados não", () => {
    expect(POST_STATUSES.filter(requiresPublishChecks)).toEqual(["SCHEDULED", "PUBLISHED"]);
  });
});

describe("pré-requisitos de publicação do artigo", () => {
  const ok: PostForPublish = {
    title: "Um título",
    slug: "um-titulo",
    authorId: "a1",
    primaryCategoryId: "c1",
    body: doc("texto"),
    coverMediaId: null,
    coverAltText: null,
  };
  const codes = (post: PostForPublish, options?: Parameters<typeof postPublishBlockers>[1]) =>
    postPublishBlockers(post, options).map((b) => b.code);

  it("artigo completo não tem impedimentos", () => {
    expect(codes(ok)).toEqual([]);
  });

  it("lista TODOS os impedimentos de uma vez, com mensagem legível", () => {
    const blockers = postPublishBlockers({
      ...ok,
      title: "  ",
      slug: "Slug Inválido",
      authorId: null,
      primaryCategoryId: null,
      body: doc(""),
    });
    expect(blockers.map((b) => b.code)).toEqual([
      "TITLE_MISSING",
      "SLUG_INVALID",
      "AUTHOR_MISSING",
      "PRIMARY_CATEGORY_MISSING",
      "BODY_EMPTY",
    ]);
    expect(blockers.every((b) => b.message.length > 5)).toBe(true);
  });

  it("slug reservado não publica", () => {
    expect(codes({ ...ok, slug: "admin" })).toEqual(["SLUG_RESERVED"]);
  });

  it("capa sem texto alternativo bloqueia; sem capa, não", () => {
    expect(codes({ ...ok, coverMediaId: "m1", coverAltText: null })).toEqual(["COVER_ALT_MISSING"]);
    expect(codes({ ...ok, coverMediaId: "m1", coverAltText: "   " })).toEqual([
      "COVER_ALT_MISSING",
    ]);
    expect(codes({ ...ok, coverMediaId: "m1", coverAltText: "Pessoas em reunião" })).toEqual([]);
    expect(codes({ ...ok, coverMediaId: null, coverAltText: null })).toEqual([]);
  });

  it("agendamento exige data futura", () => {
    const now = new Date("2026-06-01T12:00:00Z");
    const scheduling = { scheduling: true, now };
    expect(codes(ok, { ...scheduling, scheduledFor: null })).toEqual(["SCHEDULE_DATE_MISSING"]);
    expect(codes(ok, { ...scheduling, scheduledFor: new Date("2026-06-01T12:00:00Z") })).toEqual([
      "SCHEDULE_IN_PAST",
    ]);
    expect(codes(ok, { ...scheduling, scheduledFor: new Date("2026-05-01T00:00:00Z") })).toEqual([
      "SCHEDULE_IN_PAST",
    ]);
    expect(codes(ok, { ...scheduling, scheduledFor: new Date("2026-06-02T00:00:00Z") })).toEqual(
      [],
    );
  });
});

describe("pré-requisitos de publicação da solução", () => {
  const ok = {
    title: "Título",
    slug: "consultoria-de-gestao",
    summary: "Quando a empresa cresce sem estrutura…",
    context: doc("contexto"),
    approach: doc("abordagem"),
  };

  it("exige Hero (título + resumo), Contexto e Abordagem", () => {
    expect(solutionPublishBlockers(ok)).toEqual([]);
    const codes = solutionPublishBlockers({
      ...ok,
      title: "",
      summary: " ",
      context: null,
      approach: doc(""),
    }).map((b) => b.code);
    expect(codes).toEqual([
      "TITLE_MISSING",
      "SUMMARY_MISSING",
      "CONTEXT_MISSING",
      "APPROACH_MISSING",
    ]);
  });

  it("slug reservado (ex.: 'servicos') não publica", () => {
    expect(solutionPublishBlockers({ ...ok, slug: "servicos" }).map((b) => b.code)).toEqual([
      "SLUG_RESERVED",
    ]);
  });
});

describe("pré-requisitos de publicação do especialista", () => {
  const ok = {
    kind: "TEAM" as const,
    name: "Nome Real",
    slug: "nome-real",
    roleTitle: "Cargo",
    summary: "Resumo confirmado.",
    photoMediaId: "m1",
  };

  it("exige nome, cargo, foto e resumo, e só isso (nada de formação inventada)", () => {
    expect(specialistPublishBlockers(ok)).toEqual([]);
    const codes = specialistPublishBlockers({
      ...ok,
      name: "",
      roleTitle: null,
      summary: "  ",
      photoMediaId: null,
    }).map((b) => b.code);
    expect(codes).toEqual([
      "NAME_MISSING",
      "ROLE_TITLE_MISSING",
      "PHOTO_MISSING",
      "SUMMARY_MISSING",
    ]);
  });

  it("autor convidado nunca é publicável, mesmo com todos os campos", () => {
    expect(specialistPublishBlockers({ ...ok, kind: "GUEST" }).map((b) => b.code)).toEqual([
      "GUEST_NOT_PUBLISHABLE",
    ]);
  });
});

describe("leads e assinantes", () => {
  it("normaliza e-mail (espaços e caixa)", () => {
    expect(normalizeEmail("  Pessoa@Exemplo.COM ")).toBe("pessoa@exemplo.com");
  });

  it("lead: fluxo comercial válido; descartado é definitivo; spam pode ser resgatado", () => {
    expect(canTransitionLead("NEW", "CONTACTED")).toBe(true);
    expect(canTransitionLead("CONTACTED", "QUALIFIED")).toBe(true);
    expect(canTransitionLead("NEW", "QUALIFIED")).toBe(false);
    expect(canTransitionLead("DISCARDED", "NEW")).toBe(false);
    expect(canTransitionLead("QUALIFIED", "NEW")).toBe(false);
    expect(canTransitionLead("SPAM", "NEW")).toBe(true);
  });

  it("assinante: voltar após descadastro exige NOVO aceite (PENDING), nunca ACTIVE direto", () => {
    expect(canTransitionSubscriber("PENDING", "ACTIVE")).toBe(true);
    expect(canTransitionSubscriber("UNSUBSCRIBED", "ACTIVE")).toBe(false);
    expect(canTransitionSubscriber("UNSUBSCRIBED", "PENDING")).toBe(true);
    expect(canTransitionSubscriber("BOUNCED", "ACTIVE")).toBe(false);
    expect(canTransitionSubscriber("ACTIVE", "PENDING")).toBe(false);
  });
});
