import { randomInt, randomUUID } from "node:crypto";
import pg from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { createAuth } from "@/server/auth/auth";
import { createFirstAdmin, generatePassword } from "../../scripts/lib/admin-bootstrap.mts";
import { testAdminUrl, testAppUrl } from "./helpers";
import { secretFromUri, totp } from "./totp";

const BASE = "http://localhost:3000";
const DOMAIN = "@2fa-it.example.test";

const owner = new pg.Pool({ connectionString: testAdminUrl(), max: 2 });
const handle = createDatabase(testAppUrl(), { max: 4 });
const auth = createAuth({ db: handle.db, secret: "t".repeat(40), baseURL: BASE });

const usedIps = new Set<string>();
function freshIp(): string {
  for (;;) {
    const ip = `203.0.113.${randomInt(1, 254)}`;
    if (!usedIps.has(ip)) {
      usedIps.add(ip);
      return ip;
    }
  }
}

/** Jarra de cookies mínima: guarda os Set-Cookie e os reenvia, como um navegador. */
class Jar {
  private cookies = new Map<string, string>();
  absorb(response: Response) {
    for (const raw of response.headers.getSetCookie()) {
      const [pair = "", ...attrs] = raw.split(";");
      const eq = pair.indexOf("=");
      const name = pair.slice(0, eq).trim();
      const value = pair.slice(eq + 1).trim();
      const expired = attrs.some((a) => /max-age=0/i.test(a)) || value === "";
      if (expired) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
  }
  header(): string {
    return [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
  }
  has(name: string): boolean {
    return this.cookies.has(name);
  }
}

async function call(path: string, body: unknown, jar?: Jar, ip = freshIp()): Promise<Response> {
  const headers = new Headers({ "content-type": "application/json", origin: BASE });
  headers.set("x-forwarded-for", ip);
  const cookie = jar?.header();
  if (cookie) headers.set("cookie", cookie);
  const response = await auth.handler(
    new Request(`${BASE}/api/auth${path}`, { method: "POST", headers, body: JSON.stringify(body) }),
  );
  jar?.absorb(response);
  return response;
}

const sessionOf = (jar: Jar) =>
  auth.api.getSession({ headers: new Headers({ cookie: jar.header() }) });
const SESSION_COOKIE = "dm.session_token";

async function newAdmin() {
  const email = `admin-${randomUUID()}${DOMAIN}`;
  const password = generatePassword();
  const { id } = await createFirstAdmin(
    testAdminUrl(),
    { email, name: "Admin Teste", password },
    { allowAdditional: true },
  );
  return { id, email, password };
}

/** Login com e-mail e senha, devolvendo a jarra de cookies. */
async function signIn(email: string, password: string) {
  const jar = new Jar();
  const response = await call("/sign-in/email", { email, password }, jar);
  return { jar, response };
}

/** Liga o 2FA de ponta a ponta e devolve o segredo e os códigos de backup. */
async function enableTwoFactor(user: { email: string; password: string }) {
  const { jar } = await signIn(user.email, user.password);
  const enabled = await call("/two-factor/enable", { password: user.password }, jar);
  const { totpURI, backupCodes } = (await enabled.json()) as {
    totpURI: string;
    backupCodes: string[];
  };
  const secret = secretFromUri(totpURI);
  const verified = await call("/two-factor/verify-totp", { code: totp(secret) }, jar);
  return { secret, backupCodes, verified, jar };
}

beforeAll(async () => {
  await owner.query("delete from auth_rate_limits");
});
afterAll(async () => {
  await owner.query(
    "delete from audit_logs where actor_user_id is null and action = 'user.bootstrap_admin' and entity_id in (select id from users where email like $1)",
    [`%${DOMAIN}`],
  );
  await owner.query("delete from users where email like $1", [`%${DOMAIN}`]);
  await owner.end();
  await handle.close();
});

describe("primeiro administrador (script de bootstrap)", () => {
  it("cria o admin, o login funciona com a senha gerada e a senha não fica em texto puro", async () => {
    const user = await newAdmin();
    const { response, jar } = await signIn(user.email, user.password);
    expect(response.status).toBe(200);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
    expect((await sessionOf(jar))?.user).toMatchObject({ id: user.id, role: "ADMIN" });

    const { rows } = await owner.query("select password from accounts where user_id = $1", [
      user.id,
    ]);
    expect(rows[0].password).not.toContain(user.password);
    expect(rows[0].password.length).toBeGreaterThan(40);
  });

  it("registra a criação na auditoria e nasce SEM 2FA (precisa configurar no primeiro acesso)", async () => {
    const user = await newAdmin();
    const { rows } = await owner.query("select action from audit_logs where entity_id = $1", [
      user.id,
    ]);
    expect(rows.map((r) => r.action)).toContain("user.bootstrap_admin");
    const { rows: flags } = await owner.query(
      "select two_factor_enabled from users where id = $1",
      [user.id],
    );
    expect(flags[0].two_factor_enabled).toBe(false);
  });

  it("recusa senha curta, e-mail inválido e um segundo admin sem autorização explícita", async () => {
    await expect(
      createFirstAdmin(
        testAdminUrl(),
        { email: `x${DOMAIN}`, name: "X", password: "curta" },
        { allowAdditional: true },
      ),
    ).rejects.toThrow(/pelo menos 12/);
    await expect(
      createFirstAdmin(
        testAdminUrl(),
        { email: "sem-arroba", name: "X", password: generatePassword() },
        { allowAdditional: true },
      ),
    ).rejects.toThrow(/E-mail inválido/);
    await newAdmin(); // garante que já existe ao menos um ADMIN
    await expect(
      createFirstAdmin(testAdminUrl(), {
        email: `y-${randomUUID()}${DOMAIN}`,
        name: "Y",
        password: generatePassword(),
      }),
    ).rejects.toThrow(/Já existe um administrador/);
  });

  it("gera senhas longas, diferentes e só com caracteres não ambíguos", () => {
    const passwords = new Set(Array.from({ length: 30 }, () => generatePassword()));
    expect(passwords.size).toBe(30);
    for (const p of passwords)
      expect(p).toMatch(/^[abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789]{24}$/);
  });
});

describe("cadastro do 2FA (TOTP)", () => {
  it("o segredo só vale depois de provar o primeiro código; o segredo fica cifrado no banco", async () => {
    const user = await newAdmin();
    const { jar } = await signIn(user.email, user.password);
    const enabled = await call("/two-factor/enable", { password: user.password }, jar);
    expect(enabled.status).toBe(200);
    const { totpURI, backupCodes } = (await enabled.json()) as {
      totpURI: string;
      backupCodes: string[];
    };
    expect(totpURI).toMatch(/^otpauth:\/\/totp\//);
    expect(totpURI).toContain("DM%20Empresarial");
    expect(backupCodes.length).toBeGreaterThanOrEqual(8);

    // Ainda não ativo: falta provar um código.
    const { rows: before } = await owner.query(
      "select two_factor_enabled from users where id = $1",
      [user.id],
    );
    expect(before[0].two_factor_enabled).toBe(false);

    const secret = secretFromUri(totpURI);
    const { rows: stored } = await owner.query(
      "select secret, backup_codes from two_factors where user_id = $1",
      [user.id],
    );
    expect(stored[0].secret).not.toContain(secret);
    for (const code of backupCodes) expect(stored[0].backup_codes).not.toContain(code);

    const wrong = await call("/two-factor/verify-totp", { code: "000000" }, jar);
    expect(wrong.status).toBeGreaterThanOrEqual(400);
    const right = await call("/two-factor/verify-totp", { code: totp(secret) }, jar);
    expect(right.status).toBe(200);
    const { rows: after } = await owner.query(
      "select two_factor_enabled from users where id = $1",
      [user.id],
    );
    expect(after[0].two_factor_enabled).toBe(true);
  });

  it("exige a SENHA para ligar o 2FA (sessão roubada sozinha não basta)", async () => {
    const user = await newAdmin();
    const { jar } = await signIn(user.email, user.password);
    const response = await call("/two-factor/enable", { password: "senha-errada-123456" }, jar);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(
      (await owner.query("select 1 from two_factors where user_id = $1", [user.id])).rowCount,
    ).toBe(0);
  });

  it("sem sessão não se liga 2FA", async () => {
    const response = await call(
      "/two-factor/enable",
      { password: "qualquer-senha-123" },
      new Jar(),
    );
    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});

describe("login em duas etapas", () => {
  it("com 2FA ativo, senha correta NÃO cria sessão: pede o código; só o código completa", async () => {
    const user = await newAdmin();
    const { secret } = await enableTwoFactor(user);

    const { response, jar } = await signIn(user.email, user.password);
    expect(await response.json()).toMatchObject({ twoFactorRedirect: true });
    expect(jar.has(SESSION_COOKIE)).toBe(false);
    expect(await sessionOf(jar)).toBeNull();

    const bad = await call("/two-factor/verify-totp", { code: "123456" }, jar);
    expect(bad.status).toBeGreaterThanOrEqual(400);
    expect(jar.has(SESSION_COOKIE)).toBe(false);

    const good = await call("/two-factor/verify-totp", { code: totp(secret) }, jar);
    expect(good.status).toBe(200);
    expect(jar.has(SESSION_COOKIE)).toBe(true);
    expect((await sessionOf(jar))?.user.id).toBe(user.id);
  });

  it("um código de outra conta não completa este login", async () => {
    const [a, b] = [await newAdmin(), await newAdmin()];
    await enableTwoFactor(a);
    const other = await enableTwoFactor(b);
    const { jar } = await signIn(a.email, a.password);
    const response = await call("/two-factor/verify-totp", { code: totp(other.secret) }, jar);
    expect(response.status).toBeGreaterThanOrEqual(400);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("código de backup funciona UMA vez e depois é invalidado", async () => {
    const user = await newAdmin();
    const { backupCodes } = await enableTwoFactor(user);
    const code = backupCodes[0]!;

    const first = await signIn(user.email, user.password);
    const used = await call("/two-factor/verify-backup-code", { code }, first.jar);
    expect(used.status).toBe(200);
    expect(first.jar.has(SESSION_COOKIE)).toBe(true);

    const second = await signIn(user.email, user.password);
    const reused = await call("/two-factor/verify-backup-code", { code }, second.jar);
    expect(reused.status).toBeGreaterThanOrEqual(400);
    expect(second.jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("errar o código muitas vezes bloqueia a conta, mesmo com o código certo depois", async () => {
    const user = await newAdmin();
    const { secret } = await enableTwoFactor(user);
    const { jar } = await signIn(user.email, user.password);

    let blocked = false;
    for (let attempt = 0; attempt < 20 && !blocked; attempt++) {
      // IPs diferentes: prova o bloqueio por CONTA, independente do limite por IP.
      const response = await call("/two-factor/verify-totp", { code: "000000" }, jar);
      const body = (await response
        .clone()
        .json()
        .catch(() => ({}))) as { code?: string };
      blocked =
        response.status === 429 ||
        body.code === "ACCOUNT_TEMPORARILY_LOCKED" ||
        body.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE";
    }
    expect(blocked).toBe(true);

    const withRightCode = await call("/two-factor/verify-totp", { code: totp(secret) }, jar);
    expect(withRightCode.status).toBeGreaterThanOrEqual(400);
    expect(jar.has(SESSION_COOKIE)).toBe(false);
  });

  it("nenhuma resposta da API expõe o segredo do TOTP nem os códigos de backup", async () => {
    const user = await newAdmin();
    const { secret, backupCodes } = await enableTwoFactor(user);
    const { response, jar } = await signIn(user.email, user.password);
    const text = await response.text();
    expect(text).not.toContain(secret);
    expect(text).not.toMatch(/backupCodes|"secret"/);
    const session = JSON.stringify(await sessionOf(jar));
    expect(session).not.toContain(secret);
    for (const code of backupCodes) expect(session).not.toContain(code);
  });
});
