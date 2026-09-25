# DM Empresarial — Database Runbook

Versão 1 · 25/09/2026

---

## 1. Visão Geral

| Item      | Detalhes                                                            |
| --------- | ------------------------------------------------------------------- |
| Engine    | PostgreSQL 17+                                                      |
| Extensões | `citext`, `unaccent`, `pgcrypto` (para `gen_random_uuid`)           |
| Pool      | PgBouncer (provedor) ou connection pool nativo                      |
| Roles     | `dm_owner` (DDL), `dm_app` (DML, sem UPDATE/DELETE em `audit_logs`) |
| Backup    | PITR contínuo + dump lógico semanal em bucket separado              |
| Migrações | Drizzle Kit (SQL versionado em `drizzle/`)                          |

---

## 2. Roles e Privilégios

### 2.1 `dm_owner` (Dono)

- Cria/altera schema (DDL)
- Roda migrações (`npm run db:migrate`)
- Bootstrap inicial (`npm run db:bootstrap`)
- **NUNCA** usado em runtime da aplicação

### 2.2 `dm_app` (Aplicação)

```sql
-- Concedido pela migration 0004 / db-bootstrap
GRANT USAGE ON SCHEMA public TO dm_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO dm_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO dm_app;

-- REVOKE crítico: audit_logs é append-only
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM dm_app;
```

### 2.3 Verificação

```sql
-- Confirma que dm_app NÃO pode alterar audit_logs
SET ROLE dm_app;
UPDATE audit_logs SET action = 'hack' WHERE id = '...'; -- Deve falhar com INSUFFICIENT_PRIVILEGE
RESET ROLE;
```

---

## 3. Migrações (Drizzle Kit)

### 3.1 Fluxo Padrão

```bash
# 1. Altera schema em src/db/schema/*.ts
# 2. Gera SQL (revisa o arquivo!)
npm run db:generate
# Cria drizzle/000X_descricao.sql

# 3. Revisa o SQL: expansivo? retrocompatível? índices concorrentes?
# 4. Aplica em DEV
npm run db:migrate

# 5. Testa
npm run test:integration
npm run db:verify

# 6. CI valida (db:verify roda no CI)

# 7. Deploy: migração ANTES do código (manual)
npm run db:migrate  # aponta para DATABASE_URL_ADMIN de production
```

### 3.2 Padrão Expandir → Migrar → Contrair

| Fase         | Ação                                                                | Exemplo                                                  |
| ------------ | ------------------------------------------------------------------- | -------------------------------------------------------- |
| **Expandir** | Adiciona coluna/tabela anulável, novo enum value                    | `ALTER TABLE posts ADD COLUMN new_field TEXT;`           |
| **Migrar**   | Deploya código que usa o novo campo (compatível com vazio)          | Código lê `new_field ?? 'default'`                       |
| **Contrair** | (Release seguinte) Torna NOT NULL, remove coluna antiga, enum value | `ALTER TABLE posts ALTER COLUMN new_field SET NOT NULL;` |

**NUNCA** faça `DROP COLUMN`, `ALTER TYPE`, `RENAME` destrutivos em uma etapa só em production.

### 3.3 Reversão

- **Forward-fix**: Nova migração que corrige (preferido).
- **Rollback real**: Só se forward-fix impossível. Requer restore do backup (PITR ou dump).

---

## 4. Schema Crítico (Tabelas e Constraints)

### 3.1 Tabelas de Autenticação (Better Auth)

| Tabela             | Propósito             | Notas                                                             |
| ------------------ | --------------------- | ----------------------------------------------------------------- |
| `users`            | Usuários CMS          | `role` (ADMIN/EDITOR/AUTHOR), `disabled_at`, `two_factor_enabled` |
| `sessions`         | Sessões               | Revogáveis, expiração 7 dias                                      |
| `accounts`         | Credenciais           | `password` = hash scrypt                                          |
| `verifications`    | Tokens de verificação | Email, reset senha                                                |
| `two_factors`      | TOTP                  | Segredo + backup codes **cifrados**                               |
| `auth_rate_limits` | Rate limit login      | 5 falhas/15min por conta                                          |

### 3.2 Tabelas de Domínio (MVP)

| Tabela                   | Propósito                  | Constraints-chave                                                                                               |
| ------------------------ | -------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `specialists`            | Especialistas/Autores      | `slug` único, `user_id` único opcional, `kind` (TEAM/GUEST)                                                     |
| `posts`                  | Artigos                    | `status` (5 estados), `author_id` → specialists, `version` (optimistic lock), `search_vector` (tsvector gerado) |
| `categories`             | Temas editoriais           | `slug` único                                                                                                    |
| `post_categories`        | N:M post↔cat               | `is_primary`, índice único parcial (1 primária/post)                                                            |
| `tags` / `post_tags`     | Marcação livre             | `slug` único                                                                                                    |
| `solutions`              | Consultorias/Serviços      | `type` (CONSULTORIA/SERVICO), `slug` único                                                                      |
| `solution_items`         | Situações/Etapas/Objetivos | `kind` (SITUATION/STEP/GOAL), único (solution_id, kind, position)                                               |
| `post_solutions`         | N:M post↔sol               | `is_primary`, índice único parcial                                                                              |
| `pages`                  | Páginas institucionais     | `key` único, `template` (enum), `data` (jsonb validado por Zod)                                                 |
| `media`                  | Metadados arquivos         | `storage_key` único, `sha256`, `status` (PENDING/READY)                                                         |
| `leads`                  | Contatos comerciais        | `consent_at`, `consent_version`, `ip_hash`, `notified_at`                                                       |
| `newsletter_subscribers` | Newsletter                 | Double-opt-in, `confirm_token_hash`, `confirm_expires_at`                                                       |
| `redirects`              | Slugs antigos → novos      | `from_path` único, `status_code` (301/308)                                                                      |
| `site_settings`          | Dados da DM (linha única)  | `id=1` fixo, todos anuláveis                                                                                    |
| `rate_limits`            | Formulários públicos       | PK composta (key, window_start)                                                                                 |
| `audit_logs`             | Trilha admin (append-only) | `actor_user_id`, `action`, `entity_type`, `entity_id`, `request_id`                                             |

### 3.3 Constraints Essenciais

- **Coerência estado × datas**: `CHECK` em `posts`, `solutions`, `specialists`, `pages`, `newsletter_subscribers`
- **Slug format**: `^[a-z0-9]+(-[a-z0-9]+)*$` (máx 80 chars)
- **Único parcial**: 1 categoria primária/post, 1 solução primária/post
- **FK**: `RESTRICT` em conteúdo (não apaga categoria/solução em uso), `CASCADE` em junções, `SET NULL` em mídia opcional
- **E-mail**: `citext` + `CHECK` formato
- **Redirects**: Caminho interno, sem laço (`from_path <> to_path`)

---

## 4. Operações Comuns

### 4.1 Seed de Dados Reais

```bash
# Só dados confirmados (categorias + endereço)
npm run db:seed
# Idempotente: ON CONFLICT DO NOTHING
# NUNCA cria conteúdo fictício
```

### 4.2 Limpeza de Dados de Teste (Dev)

```bash
# Limpa apenas dados com prefixo it-dom- / @dom-it.example.test
# Roda automaticamente no globalSetup dos testes de integração
```

### 4.3 Limpeza Periódica (Job Cron)

```sql
-- Rate limits antigos (chave muda por janela, linhas velhas somem sozinhas)
DELETE FROM rate_limits WHERE window_start < now() - interval '7 days';

-- Mídia órfã (sem referência há > 7 dias)
DELETE FROM media
WHERE status = 'PENDING' AND created_at < now() - interval '1 day'
   OR (status = 'READY' AND NOT EXISTS (
     SELECT 1 FROM posts WHERE cover_media_id = media.id
     UNION SELECT 1 FROM specialists WHERE photo_media_id = media.id
     UNION SELECT 1 FROM solutions WHERE cover_media_id = media.id
   ) AND updated_at < now() - interval '7 days');
```

---

## 5. Monitoramento de Saúde

### 5.1 Queries de Verificação

```sql
-- Tamanho do banco e tabelas maiores
SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;
SELECT relname, pg_size_pretty(pg_total_relation_size(oid)) as size
FROM pg_class WHERE relkind = 'r' ORDER BY pg_total_relation_size(oid) DESC LIMIT 10;

-- Conexões ativas
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Locks aguardando
SELECT * FROM pg_locks WHERE NOT granted;

-- Índices não usados
SELECT schemaname, relname, indexrelname, idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0 AND schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;

-- Tabelas sem PK
SELECT tablename FROM pg_tables
WHERE schemaname = 'public' AND tablename NOT IN (
  SELECT tablename FROM pg_indexes WHERE indexdef LIKE '%PRIMARY KEY%'
);
```

### 5.2 Alertas Recomendados

| Métrica                      | Threshold     | Ação                            |
| ---------------------------- | ------------- | ------------------------------- |
| Conexões ativas              | > 80% do pool | Investigar leak / aumentar pool |
| Tamanho DB                   | > 80% disco   | Limpar / escalar storage        |
| Replication lag (se réplica) | > 30s         | Investigar primary              |
| Deadlocks                    | > 5/min       | Revisar queries / locks         |
| Seq scans em tabelas grandes | > 100/min     | Adicionar índices               |

---

## 6. Backup & Restore (Detalhado)

### 6.1 PITR (Point-in-Time Recovery) - Provedor

- Neon/Supabase/RDS: Ativado por padrão.
- RPO: ~0 (contínuo), RTO: minutos.
- **Teste trimestral**: Restore para timestamp aleatório → valide integridade.

### 6.2 Dump Lógico Semanal (Script)

```bash
# Roda via cron externo (GitHub Actions scheduled / serverless function)
npm run db:backup
# Salva em backups/dm_empresarial_YYYY-MM-DDTHH-MM-SS.dump
# Upload para bucket de backup (outra conta/provedor)
```

### 6.3 Restore (Procedimento)

```bash
# 1. Cria banco limpo (teste ou recovery)
createdb dm_empresarial_recovery

# 2. Restaura
pg_restore --clean --if-exists --no-owner --no-privileges \
  --dbname=dm_empresarial_recovery backups/dm_empresarial_2026-09-25T10-30-00.dump

# 3. Valida
psql -d dm_empresarial_recovery -c "SELECT count(*) FROM users;"
psql -d dm_empresarial_recovery -c "SELECT count(*) FROM posts WHERE status = 'PUBLISHED';"
psql -d dm_empresarial_recovery -c "SELECT count(*) FROM audit_logs;"

# 4. Aponta aplicação (DATABASE_URL) para o banco restaurado
# 5. Roda migrations se houver gap
npm run db:migrate
npm run db:verify
npm run test:integration
```

---

## 7. Troubleshooting Comum

| Problema                                           | Diagnóstico                   | Solução                                              |
| -------------------------------------------------- | ----------------------------- | ---------------------------------------------------- |
| `relation "xxx" does not exist`                    | Migração não rodou            | `npm run db:migrate`                                 |
| `permission denied for table audit_logs`           | Role errada                   | Verificar `DATABASE_URL` usa `dm_app`                |
| `duplicate key value violates unique constraint`   | Dado duplicado                | Verificar `ON CONFLICT` / lógica de negócio          |
| `foreign key violation` (23503/23001)              | FK referenciada não existe    | Não apagar categoria/solução em uso                  |
| `check constraint failed`                          | Estado × data incoerente      | Verificar `status` vs `published_at`/`scheduled_for` |
| `cannot execute UPDATE in a read-only transaction` | Tentativa em `audit_logs`     | Bug: app tentando alterar audit log                  |
| `SSL connection has been closed unexpectedly`      | Pool/timeout                  | Ajustar `max` connections / `idle_timeout`           |
| `prepared statement "xxx" does not exist`          | PgBouncer transaction pooling | Usar `session` pooling para DDL/migrations           |

---

## 8. Referências

- `docs/03-engineering-architecture-blueprint.md` (seções 7, 22, 35, 39)
- `drizzle/` (migrations SQL versionadas)
- `scripts/db-bootstrap.mts`, `db-migrate.mts`, `db-seed.mts`
- `scripts/backup-restore.mts`
- `docs/DEPLOYMENT.md` (seção 4)
- `docs/SECURITY.md` (seção 3.2 - auditoria de `audit_logs`)
