import "server-only";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { twoFactor } from "better-auth/plugins/two-factor";
import { getDb, type Database } from "@/db/client";
import * as schema from "@/db/schema";
import { AppError } from "@/lib/errors";
import { env } from "@/server/env";
import { logger } from "@/server/logging/logger";

/**
 * Autenticação do CMS (docs/03, parte 10). Sessões em banco (revogáveis), cadastro público
 * DESLIGADO (usuários são criados por um ADMIN), senha com scrypt pela própria biblioteca.
 * Autorização NÃO é delegada à biblioteca: papéis e permissões vivem em `server/permissions`.
 */

const log = logger.child({ module: "auth" });

export type AuthDeps = {
  db: Database;
  secret: string;
  baseURL: string;
};

export function createAuth({ db, secret, baseURL }: AuthDeps) {
  const secure = baseURL.startsWith("https://");
  return betterAuth({
    appName: "DM Empresarial",
    baseURL,
    secret,
    trustedOrigins: [baseURL],
    database: drizzleAdapter(db, {
      provider: "pg",
      schema: {
        user: schema.users,
        session: schema.sessions,
        account: schema.accounts,
        verification: schema.verifications,
        rateLimit: schema.authRateLimits,
        twoFactor: schema.twoFactors,
      },
    }),
    emailAndPassword: {
      enabled: true,
      // Sem cadastro público: contas nascem por convite de ADMIN.
      disableSignUp: true,
      minPasswordLength: 6,
      maxPasswordLength: 12,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
    },
    user: {
      additionalFields: {
        // `input: false`: o usuário NUNCA define o próprio papel (evita escalada de privilégio).
        role: { type: "string", required: false, defaultValue: "AUTHOR", input: false },
        disabledAt: { type: "date", required: false, input: false },
      },
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      freshAge: 60 * 15,
    },
    // Limites em banco (não em memória): valem entre instâncias e reinícios.
    rateLimit: {
      enabled: true,
      storage: "database",
      window: 60,
      max: 60,
      customRules: {
        "/sign-in/email": { window: 15 * 60, max: 5 },
        "/request-password-reset": { window: 60 * 60, max: 3 },
        "/reset-password": { window: 15 * 60, max: 5 },
      },
    },
    advanced: {
      cookiePrefix: "dm",
      // Explícito: por padrão a biblioteca DESLIGA a checagem de origem quando NODE_ENV=test.
      // A segurança não pode depender do ambiente.
      disableOriginCheck: false,
      disableCSRFCheck: false,
      useSecureCookies: secure,
      defaultCookieAttributes: { httpOnly: true, sameSite: "lax", secure },
    },
    logger: {
      level: "warn",
      log: (level, message) => {
        if (level === "error") log.error(message);
        else log.warn(message);
      },
    },
    plugins: [
      // 2FA por TOTP (app autenticador) + códigos de backup. O segredo fica cifrado no banco.
      twoFactor({ issuer: "DM Empresarial" }),
      // nextCookies deve ser o ÚLTIMO plugin (permite definir cookies em Server Actions).
      nextCookies(),
    ],
  });
}

export type Auth = ReturnType<typeof createAuth>;

const globalForAuth = globalThis as unknown as { __dmAuth?: Auth };

/** Instância da aplicação, criada sob demanda (o build não exige as variáveis de auth). */
export function getAuth(): Auth {
  if (!globalForAuth.__dmAuth) {
    const config = env();
    if (!config.BETTER_AUTH_SECRET) {
      throw new AppError("UNEXPECTED", "BETTER_AUTH_SECRET não está configurada.");
    }
    globalForAuth.__dmAuth = createAuth({
      db: getDb(),
      secret: config.BETTER_AUTH_SECRET,
      baseURL: config.BETTER_AUTH_URL,
    });
  }
  return globalForAuth.__dmAuth;
}
