import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `env()` guarda o resultado em cache no módulo; cada teste carrega o módulo do zero.
async function robotsFor(appEnv: string) {
  vi.stubEnv("APP_ENV", appEnv);
  if (appEnv === "production") {
    vi.stubEnv("SITE_URL", "https://exemplo.test");
    vi.stubEnv("DATABASE_URL_ADMIN", "postgres://x");
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
    const mod = await import("./robots");
    expect(mod.dynamic).toBe("force-dynamic");
  });
});
