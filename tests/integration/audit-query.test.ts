import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { getAuditEntityTypes, getAuditLog } from "@/features/audit/application/audit-query";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import type { Actor } from "@/server/permissions";
import { createFixtures } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([fx.user("ADMIN"), fx.user("EDITOR")]);
  [admin, editor] = users as [Actor, Actor];
  await recordAudit(handle.db, {
    actorId: admin.id,
    action: "test.marker",
    entityType: "it-dom-marker",
    entityId: "1",
  });
});
afterAll(async () => {
  await q("delete from audit_logs where entity_type = 'it-dom-marker'");
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

describe("getAuditLog", () => {
  it("sem sessão → UNAUTHENTICATED; EDITOR → FORBIDDEN", async () => {
    await expect(getAuditLog(deps, null, {})).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(getAuditLog(deps, editor, {})).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("ADMIN lê e filtra por entityType", async () => {
    const all = await getAuditLog(deps, admin, {});
    expect(all.total).toBeGreaterThan(0);

    const filtered = await getAuditLog(deps, admin, { entityType: "it-dom-marker" });
    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0]?.action).toBe("test.marker");
    expect(filtered.items[0]?.actorName).toBeTruthy();
  });
});

describe("getAuditEntityTypes", () => {
  it("EDITOR → FORBIDDEN; ADMIN lista tipos distintos", async () => {
    await expect(getAuditEntityTypes(deps, editor)).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    const types = await getAuditEntityTypes(deps, admin);
    expect(types).toContain("it-dom-marker");
  });
});
