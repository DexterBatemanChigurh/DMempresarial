#!/usr/bin/env node
/**
 * Backup/Restore do banco de dados DM Empresarial.
 * Uso:
 *   npm run db:backup          # Cria dump lógico
 *   npm run db:restore <arquivo>  # Restaura dump
 *
 * Requer: pg_dump, pg_restore no PATH (PostgreSQL client tools).
 * Em production, use o pg_dump/pg_restore do provedor (ex.: Neon, Supabase)
 * que suportam point-in-time recovery (PITR).
 */

import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=");
      if (key && !key.startsWith("#")) {
        process.env[key.trim()] = rest.join("=").trim();
      }
    }
  }
}

function run(cmd: string, args: string[], env = process.env) {
  const result = spawnSync(cmd, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    throw new Error(`${cmd} falhou com código ${result.status}`);
  }
}

async function main() {
  loadEnv();

  const action = process.argv[2];
  const adminUrl = process.env.DATABASE_URL_ADMIN;
  if (!adminUrl) {
    console.error("DATABASE_URL_ADMIN não definida (veja .env.example).");
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupDir = resolve(__dirname, "..", "backups");
  const backupFile = resolve(backupDir, `dm_empresarial_${timestamp}.dump`);

  if (action === "backup") {
    console.log(`[backup] Criando dump em ${backupFile}`);
    run("pg_dump", [
      "--format=custom",
      "--compress=6",
      "--no-owner",
      "--no-privileges",
      "--file=" + backupFile,
      adminUrl,
    ]);
    console.log("[backup] Concluído.");
  } else if (action === "restore") {
    const file = process.argv[3];
    if (!file || !existsSync(file)) {
      console.error("Uso: npm run db:restore -- <arquivo.dump>");
      process.exit(1);
    }
    console.log(`[restore] Restaurando ${file}...`);
    console.warn("⚠️  ISSO VAI SOBRESCREVER O BANCO ATUAL. Tem certeza? (Ctrl+C para cancelar)");
    await new Promise((r) => setTimeout(r, 5000));
    run("pg_restore", [
      "--clean",
      "--if-exists",
      "--no-owner",
      "--no-privileges",
      "--dbname=" + adminUrl,
      file,
    ]);
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
