import { describe, expect, it } from "vitest";
import { EnvError, parseEnv } from "./env";

describe("parseEnv", () => {
  it("usa padrões seguros em desenvolvimento", () => {
    const env = parseEnv({});
    expect(env.APP_ENV).toBe("development");
    expect(env.SITE_URL).toBe("http://localhost:3000");
    expect(env.LOG_LEVEL).toBe("info");
    expect(env.DATABASE_URL_ADMIN).toBeUndefined();
  });

  it("trata string vazia (VAR=) como ausente", () => {
    const env = parseEnv({ SITE_URL: "", LOG_LEVEL: "", DATABASE_URL_ADMIN: "" });
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
      parseEnv({ APP_ENV: "production", SITE_URL: "http://exemplo.test", DATABASE_URL_ADMIN: "x" }),
    ).toThrow(/https/);
    expect(
      parseEnv({ APP_ENV: "production", SITE_URL: "https://exemplo.test", DATABASE_URL_ADMIN: "x" })
        .APP_ENV,
    ).toBe("production");
  });

  it("com NODE_ENV=production exige APP_ENV explícito (não cai no padrão development)", () => {
    expect(() => parseEnv({ NODE_ENV: "production" })).toThrow(/APP_ENV/);
    expect(() => parseEnv({ NODE_ENV: "production", APP_ENV: "" })).toThrow(/APP_ENV/);
    expect(parseEnv({ NODE_ENV: "production", APP_ENV: "staging" }).APP_ENV).toBe("staging");
    // Fora de production o padrão continua valendo.
    expect(parseEnv({ NODE_ENV: "development" }).APP_ENV).toBe("development");
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
        DATABASE_URL_ADMIN: secretUrl,
      });
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toContain("SITE_URL");
    expect(message).not.toContain("senha-super-secreta");
    expect(message).not.toContain("isto-nao-e-url");
  });
});
