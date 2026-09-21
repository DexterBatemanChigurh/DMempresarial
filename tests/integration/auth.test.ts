import { randomInt, randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { actorFromUser } from "@/server/auth/actor";
import { createAuth } from "@/server/auth/auth";
import { testAdminUrl, testAppUrl } from "./helpers";

const BASE = "http://localhost:3000";
const PASSWORD = "senha-de-teste-longa-1";
const EMAIL_SUFFIX = "@auth-it.example.test";

const owner = new pg.Pool({ connectionString: testAdminUrl(), max: 2 });
const handle = createDatabase(testAppUrl(), { max: 3 });
const auth = createAuth({ db: handle.db, secret: "t".repeat(40), baseURL: BASE });

// IPs de documentação (RFC 5737): nunca colidem com tráfego real. Um por chamada evita que os
// limites de taxa de um teste contaminem outro.
const usedIps = new Set<string>();
function freshIp(): string {
  for (;;) {
    const ip = `198.51.100.${randomInt(1, 254)}`;
    if (!usedIps.has(ip)) {
      usedIps.add(ip);
      return ip;
    }
  }
}

async function call(
  path: string,
  init: { body?: unknown; ip?: string; origin?: string | null; cookie?: string } = {},
): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json" });
  headers.set("x-forwarded-for", init.ip ?? freshIp());
  if (init.origin !== null) headers.set("origin", init.origin ?? BASE);
  if (init.cookie) headers.set("cookie", init.cookie);
  return auth.handler(
    new Request(`${BASE}/api/auth${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(init.body ?? {}),
    }),
  );
}

async function seedUser(
  role: "ADMIN" | "EDITOR" | "AUTHOR",
): Promise<{ id: string; email: string }> {
  const ctx = await auth.$context;
  const email = `${role.toLowerCase()}-${randomUUID()}${EMAIL_SUFFIX}`;
  // `method: "admin"`: conta criada por um administrador (cadastro público está desligado).
  const user = await ctx.internalAdapter.createUser(
    { email, name: `Teste ${role}`, role, emailVerified: true },
    { method: "admin" },
  );
  await ctx.internalAdapter.createAccount({
    userId: user.id,
    providerId: "credential",
    accountId: user.id,
    password: await ctx.password.hash(PASSWORD),
  });
  return { id: user.id, email };
}

/** Faz login e devolve o cookie de sessão pronto para reenviar. */
async function login(email: string): Promise<{ cookie: string; response: Response }> {
  const response = await call("/sign-in/email", { body: { email, password: PASSWORD } });
  const pair = response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0] ?? "")
    .find((c) => c.startsWith("dm.session_token="));
  return { cookie: pair ?? "", response };
}

const sessionFor = (cookie: string) => auth.api.getSession({ headers: new Headers({ cookie }) });

beforeAll(async () => {
  await owner.query("delete from auth_rate_limits");
});

afterAll(async () => {
  await owner.query("delete from users where email like $1", [`%${EMAIL_SUFFIX}`]);
  await owner.end();
  await handle.close();
});

describe("login", () => {
  it("autentica, define cookie HttpOnly + SameSite=Lax e o papel chega à sessão", async () => {
    const { email, id } = await seedUser("ADMIN");
    const { cookie, response } = await login(email);
    expect(response.status).toBe(200);

    const raw = response.headers.getSetCookie().find((c) => c.startsWith("dm.session_token="));
    expect(raw).toMatch(/HttpOnly/i);
    expect(raw).toMatch(/SameSite=Lax/i);

    const session = await sessionFor(cookie);
    expect(session?.user.id).toBe(id);
    expect(actorFromUser(session?.user)).toEqual({ id, role: "ADMIN" });
  });

  it("senha errada e e-mail inexistente respondem IGUAL (sem enumeração de contas)", async () => {
    const { email } = await seedUser("EDITOR");
    const wrongPassword = await call("/sign-in/email", {
      body: { email, password: "outra-senha-123456" },
    });
    const unknownEmail = await call("/sign-in/email", {
      body: { email: `ninguem-${randomUUID()}${EMAIL_SUFFIX}`, password: "outra-senha-123456" },
    });
    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownEmail.json());
    expect(wrongPassword.headers.getSetCookie()).toHaveLength(0);
    expect(unknownEmail.headers.getSetCookie()).toHaveLength(0);
  });

  it("guarda a senha como hash e nunca a devolve pela API", async () => {
    const { email, id } = await seedUser("AUTHOR");
    const { response } = await login(email);
    const text = await response.text();
    expect(text).not.toContain(PASSWORD);
    expect(text).not.toMatch(/"password"/);

    const { rows } = await owner.query("select password from accounts where user_id = $1", [id]);
    expect(rows[0].password).not.toContain(PASSWORD);
    expect(rows[0].password.length).toBeGreaterThan(40);
  });

  it("com cookie presente, a própria biblioteca rejeita origem diferente (CSRF)", async () => {
    const { email } = await seedUser("ADMIN");
    const response = await call("/sign-in/email", {
      body: { email, password: PASSWORD },
      origin: "https://evil.example",
      cookie: "dm.qualquer=1",
    });
    expect(response.status).toBe(403);
    expect(response.headers.getSetCookie()).toHaveLength(0);
  });
});

describe("cadastro fechado e escalada de privilégio", () => {
  it("o cadastro público está DESLIGADO e não cria usuário", async () => {
    const email = `intruso-${randomUUID()}${EMAIL_SUFFIX}`;
    const response = await call("/sign-up/email", {
      body: { email, password: PASSWORD, name: "Intruso" },
    });
    expect(response.status).toBeGreaterThanOrEqual(400);
    const { rowCount } = await owner.query("select 1 from users where email = $1", [email]);
    expect(rowCount).toBe(0);
  });

  it("um AUTHOR não consegue se promover a ADMIN pela API de perfil", async () => {
    const { email, id } = await seedUser("AUTHOR");
    const { cookie } = await login(email);
    await call("/update-user", { cookie, body: { name: "Novo Nome", role: "ADMIN" } });
    const { rows } = await owner.query("select role from users where id = $1", [id]);
    expect(rows[0].role).toBe("AUTHOR");
  });

  it("um AUTHOR não consegue se reativar nem apagar a marca de desativação", async () => {
    const { email, id } = await seedUser("AUTHOR");
    const { cookie } = await login(email);
    await call("/update-user", { cookie, body: { disabledAt: null, role: "EDITOR" } });
    const { rows } = await owner.query("select role, disabled_at from users where id = $1", [id]);
    expect(rows[0].role).toBe("AUTHOR");
  });
});

describe("limitação de taxa do login", () => {
  it("bloqueia a 6ª tentativa em 15 minutos do mesmo IP (mesmo com a senha certa)", async () => {
    const { email } = await seedUser("EDITOR");
    const ip = freshIp();
    const wrong = { email, password: "senha-errada-123456" };
    for (let attempt = 1; attempt <= 5; attempt++) {
      const response = await call("/sign-in/email", { body: wrong, ip });
      expect(response.status).toBe(401);
    }
    const blocked = await call("/sign-in/email", { body: wrong, ip });
    expect(blocked.status).toBe(429);
    const stillBlocked = await call("/sign-in/email", { body: { email, password: PASSWORD }, ip });
    expect(stillBlocked.status).toBe(429);
    expect(stillBlocked.headers.getSetCookie()).toHaveLength(0);
  });

  it("não bloqueia outro IP legítimo", async () => {
    const { email } = await seedUser("EDITOR");
    const response = await call("/sign-in/email", { body: { email, password: PASSWORD } });
    expect(response.status).toBe(200);
  });
});

describe("ciclo de vida da sessão", () => {
  it("logout invalida a sessão de verdade (some do banco)", async () => {
    const { email, id } = await seedUser("EDITOR");
    const { cookie } = await login(email);
    expect(await sessionFor(cookie)).not.toBeNull();

    const out = await call("/sign-out", { cookie });
    expect(out.status).toBe(200);
    expect(await sessionFor(cookie)).toBeNull();
    const { rowCount } = await owner.query("select 1 from sessions where user_id = $1", [id]);
    expect(rowCount).toBe(0);
  });

  it("sessão expirada não autentica", async () => {
    const { email, id } = await seedUser("EDITOR");
    const { cookie } = await login(email);
    await owner.query(
      "update sessions set expires_at = now() - interval '1 minute' where user_id = $1",
      [id],
    );
    expect(await sessionFor(cookie)).toBeNull();
  });

  it("conta desativada deixa de produzir ator, mesmo com sessão ainda no banco", async () => {
    const { email, id } = await seedUser("ADMIN");
    const { cookie } = await login(email);
    expect(actorFromUser((await sessionFor(cookie))?.user)).not.toBeNull();

    await owner.query("update users set disabled_at = now() where id = $1", [id]);
    const session = await sessionFor(cookie);
    expect(actorFromUser(session?.user)).toBeNull();
  });

  it("cookie adulterado ou aleatório não autentica", async () => {
    expect(await sessionFor("dm.session_token=valor-inventado.assinatura-falsa")).toBeNull();
    expect(await sessionFor("")).toBeNull();
  });
});
