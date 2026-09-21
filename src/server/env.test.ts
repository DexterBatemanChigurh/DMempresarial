import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

const SECRET = "s".repeat(32);

describe("parseEnv", () => {
  it("usa padrões seguros em desenvolvimento", () => {
    const env = parseEnv({});
    expect(env.APP_ENV).toBe("development");
    expect(env.SITE_URL).toBe("http://localhost:3000");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DATABASE_URL).toBeUndefined();
    expect(env.DATABASE_URL_ADMIN).toBeUndefined();
  });

  it("trata string vazia (VAR=) como ausente", () => {
    const env = parseEnv({ SITE_URL: "", LOG_LEVEL: "", DATABASE_URL: "", DATABASE_URL_ADMIN: "" });
    expect(env.SITE_URL).toBe("http://localhost:3000");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DATABASE_URL_ADMIN).toBeUndefined();
  });

  it("remove a barra final de SITE_URL", () => {
    expect(parseEnv({ SITE_URL: "https://exemplo.test/" }).SITE_URL).toBe("https://exemplo.test");
  });

  it("em production exige SITE_URL https e banco configurado", () => {
    expect(() => parseEnv({ APP_ENV: "production" })).toThrow(EnvError);
    expect(() =>
      parseEnv({ APP_ENV: "production", SITE_URL: "http://exemplo.test", DATABASE_URL: "x" }),
    ).toThrow(/https/);
    expect(
      parseEnv({
        APP_ENV: "production",
        SITE_URL: "https://exemplo.test",
        DATABASE_URL: "x",
        BETTER_AUTH_SECRET: SECRET,
      }).APP_ENV,
    ).toBe("production");
  });

  it("em production exige a URL do role de aplicação, não a do dono do banco", () => {
    const base = {
      APP_ENV: "production",
      SITE_URL: "https://exemplo.test",
      BETTER_AUTH_SECRET: SECRET,
    };
    // Só a URL do dono do banco não basta: o runtime não deve operar com privilégio de DDL.
    expect(() => parseEnv({ ...base, DATABASE_URL_ADMIN: "x" })).toThrow(/DATABASE_URL:/);
    // O runtime de produção não precisa (nem deve) receber a URL do dono.
    expect(parseEnv({ ...base, DATABASE_URL: "x" }).DATABASE_URL_ADMIN).toBeUndefined();
  });

  it("com NODE_ENV=production exige APP_ENV explícito (não cai no padrão development)", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/APP_ENV/);
    expect(() => parseEnv({ NODE_ENV: "production", APP_ENV: "" })).toThrow(/APP_ENV/);
    expect(parseEnv({ NODE_ENV: "production", APP_ENV: "staging" }).APP_ENV).toBe("staging");
    // Fora de production o padrão continua valendo.
    expect(parseEnv({ NODE_ENV: "development" }).APP_ENV).toBe("development");
  });

  it("em production exige o segredo de sessão, com pelo menos 32 caracteres", () => {
    const base = {
      APP_ENV: "production",
      SITE_URL: "https://exemplo.test",
      DATABASE_URL: "x",
    };
    expect(() => parseEnv(base)).toThrow(/BETTER_AUTH_SECRET/);
    expect(() => parseEnv({ ...base, BETTER_AUTH_SECRET: "curto" })).toThrow(/BETTER_AUTH_SECRET/);
    expect(parseEnv({ ...base, BETTER_AUTH_SECRET: SECRET }).BETTER_AUTH_SECRET).toBe(SECRET);
  });

  it("BETTER_AUTH_URL cai em SITE_URL quando ausente e o segredo nunca aparece em erro", () => {
    expect(parseEnv({ SITE_URL: "https://exemplo.test/" }).BETTER_AUTH_URL).toBe(
      "https://exemplo.test",
    );
    expect(parseEnv({ BETTER_AUTH_URL: "https://auth.exemplo.test/" }).BETTER_AUTH_URL).toBe(
      "https://auth.exemplo.test",
    );
    let message = "";
    try {
      parseEnv({ BETTER_AUTH_SECRET: "muito-curto-segredo" });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("BETTER_AUTH_SECRET");
    expect(message).not.toContain("muito-curto-segredo");
  });

  it("2FA obrigatório por padrão; só pode ser desligado fora de production", () => {
    expect(parseEnv({}).REQUIRE_2FA).toBe(true);
    expect(parseEnv({ REQUIRE_2FA: "false" }).REQUIRE_2FA).toBe(false);
    expect(parseEnv({ REQUIRE_2FA: "true" }).REQUIRE_2FA).toBe(true);
    expect(() => parseEnv({ REQUIRE_2FA: "talvez" })).toThrow(EnvError);

    const production = {
      APP_ENV: "production",
      SITE_URL: "https://exemplo.test",
      DATABASE_URL: "x",
      BETTER_AUTH_SECRET: SECRET,
    };
    expect(parseEnv(production).REQUIRE_2FA).toBe(true);
    expect(() => parseEnv({ ...production, REQUIRE_2FA: "false" })).toThrow(/REQUIRE_2FA/);
  });

  it("rejeita ambiente e nível de log desconhecidos", () => {
    expect(() => parseEnv({ APP_ENV: "producao" })).toThrow(EnvError);
    expect(() => parseEnv({ LOG_LEVEL: "verbose" })).toThrow(EnvError);
  });

  it("nunca inclui o VALOR das variáveis nas mensagens de erro", () => {
    const secretUrl = "postgres://dono:senha-super-secreta@host/db";
    let message = "";
    try {
      parseEnv({
        APP_ENV: "production",
        SITE_URL: "isto-nao-e-url",
        DATABASE_URL: secretUrl,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("SITE_URL");
    expect(message).not.toContain("senha-super-secreta");
    expect(message).not.toContain("isto-nao-e-url");
  });
});
