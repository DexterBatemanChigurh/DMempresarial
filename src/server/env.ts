import "server-only";
import { z } from "zod";

/**
 * Variáveis de ambiente validadas na primeira leitura (falha rápida).
 * Mensagens de erro citam só o NOME da variável e o motivo, nunca o valor.
 */

const LOG_LEVELS = ["error", "warn", "info", "debug"] as const;

const rawSchema = z.object({
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  SITE_URL: z.url().optional(),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
  DATABASE_URL_ADMIN: z.string().min(1).optional(),
});

export type Env = {
  APP_ENV: "development" | "test" | "staging" | "production";
  SITE_URL: string;
  LOG_LEVEL: (typeof LOG_LEVELS)[number];
  DATABASE_URL_ADMIN: string | undefined;
};

export class EnvError extends Error {
  constructor(readonly problems: string[]) {
    super(`Configuração de ambiente inválida:\n- ${problems.join("\n- ")}`);
    this.name = "EnvError";
  }
}

const LOCAL_SITE_URL = "http://localhost:3000";

export function parseEnv(source: Record<string, string | undefined>): Env {
  // Em arquivos .env, `VAR=` chega como string vazia; tratamos como ausente.
  const cleaned = Object.fromEntries(Object.entries(source).filter(([, v]) => v !== ""));

  const parsed = rawSchema.safeParse(cleaned);
  if (!parsed.success) {
    throw new EnvError(
      parsed.error.issues.map((i) => `${i.path.join(".") || "(raiz)"}: ${i.message}`),
    );
  }
  const value = parsed.data;

  // `APP_ENV` tem padrão "development". Sem esta trava, esquecer a variável no provedor de
  // hospedagem sobe o site "válido" e pula as checagens de production abaixo.
  if (cleaned.NODE_ENV === "production" && cleaned.APP_ENV === undefined) {
    throw new EnvError([
      "APP_ENV: obrigatório quando NODE_ENV=production (development | staging | production)",
    ]);
  }

  if (value.APP_ENV === "production") {
    const problems: string[] = [];
    if (!value.SITE_URL) problems.push("SITE_URL: obrigatório em production");
    else if (!value.SITE_URL.startsWith("https://"))
      problems.push("SITE_URL: deve usar https em production");
    if (!value.DATABASE_URL_ADMIN) problems.push("DATABASE_URL_ADMIN: obrigatório em production");
    if (problems.length > 0) throw new EnvError(problems);
  }

  return {
    APP_ENV: value.APP_ENV,
    SITE_URL: (value.SITE_URL ?? LOCAL_SITE_URL).replace(/\/+$/, ""),
    LOG_LEVEL: value.LOG_LEVEL,
    DATABASE_URL_ADMIN: value.DATABASE_URL_ADMIN,
  };
}

let cached: Env | undefined;

/** Leitura lazy e em cache: o build estático não exige variáveis que não usa. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
