// Aplica os prazos da Política de Privacidade: hash de IP some em 30 dias; leads, em 24 meses.
// Uso: npm run leads:retention   (agendar 1x por dia, ex.: cron do servidor ou Vercel Cron).
import pg from "pg";

const url = process.env.DATABASE_URL_ADMIN;
if (!url) {
  console.error("DATABASE_URL_ADMIN não está definida (veja .env.example).");
  process.exit(1);
}

const client = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5000 });

try {
  await client.connect();
  await client.query("begin");
  const ip = await client.query(
    "update leads set ip_hash = null where ip_hash is not null and created_at < now() - interval '30 days'",
  );
  const old = await client.query(
    "delete from leads where created_at < now() - interval '24 months'",
  );
  await client.query("commit");
  console.log(
    `Retenção OK — hashes de IP apagados: ${ip.rowCount} | leads excluídos: ${old.rowCount}`,
  );
} catch (error) {
  await client.query("rollback").catch(() => undefined);
  const reason = error instanceof Error ? error.message : "erro desconhecido";
  console.error(`Falha na retenção: ${reason}`);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
