// Carrega os dados base confirmados (categorias e endereço). Idempotente.
// Uso: npm run db:seed   (lê .env.local). Nunca imprime URL nem senha.
import { seedBase } from "./lib/db-seed.mts";

const adminUrl = process.env.DATABASE_URL_ADMIN;
if (!adminUrl) {
  console.error("Defina DATABASE_URL_ADMIN (veja .env.example).");
  process.exit(1);
}

try {
  await seedBase(adminUrl);
  console.log("Dados base carregados (categorias e endereço confirmados).");
} catch (error) {
  console.error(`Falha no seed: ${error instanceof Error ? error.message : "erro desconhecido"}`);
  process.exitCode = 1;
}
