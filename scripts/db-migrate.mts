// Aplica as migrations versionadas em ./drizzle com o role dono do banco.
// Uso: npm run db:migrate   (lê .env.local). Nunca imprime URL nem senha.
import { runMigrations } from "./lib/db-admin.mts";

const adminUrl = process.env.DATABASE_URL_ADMIN;
if (!adminUrl) {
  console.error("Defina DATABASE_URL_ADMIN (veja .env.example).");
  process.exit(1);
}

try {
  await runMigrations(adminUrl);
  console.log("Migrations aplicadas.");
} catch (error) {
  console.error(
    `Falha nas migrations: ${error instanceof Error ? error.message : "erro desconhecido"}`,
  );
  process.exitCode = 1;
}
