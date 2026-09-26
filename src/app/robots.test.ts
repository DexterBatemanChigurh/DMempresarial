import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `connection()` é uma API de requisição do Next: fora do scope de renderização ela lança.
// O teste de unit cobre a lógica de indexação; a marcação "avaliado a cada requisição" é
// garantida pelo `await connection()` e verificada de forma indireta abaixo.
vi.mock("next/server", async () => {
  const actual = await vi.importActual<typeof import("next/server")>("next/server");
  return { ...actual, connection: vi.fn(async () => {}) };
});

// `env()` guarda o resultado em cache no módulo; cada teste carrega o módulo do zero.
async function robotsFor(appEnv: string) {
  vi.stubEnv("APP_ENV", appEnv);
  if (appEnv === "production") {
    vi.stubEnv("SITE_URL", "https://exemplo.test");
    vi.stubEnv("DATABASE_URL", "postgres://x");
    vi.stubEnv("BETTER_AUTH_SECRET", "s".repeat(32));
    vi.stubEnv("CRON_SECRET", "s".repeat(32));
    vi.stubEnv("SIGNED_TOKEN_SECRET", "s".repeat(32));
    vi.stubEnv("STORAGE_DRIVER", "local");
    vi.stubEnv("RESEND_API_KEY", "re_teste");
    vi.stubEnv("EMAIL_FROM", "site@exemplo.test");
  }
  const mod = await import("./robots");
  return mod.default();
}

describe("robots", () => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.unstubAllEnvs());

  it.each(["development", "test", "staging"])("bloqueia tudo em %s", async (appEnv) => {
    expect(await robotsFor(appEnv)).toEqual({ rules: { userAgent: "*", disallow: "/" } });
  });

  it("libera em production, mantendo /admin e /api fora do índice", async () => {
    expect(await robotsFor("production")).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] },
    });
  });

  it("é avaliado a cada requisição, não no build", async () => {
    vi.stubEnv("APP_ENV", "development");
    const { connection } = await import("next/server");
    const mod = await import("./robots");
    await mod.default();
    // Com `cacheComponents`, o comportamento dinâmico vem de `await connection()` dentro da
    // função — não existe mais `export const dynamic`.
    expect(connection).toHaveBeenCalled();
  });
});
