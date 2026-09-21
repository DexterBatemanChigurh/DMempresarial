import { defineConfig } from "drizzle-kit";

// Só `generate` usa este arquivo (não precisa de conexão). Migrations são aplicadas por
// `npm run db:migrate` (scripts/db-migrate.mts) com o role dono do banco.
export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./drizzle",
  strict: true,
  verbose: true,
});
