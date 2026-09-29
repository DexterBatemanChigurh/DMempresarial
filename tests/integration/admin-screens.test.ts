import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  eraseLead,
  exportLeadsCsv,
  getLeadForAdmin,
  listLeadsForAdmin,
  transitionLead,
} from "@/features/conversion/application/conversion-admin";
import type { Actor } from "@/server/permissions";
import { createFixtures, EMAIL_DOMAIN, PREFIX, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Telas novas do painel (leads, redirecionamentos) contra Postgres real, pelo role
 * de aplicação: permissão por papel, regras de estado, auditoria e exclusão LGPD.
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
