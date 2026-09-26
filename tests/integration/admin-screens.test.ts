import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createTestimonial,
  deleteTestimonial,
  transitionTestimonial,
  updateTestimonial,
} from "@/features/proof/application/testimonial-crud";
import { listPublicTestimonials } from "@/features/proof/application/public-proof";
import {
  eraseLead,
  eraseSubscriber,
  exportActiveSubscribersCsv,
  exportLeadsCsv,
  getLeadForAdmin,
  listLeadsForAdmin,
  listSubscribersForAdmin,
  transitionLead,
} from "@/features/conversion/application/conversion-admin";
import {
  createManualRedirect,
  deleteRedirect,
  listRedirects,
} from "@/features/platform/application/redirect-admin";
import { getRedirect } from "@/features/platform/application/public-redirects";
import type { Actor } from "@/server/permissions";
import { createFixtures, EMAIL_DOMAIN, PREFIX, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Telas novas do painel (depoimentos, leads, newsletter, redirecionamentos) contra Postgres real,
 * pelo role de aplicação: permissão por papel, regras de estado, auditoria e exclusão LGPD.
 */
const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor;
let editor: Actor;
let author: Actor;

beforeAll(async () => {
  await fx.cleanup();
  [admin, editor, author] = await Promise.all([
    fx.user("ADMIN"),
    fx.user("EDITOR"),
    fx.user("AUTHOR"),
  ]);
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

async function auditCount(action: string, entityId?: string): Promise<number> {
  const rows = await q<{ n: string }>(
    `select count(*)::text as n from audit_logs where action = $1 ${entityId ? "and entity_id = $2" : ""}`,
    entityId ? [action, entityId] : [action],
  );
  return Number(rows[0]?.n ?? 0);
}

async function lead(over: { message?: string; status?: string } = {}): Promise<string> {
  const [row] = await q<{ id: string }>(
    `insert into leads (name, email, message, consent_at, consent_version, status)
     values ($1, $2, $3, now(), 'teste', $4::lead_status) returning id`,
    [
      `${PREFIX}Pessoa`,
      `${uniq("lead-")}${EMAIL_DOMAIN}`,
      over.message ?? "Quero conversar",
      over.status ?? "NEW",
    ],
  );
  return row!.id;
}

const testimonialInput = (over: Partial<Parameters<typeof createTestimonial>[1]> = {}) => ({
  actor: editor,
  authorName: uniq("autor-"),
  authorDetail: null,
  quote: "Trabalho sério e bem acompanhado.",
  rating: 5,
  source: "MANUAL" as const,
  givenAt: "2026-08-10",
  position: 0,
  ...over,
});

describe("depoimentos", () => {
  it("EDITOR cria, publica, edita, oculta e exclui; o público só vê enquanto publicado", async () => {
    const { id } = await createTestimonial(deps, testimonialInput());
    const isPublic = async () => (await listPublicTestimonials(deps)).some((t) => t.id === id);
    expect(await isPublic()).toBe(false);

    const published = await transitionTestimonial(deps, {
      actor: editor,
      id,
      to: "PUBLISHED",
      expectedVersion: 1,
    });
    expect(published.status).toBe("PUBLISHED");
    expect(await isPublic()).toBe(true);

    const edited = await updateTestimonial(deps, {
      ...testimonialInput({ quote: "Texto corrigido." }),
      id,
      expectedVersion: published.version,
    });
    const hidden = await transitionTestimonial(deps, {
      actor: editor,
      id,
      to: "ARCHIVED",
      expectedVersion: edited.version,
    });
    expect(hidden.status).toBe("ARCHIVED");
    expect(await isPublic()).toBe(false);

    await deleteTestimonial(deps, { actor: editor, id });
    expect(await auditCount("testimonial.deleted", id)).toBe(1);
  });

  it("AUTHOR não gerencia depoimentos", async () => {
    await expect(
      createTestimonial(deps, testimonialInput({ actor: author })),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("versão desatualizada → CONFLICT; transição inválida → DOMAIN_RULE; campo inválido → VALIDATION", async () => {
    const { id } = await createTestimonial(deps, testimonialInput());
    await expect(
      updateTestimonial(deps, { ...testimonialInput(), id, expectedVersion: 99 }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
    await expect(
      transitionTestimonial(deps, { actor: editor, id, to: "ARCHIVED", expectedVersion: 1 }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
    await expect(
      createTestimonial(deps, testimonialInput({ rating: 7, quote: " " })),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { rating: expect.any(Array) } });
  });

  it("o seed trouxe as avaliações reais do Google publicadas", async () => {
    const rows = await q(
      "select 1 from testimonials where source = 'GOOGLE' and status = 'PUBLISHED'",
    );
    expect(rows.length).toBeGreaterThanOrEqual(10);
  });
});

describe("leads (só ADMIN)", () => {
  it("EDITOR e AUTHOR não listam, não abrem, não exportam, não alteram, não excluem", async () => {
    const id = await lead();
    for (const actor of [editor, author]) {
      await expect(listLeadsForAdmin(deps, actor, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(getLeadForAdmin(deps, actor, id)).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(exportLeadsCsv(deps, actor, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        transitionLead(deps, { actor, id, from: "NEW", to: "CONTACTED" }),
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(eraseLead(deps, { actor, id })).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    await expect(listLeadsForAdmin(deps, null, {})).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
  });

  it("ADMIN segue o fluxo NEW → CONTACTED → QUALIFIED, com auditoria sem dado pessoal", async () => {
    const id = await lead();
    await transitionLead(deps, { actor: admin, id, from: "NEW", to: "CONTACTED" });
    await transitionLead(deps, { actor: admin, id, from: "CONTACTED", to: "QUALIFIED" });
    const { lead: detail, transitions } = await getLeadForAdmin(deps, admin, id);
    expect(detail.status).toBe("QUALIFIED");
    expect(detail.statusChangedAt).not.toBeNull();
    expect(transitions).toEqual(["DISCARDED"]);
    const [audit] = await q<{ metadata: Record<string, unknown> }>(
      "select metadata from audit_logs where action = 'lead.status_changed' and entity_id = $1 order by at desc limit 1",
      [id],
    );
    expect(audit?.metadata).toEqual({ from: "CONTACTED", to: "QUALIFIED" });
  });

  it("transição fora da máquina de estados → DOMAIN_RULE; estado já mudado por outra pessoa → CONFLICT", async () => {
    const id = await lead();
    await expect(
      transitionLead(deps, { actor: admin, id, from: "NEW", to: "QUALIFIED" }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
    await transitionLead(deps, { actor: admin, id, from: "NEW", to: "CONTACTED" });
    await expect(
      transitionLead(deps, { actor: admin, id, from: "NEW", to: "SPAM" }),
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });

  it("exportação neutraliza fórmula vinda do formulário e fica na auditoria", async () => {
    await lead({ message: '=HYPERLINK("http://golpe.test","clique")' });
    const before = await auditCount("lead.exported");
    const { csv } = await exportLeadsCsv(deps, admin, {});
    expect(csv).toContain(`'=HYPERLINK`);
    expect(csv).not.toMatch(/;=HYPERLINK/);
    expect(await auditCount("lead.exported")).toBe(before + 1);
  });

  it("exclusão (LGPD) apaga a linha e deixa só o rastro", async () => {
    const id = await lead();
    await eraseLead(deps, { actor: admin, id });
    expect(await q("select 1 from leads where id = $1", [id])).toHaveLength(0);
    expect(await auditCount("lead.erased", id)).toBe(1);
    await expect(getLeadForAdmin(deps, admin, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("assinantes da newsletter (só ADMIN)", () => {
  async function subscriber(status: "PENDING" | "ACTIVE"): Promise<string> {
    const [row] = await q<{ id: string }>(
      `insert into newsletter_subscribers (email, status, consent_at, consent_version, confirmed_at)
       values ($1, $2::subscriber_status, now(), 'teste', ${status === "ACTIVE" ? "now()" : "null"}) returning id`,
      [`${uniq("sub-")}${EMAIL_DOMAIN}`, status],
    );
    return row!.id;
  }

  it("exporta só quem confirmou (ACTIVE)", async () => {
    await subscriber("ACTIVE");
    const pendingId = await subscriber("PENDING");
    const [pending] = await q<{ email: string }>(
      "select email from newsletter_subscribers where id = $1",
      [pendingId],
    );
    const { csv } = await exportActiveSubscribersCsv(deps, admin);
    expect(csv).not.toContain(pending!.email);
  });

  it("EDITOR não vê nem exclui; ADMIN exclui com rastro", async () => {
    const id = await subscriber("ACTIVE");
    await expect(listSubscribersForAdmin(deps, editor, {})).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(eraseSubscriber(deps, { actor: editor, id })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await eraseSubscriber(deps, { actor: admin, id });
    expect(await auditCount("newsletter.erased", id)).toBe(1);
  });
});

describe("redirecionamentos", () => {
  const path = (label: string) => `/blog/${uniq(label)}`;

  it("EDITOR cria um manual e o Proxy passa a resolver o endereço", async () => {
    const from = path("velho-");
    const to = path("novo-");
    await createManualRedirect(deps, { actor: editor, fromPath: `${from}/`, toPath: to });
    expect(await getRedirect(deps, from)).toEqual({ toPath: to, statusCode: 301 });
  });

  it("nunca forma cadeia: destino que já redireciona é seguido, e quem apontava para a origem é reapontado", async () => {
    const a = path("a-");
    const b = path("b-");
    const c = path("c-");
    await createManualRedirect(deps, { actor: editor, fromPath: b, toPath: c });
    // a → b vira a → c
    const created = await createManualRedirect(deps, { actor: editor, fromPath: a, toPath: b });
    expect(created.toPath).toBe(c);
    // c → d: quem apontava para c (a e b) passa a apontar direto para d
    const d = path("d-");
    await createManualRedirect(deps, { actor: editor, fromPath: c, toPath: d });
    expect((await getRedirect(deps, a))?.toPath).toBe(d);
    expect((await getRedirect(deps, b))?.toPath).toBe(d);
  });

  it("recusa laço, origem duplicada, origem fora de conteúdo e destino externo", async () => {
    const a = path("la-");
    const b = path("lb-");
    await createManualRedirect(deps, { actor: editor, fromPath: a, toPath: b });
    await expect(
      createManualRedirect(deps, { actor: editor, fromPath: b, toPath: a }),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { toPath: expect.any(Array) } });
    await expect(
      createManualRedirect(deps, { actor: editor, fromPath: a, toPath: path("x-") }),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { fromPath: expect.any(Array) } });
    await expect(
      createManualRedirect(deps, { actor: editor, fromPath: "/contato", toPath: "/blog" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      createManualRedirect(deps, { actor: editor, fromPath: path("e-"), toPath: "//golpe.test" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("AUTHOR não gerencia; remoção fica na auditoria", async () => {
    await expect(listRedirects(deps, author)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const from = path("rm-");
    const { id } = await createManualRedirect(deps, {
      actor: admin,
      fromPath: from,
      toPath: "/blog",
    });
    await deleteRedirect(deps, { actor: admin, id });
    expect(await getRedirect(deps, from)).toBeNull();
    expect(await auditCount("redirect.deleted", id)).toBe(1);
  });
});
