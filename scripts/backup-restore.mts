#!/usr/bin/env node
/**
 * Backup/Restore do banco de dados DM Empresarial.
 * Uso:
 *   npm run db:backup                     # Cria dump lógico em backups/ (fora do git)
 *   npm run db:restore -- <arquivo.dump>  # Restaura dump (pede confirmação digitada)
 *
 * Requer: pg_dump, pg_restore no PATH (PostgreSQL client tools).
 * Em production, use o pg_dump/pg_restore do provedor (ex.: Neon, Supabase)
 * que suportam point-in-time recovery (PITR).
 *
 * O banco-alvo vem de DATABASE_URL_ADMIN. Os scripts do npm carregam `.env.local` com
 * `--env-file-if-exists`, que NÃO sobrescreve o que já está no ambiente: para apontar outro banco,
 * basta exportar a variável antes. O dump contém dados pessoais (leads): fica em `backups/`
 * (ignorado pelo git e barrado no pre-commit), com permissão só do dono.
 */

import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** A senha sai da URL e vai por PGPASSWORD: não aparece na lista de processos (`ps`). */
function connection(adminUrl: string): { url: string; env: NodeJS.ProcessEnv; label: string } {
  const url = new URL(adminUrl);
  const password = decodeURIComponent(url.password);
  url.password = "";
  const env = { ...process.env, ...(password ? { PGPASSWORD: password } : {}) };
  return { url: url.toString(), env, label: `${url.hostname}${url.pathname}` };
}

function run(cmd: string, args: string[], env: NodeJS.ProcessEnv) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(`${cmd} falhou com código ${result.status}`);
  }
}

async function main() {
  const action = process.argv[2];
  const adminUrl = process.env.DATABASE_URL_ADMIN;
  if (!adminUrl) {
    console.error("DATABASE_URL_ADMIN não definida (veja .env.example).");
    process.exit(1);
  }
  const target = connection(adminUrl);

  if (action === "backup") {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = resolve(__dirname, "..", "backups");
    mkdirSync(backupDir, { recursive: true, mode: 0o700 });
    const backupFile = resolve(backupDir, `dm_empresarial_${timestamp}.dump`);
    console.log(`[backup] Banco: ${target.label}`);
    console.log(`[backup] Criando dump em ${backupFile}`);
    run(
      "pg_dump",
      [
        "--format=custom",
        "--compress=6",
        "--no-owner",
        "--no-privileges",
        "--file=" + backupFile,
        "--dbname=" + target.url,
      ],
      target.env,
    );
    chmodSync(backupFile, 0o600);
    console.log("[backup] Concluído.");
  } else if (action === "restore") {
    const file = process.argv[3];
    if (!file || !existsSync(file)) {
      console.error("Uso: npm run db:restore -- <arquivo.dump>");
      process.exit(1);
    }
    console.warn(`⚠️  ISSO VAI SOBRESCREVER O BANCO ${target.label} com ${file}.`);
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const answer = await rl.question(
      `Para confirmar, digite o host (${new URL(adminUrl).hostname}): `,
    );
    rl.close();
    if (answer.trim() !== new URL(adminUrl).hostname) {
      console.error("[restore] Cancelado: confirmação não confere.");
      process.exit(1);
    }
    run(
      "pg_restore",
      ["--clean", "--if-exists", "--no-owner", "--no-privileges", "--dbname=" + target.url, file],
      target.env,
    );
    console.log("[restore] Concluído. Rode migrations se necessário: npm run db:migrate");
  } else {
    console.error("Uso: npm run db:backup | npm run db:restore -- <arquivo.dump>");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
