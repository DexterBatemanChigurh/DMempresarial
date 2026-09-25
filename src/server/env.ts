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
  // Runtime da aplicação (role dm_app, sem DDL). Obrigatória em production.
  DATABASE_URL: z.string().min(1).optional(),
  // Dono do banco: só migrations/bootstrap. A aplicação em runtime não deve recebê-la.
  DATABASE_URL_ADMIN: z.string().min(1).optional(),
  // Segredo de assinatura das sessões (mínimo de 32 caracteres). Obrigatório em production.
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  // URL base da autenticação; se ausente, usa SITE_URL.
  BETTER_AUTH_URL: z.url().optional(),
  // 2FA obrigatório para ADMIN e EDITOR. Padrão: ligado. Só desligue em desenvolvimento local.
  REQUIRE_2FA: z.enum(["true", "false"]).default("true"),
  // Diretório local para o adaptador de storage (usado em desenvolvimento).
  STORAGE_LOCAL_DIR: z.string().default(".storage"),
  // Segredo do cron de publicação agendada (`/api/cron/publish`). Obrigatório em production.
  CRON_SECRET: z.string().min(32).optional(),
  // Segredo para tokens assinados (confirmação newsletter, descadastro). Mínimo 32 chars.
  SIGNED_TOKEN_SECRET: z.string().min(32).optional(),
});

export type Env = {
  APP_ENV: "development" | "test" | "staging" | "production";
  SITE_URL: string;
  LOG_LEVEL: (typeof LOG_LEVELS)[number];
  DATABASE_URL: string | undefined;
  DATABASE_URL_ADMIN: string | undefined;
  BETTER_AUTH_SECRET: string | undefined;
  BETTER_AUTH_URL: string;
  REQUIRE_2FA: boolean;
  STORAGE_LOCAL_DIR: string;
  CRON_SECRET: string | undefined;
  SIGNED_TOKEN_SECRET: string;
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
    if (!value.DATABASE_URL) problems.push("DATABASE_URL: obrigatório em production");
    if (!value.BETTER_AUTH_SECRET) problems.push("BETTER_AUTH_SECRET: obrigatório em production");
    // Em produção o 2FA não pode ser desligado por configuração (decisão T-05).
    if (value.REQUIRE_2FA === "false")
      problems.push("REQUIRE_2FA: não pode ser false em production");
    if (!value.CRON_SECRET) problems.push("CRON_SECRET: obrigatório em production");
    if (!value.SIGNED_TOKEN_SECRET) problems.push("SIGNED_TOKEN_SECRET: obrigatório em production");
    if (problems.length > 0) throw new EnvError(problems);
  }

  const siteUrl = (value.SITE_URL ?? LOCAL_SITE_URL).replace(/\/+$/, "");

  return {
    APP_ENV: value.APP_ENV,
    SITE_URL: siteUrl,
    LOG_LEVEL: value.LOG_LEVEL,
    DATABASE_URL: value.DATABASE_URL,
    DATABASE_URL_ADMIN: value.DATABASE_URL_ADMIN,
    BETTER_AUTH_SECRET: value.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: (value.BETTER_AUTH_URL ?? siteUrl).replace(/\/+$/, ""),
    REQUIRE_2FA: value.REQUIRE_2FA === "true",
    STORAGE_LOCAL_DIR: value.STORAGE_LOCAL_DIR,
    CRON_SECRET: value.CRON_SECRET,
    SIGNED_TOKEN_SECRET: value.SIGNED_TOKEN_SECRET ?? "",
  };
}

let cached: Env | undefined;

/** Leitura lazy e em cache: o build estático não exige variáveis que não usa. */
export function env(): Env {
  cached ??= parseEnv(process.env);
  return cached;
}
