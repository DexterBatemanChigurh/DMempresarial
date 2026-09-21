// Verifica a conexão com o banco configurado em DATABASE_URL_ADMIN.
// Uso: npm run db:check   (lê .env.local). Nunca imprime a URL nem a senha.
import pg from "pg";

const url = process.env.DATABASE_URL_ADMIN;
if (!url) {
  console.error("DATABASE_URL_ADMIN não está definida (veja .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });

try {
  await client.connect();
  const { rows } = await client.query<{ db: string; usr: string; version: string }>(
    "select current_database() as db, current_user as usr, split_part(version(), ' on ', 1) as version",
  );
  const row = rows[0];
  console.log(`Conexão OK — banco: ${row?.db} | usuário: ${row?.usr} | ${row?.version}`);
} catch (error) {
  const reason = error instanceof Error ? error.message : "erro desconhecido";
  console.error(`Falha ao conectar: ${reason}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
