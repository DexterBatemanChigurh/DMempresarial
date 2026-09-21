// Cria o role de aplicação (dm_app) e ajusta privilégios. Idempotente.
// Uso: npm run db:bootstrap   (lê .env.local). Nunca imprime URL nem senha.
import { bootstrapRoles } from "./lib/db-admin.mts";

const adminUrl = process.env.DATABASE_URL_ADMIN;
const appPassword = process.env.DM_APP_DB_PASSWORD;
if (!adminUrl || !appPassword) {
  console.error("Defina DATABASE_URL_ADMIN e DM_APP_DB_PASSWORD (veja .env.example).");
  process.exit(1);
}

try {
  const database = await bootstrapRoles(adminUrl, appPassword);
  console.log(`Role dm_app e privilégios OK — banco: ${database}`);
} catch (error) {
  console.error(
    `Falha no bootstrap: ${error instanceof Error ? error.message : "erro desconhecido"}`,
  );
  process.exitCode = 1;
}
