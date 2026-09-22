import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  createUser,
  listUsersForAdmin,
  setDisabled,
  setRole,
  type CreateUserInput,
} from "@/features/users/application/user-crud";
import type { Actor } from "@/server/permissions";
import { createFixtures, uniq } from "./fixtures";
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
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

const input = (over: Partial<CreateUserInput> = {}): CreateUserInput => ({
  actor: admin,
  name: "Pessoa de Teste",
  email: `${uniq("u-")}@dom-it.example.test`,
  role: "AUTHOR",
  ...over,
});

describe("createUser", () => {
  it("sem sessão → UNAUTHENTICATED; EDITOR → FORBIDDEN", async () => {
    await expect(createUser(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(createUser(deps, input({ actor: editor }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN cria; devolve senha temporária com hash gravado (permite login)", async () => {
    const created = await createUser(deps, input());
    expect(created.temporaryPassword.length).toBeGreaterThanOrEqual(12);

    const row = await q<{ role: string; password: string }>(
      `select u.role, a.password from users u join accounts a on a.user_id = u.id
       where u.id = $1 and a.provider_id = 'credential'`,
      [created.id],
    );
    expect(row[0]?.role).toBe("AUTHOR");
    expect(row[0]?.password).toBeTruthy();
  });

  it("e-mail já cadastrado → VALIDATION", async () => {
    const created = await createUser(deps, input());
    await expect(createUser(deps, input({ email: created.email }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { email: expect.any(Array) },
    });
  });
});

describe("setRole", () => {
  it("EDITOR → FORBIDDEN; ADMIN não muda o próprio papel", async () => {
    const created = await createUser(deps, input());
    await expect(
      setRole(deps, { actor: editor, userId: created.id, role: "EDITOR" }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      setRole(deps, { actor: admin, userId: admin.id, role: "EDITOR" }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("papel muda de fato e fica registrado em auditoria", async () => {
    const created = await createUser(deps, input());
    await setRole(deps, { actor: admin, userId: created.id, role: "EDITOR" });
    const row = await q<{ role: string }>("select role from users where id = $1", [created.id]);
    expect(row[0]?.role).toBe("EDITOR");
    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_type = 'user' and entity_id = $1 and action = 'user.role_changed'",
      [created.id],
    );
    expect(log.length).toBeGreaterThan(0);
  });

  it("rebaixa um ADMIN quando existe outro ADMIN ativo", async () => {
    const created = await createUser(deps, input({ role: "ADMIN" }));
    await setRole(deps, { actor: admin, userId: created.id, role: "EDITOR" });
    const row = await q<{ role: string }>("select role from users where id = $1", [created.id]);
    expect(row[0]?.role).toBe("EDITOR");
  });

  it("id inexistente → NOT_FOUND", async () => {
    await expect(
      setRole(deps, {
        actor: admin,
        userId: "00000000-0000-4000-8000-000000000000",
        role: "EDITOR",
      }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("papel inválido → VALIDATION (nunca chega a virar erro de banco)", async () => {
    const created = await createUser(deps, input());
    await expect(
      setRole(deps, { actor: admin, userId: created.id, role: "GERENTE" as never }),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { role: expect.any(Array) } });
  });
});

describe("setDisabled", () => {
  it("EDITOR → FORBIDDEN; ADMIN não desativa a própria conta", async () => {
    const created = await createUser(deps, input());
    await expect(
      setDisabled(deps, { actor: editor, userId: created.id, disabled: true }),
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(
      setDisabled(deps, { actor: admin, userId: admin.id, disabled: true }),
    ).rejects.toMatchObject({ code: "DOMAIN_RULE" });
  });

  it("desativa e reativa; nunca apaga a linha", async () => {
    const created = await createUser(deps, input());
    await setDisabled(deps, { actor: admin, userId: created.id, disabled: true });
    let row = await q<{ disabled_at: Date | null }>("select disabled_at from users where id = $1", [
      created.id,
    ]);
    expect(row[0]?.disabled_at).not.toBeNull();

    await setDisabled(deps, { actor: admin, userId: created.id, disabled: false });
    row = await q<{ disabled_at: Date | null }>("select disabled_at from users where id = $1", [
      created.id,
    ]);
    expect(row[0]?.disabled_at).toBeNull();

    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_type = 'user' and entity_id = $1 order by at",
      [created.id],
    );
    expect(log.map((l) => l.action)).toContain("user.disabled");
    expect(log.map((l) => l.action)).toContain("user.reactivated");
  });
});

describe("listUsersForAdmin", () => {
  it("EDITOR → FORBIDDEN; ADMIN lista", async () => {
    await expect(listUsersForAdmin(deps, editor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const rows = await listUsersForAdmin(deps, admin);
    expect(rows.length).toBeGreaterThan(0);
  });
});
