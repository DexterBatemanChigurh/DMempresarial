import { describe, expect, it } from "vitest";
import { canTransitionLead, normalizeEmail } from "./conversion/domain/lead";
import {
  POST_STATUSES,
  POST_TRANSITIONS,
  canTransition,
  isPubliclyVisible,
  requiresPublishChecks,
  type PostStatus,
} from "./content/domain/post-status";
import { postPublishBlockers, type PostForPublish } from "./content/domain/publish-rules";

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
    authorSlug: "especialista-dm",
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
      authorSlug: null,
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

describe("leads", () => {
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
});
