import { appUrlFor, withDatabase } from "../../scripts/lib/db-admin.mts";

export const TEST_DATABASE = "dm_empresarial_test";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Testes de integração exigem ${name} (veja .env.example).`);
  return value;
}

/** URL do dono, SEMPRE apontando para o banco de teste. */
export function testAdminUrl(): string {
  return withDatabase(required("DATABASE_URL_ADMIN"), TEST_DATABASE);
}

/** URL do role de aplicação (dm_app), SEMPRE apontando para o banco de teste. */
export function testAppUrl(): string {
  return appUrlFor(required("DATABASE_URL_ADMIN"), required("DM_APP_DB_PASSWORD"), TEST_DATABASE);
}
