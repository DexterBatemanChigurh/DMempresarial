import { bootstrapRoles, ensureDatabase, runMigrations } from "../../scripts/lib/db-admin.mts";
import { seedBase } from "../../scripts/lib/db-seed.mts";
import { testAdminUrl } from "./helpers";

// Prepara o banco de teste do zero a cada execução: cria se faltar, aplica roles e migrations.
export default async function setup(): Promise<void> {
  const password = process.env.DM_APP_DB_PASSWORD;
  const admin = process.env.DATABASE_URL_ADMIN;
  if (!admin || !password) {
    throw new Error("Testes de integração exigem DATABASE_URL_ADMIN e DM_APP_DB_PASSWORD.");
  }
  await ensureDatabase(admin, "dm_empresarial_test");
  await bootstrapRoles(testAdminUrl(), password);
  await runMigrations(testAdminUrl());
  await seedBase(testAdminUrl());
}
