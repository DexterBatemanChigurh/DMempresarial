import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { publishDuePosts } from "@/features/content/application/post-service";
import type { Actor } from "@/server/permissions";
import { createFixtures } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let author: Actor;
let specialistId: string;

beforeAll(async () => {
  await fx.cleanup();
  author = (await fx.user("AUTHOR")) as Actor;
  specialistId = (await fx.specialist({ userId: author.id })).id;
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

describe("publishDuePosts", () => {
  it("publica agendados vencidos; ignora agendados no futuro e outros estados", async () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60_000);
    const future = new Date(now.getTime() + 3_600_000);

    const due = await fx.post({
      authorId: specialistId,
      status: "SCHEDULED",
      scheduledFor: past.toISOString(),
    });
    const notYetDue = await fx.post({
      authorId: specialistId,
      status: "SCHEDULED",
      scheduledFor: future.toISOString(),
    });
    const draft = await fx.post({ authorId: specialistId, status: "DRAFT" });

    const result = await publishDuePosts(deps, { now });

    expect(result.publishedIds).toContain(due.id);
    expect(result.publishedIds).not.toContain(notYetDue.id);
    expect(result.publishedIds).not.toContain(draft.id);

    const rows = await q<{ id: string; status: string; scheduled_for: Date | null }>(
      "select id, status, scheduled_for from posts where id in ($1, $2, $3)",
      [due.id, notYetDue.id, draft.id],
    );
    const byId = Object.fromEntries(rows.map((r) => [r.id, r]));
    expect(byId[due.id]?.status).toBe("PUBLISHED");
    expect(byId[due.id]?.scheduled_for).toBeNull();
    expect(byId[notYetDue.id]?.status).toBe("SCHEDULED");
    expect(byId[draft.id]?.status).toBe("DRAFT");

    const log = await q<{ action: string; actor_user_id: string | null }>(
      "select action, actor_user_id from audit_logs where entity_type = 'post' and entity_id = $1",
      [due.id],
    );
    expect(log[0]?.action).toBe("post.published");
    expect(log[0]?.actor_user_id).toBeNull();
  });

  it("idempotente: rodar de novo não publica nada a mais (já não é SCHEDULED)", async () => {
    const past = new Date(Date.now() - 60_000);
    const due = await fx.post({
      authorId: specialistId,
      status: "SCHEDULED",
      scheduledFor: past.toISOString(),
    });

    const first = await publishDuePosts(deps, {});
    expect(first.publishedIds).toContain(due.id);

    const second = await publishDuePosts(deps, {});
    expect(second.publishedIds).not.toContain(due.id);
  });

  it("agendado vencido sem categoria principal não publica sozinho (fica para revisão manual)", async () => {
    const past = new Date(Date.now() - 60_000);
    const stuck = await fx.post({
      authorId: specialistId,
      status: "SCHEDULED",
      scheduledFor: past.toISOString(),
      categoryId: null,
    });

    const result = await publishDuePosts(deps, {});
    expect(result.publishedIds).not.toContain(stuck.id);

    const row = await q<{ status: string }>("select status from posts where id = $1", [stuck.id]);
    expect(row[0]?.status).toBe("SCHEDULED");
  });
});
