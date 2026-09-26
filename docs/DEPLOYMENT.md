# DM Empresarial — Deployment Runbook

Versão 1 · 25/09/2026

---

## 1. Pré-requisitos

| Item       | Detalhes                                    |
| ---------- | ------------------------------------------- |
| Node       | ≥ 24 (`.nvmrc`)                             |
| pnpm/npm   | `npm ci` (lockfile exato)                   |
| PostgreSQL | 17+ com `citext`, `unaccent`                |
| Storage    | S3-compatível (AWS S3, R2, MinIO, etc.)     |
| E-mail     | Resend (domínio verificado, SPF/DKIM/DMARC) |
| DNS        | Domínio configurado com A/AAAA + CNAME www  |
| Vercel     | Projeto vinculado ao repo `main`            |

---

## 2. Variáveis de Ambiente (Production)

Preencha **todas** no painel da Vercel (Settings → Environment Variables). Use `.env.example` como guia.

| Variável                             | Exemplo                                               | Obrigatória?                                     |
| ------------------------------------ | ----------------------------------------------------- | ------------------------------------------------ |
| `APP_ENV`                            | `production`                                          | ✅                                               |
| `SITE_URL`                           | `https://dm.empresarial.com`                          | ✅ (https)                                       |
| `LOG_LEVEL`                          | `info`                                                | —                                                |
| `DATABASE_URL`                       | `postgresql://dm_app:...@host/db?sslmode=verify-full` | ✅ (role `dm_app`, sem DDL)                      |
| `DATABASE_URL_ADMIN`                 | `postgresql://dm_owner:...@host/db`                   | ❌ **Nunca na Vercel** — só no passo de migração |
| `BETTER_AUTH_SECRET`                 | `openssl rand -base64 48`                             | ✅                                               |
| `BETTER_AUTH_URL`                    | `https://dm.empresarial.com`                          | — (cai em `SITE_URL`)                            |
| `REQUIRE_2FA`                        | `true`                                                | — (padrão `true`; `false` é recusado)            |
| `CRON_SECRET`                        | `openssl rand -base64 48`                             | ✅                                               |
| `SIGNED_TOKEN_SECRET`                | `openssl rand -base64 48`                             | ✅                                               |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | `openssl rand -base64 32`                             | (multi-instância)                                |
| `STORAGE_DRIVER`                     | `s3`                                                  | ✅ (ou os `STORAGE_*` abaixo)                    |
| `STORAGE_ENDPOINT`                   | `https://<conta>.r2.cloudflarestorage.com`            | ✅ com s3                                        |
| `STORAGE_BUCKET`                     | `dm-empresarial-media` (pode ser privado)             | ✅ com s3                                        |
| `STORAGE_ACCESS_KEY_ID`              | `...`                                                 | ✅ com s3                                        |
| `STORAGE_SECRET_ACCESS_KEY`          | `...`                                                 | ✅ com s3                                        |
| `STORAGE_REGION`                     | `auto` (R2) / `us-east-1` (AWS)                       | —                                                |
| `EMAIL_FROM`                         | `DM Empresarial <contato@dm.empresarial.com>`         | ✅                                               |
| `RESEND_API_KEY`                     | `re_...`                                              | ✅                                               |
| `LEAD_NOTIFY_TO`                     | `comercial@dm.empresarial.com`                        | — (cai no e-mail de Configurações)               |

O `env.ts` recusa subir em production sem os itens ✅ (falha rápida, mensagem só com o nome da variável). O IP dos formulários é guardado apenas como HMAC diário assinado com `BETTER_AUTH_SECRET`.

---

## 3. Pipeline de Deploy (GitHub Actions → Vercel)

### 3.1 CI (`.github/workflows/ci.yml`)

Executa em **todo PR e push em `main`**:

1. `npm ci`
2. `npm run format:check`
3. `npm run lint`
4. `npm run typecheck`
5. `npm run test` (unit)
6. `npm run db:verify`
7. `npm run test:integration` (Postgres real)
8. `npm run build`
9. `npm run lighthouse` (orçamentos de performance)
10. `npm audit --omit=dev --audit-level=high`
11. Gitleaks + Dependency Review

**Falha em qualquer etapa = PR bloqueado.**

### 3.2 Deploy Automático (Vercel)

- **Branch `main`** → Deploy de **production** automático após CI verde.
- **Branches `feat/*`, `fix/*`** → Preview deploy (URL temporária).
- Vercel roda `npm run build` (já validado no CI).

### 3.3 Migrações (Passo Separado e Explícito)

**NUNCA** rode migrações automaticamente no deploy do código.

1. CI verde → merge em `main`.
2. **Manual**: `npm run db:migrate` apontando para `DATABASE_URL_ADMIN` do production.
3. Verifique `npm run db:verify` no production.
4. Deploy do código (Vercel faz sozinho após merge).

> Migrações seguem padrão **expandir → migrar → contrair** (ADR-001). Código novo compatível com schema antigo + novo.

---

## 4. Backup & Restore

### 4.1 Estratégia

| Ativo          | Frequência              | Retenção             | Onde                                     |
| -------------- | ----------------------- | -------------------- | ---------------------------------------- |
| Banco (PITR)   | Contínuo (provedor)     | 30 dias + 12 mensais | Provedor (Neon/Supabase)                 |
| Banco (lógico) | Semanal (script)        | 30 dias + 12 mensais | Bucket **outro provedor/conta**          |
| Media          | Versionamento do bucket | 30 dias              | Bucket principal                         |
| Segredos       | Cofre do provedor       | —                    | Vercel / 1Password / AWS Secrets Manager |
| Código         | Git (repo remoto)       | —                    | GitHub                                   |

### 4.2 Scripts

```bash
# Backup lógico (roda semanal via cron externo)
npm run db:backup
# Cria backups/dm_empresarial_2026-09-25T10-30-00.dump

# Restore (manual, com confirmação)
npm run db:restore -- backups/dm_empresarial_2026-09-25T10-30-00.dump
```

### 4.3 Teste de Restore (Obrigatório antes do lançamento)

1. Crie banco de teste limpo.
2. `npm run db:restore -- <arquivo>`.
3. `npm run db:migrate` (se houver migrations novas).
4. `npm run db:verify`.
5. `npm run test:integration` apontando para o banco restaurado.
6. Valide contagem de linhas nas tabelas críticas (`users`, `posts`, `leads`, `audit_logs`).

**Registro**: Data, tempo de restore, responsável, resultado (OK/FALHA).

---

## 5. Rollback

### 5.1 Rollback de Código (Vercel)

1. Vercel Dashboard → Deployments → "..." no deploy anterior → **Promote to Production**.
2. Ou: `vercel rollback <deployment-url>` (CLI).
3. **Tempo**: < 2 min.

### 5.2 Rollback de Schema (Migrações)

**Migrações são sempre retrocompatíveis** (expand → migrate → contract).

- Se migração nova quebrou: **não reverta a migração**.
- Corrija com **nova migração forward-fix** (corrige o problema, mantém compatibilidade).
- Exemplo: coluna adicionada errado → nova migração que remove a coluna.

### 5.3 Rollback de Dados (Point-in-Time)

Se houver corrupção/dado errado:

1. Use PITR do provedor (Neon: `Point-in-time recovery` no console).
2. Restaure para timestamp anterior ao incidente.
3. Aponte `DATABASE_URL` para a instância restaurada.
4. Valide integridade + `npm run test:integration`.

---

## 6. Checklist de Pós-Deploy (Obrigatório)

Após **cada** deploy em production:

- [ ] `/` carrega (200, HTML, CSP headers)
- [ ] `/api/health` → `{"status":"ok"}` (200, `Cache-Control: no-store`)
- [ ] `/robots.txt` → permite `/`, bloqueia `/admin` e `/api`
- [ ] `/sitemap.xml` → XML válido, só URLs públicas
- [ ] Login admin funciona (2FA se configurado)
- [ ] Criação de artigo → publica → aparece no blog
- [ ] Formulário contato → lead gravado → e-mail enviado (verificar Resend dashboard)
- [ ] Newsletter inscrição → e-mail confirmação → clique → ACTIVE
- [ ] Upload imagem → aparece no admin → URL pública acessível
- [ ] Lighthouse CI passou (performance ≥ 90, a11y ≥ 90)
- [ ] `npm run test:integration` passa apontando para production (opcional, staging)

---

## 7. Monitoramento Mínimo

| Métrica                  | Ferramenta                               | Alerta                       |
| ------------------------ | ---------------------------------------- | ---------------------------- |
| Uptime                   | Vercel / UptimeRobot                     | < 99.9% em 5 min             |
| `/api/health`            | Vercel / UptimeRobot                     | > 500ms ou 5xx               |
| Cron `/api/cron/publish` | Logs Vercel + `alert` no job             | Job não roda em 2x intervalo |
| Erros 5xx                | Vercel Logs / Sentry (futuro)            | > 10/min                     |
| Falha e-mail lead        | Resend dashboard + `notified_at IS NULL` | > 5 pendentes                |
| Espaço em disco (media)  | Provedor storage                         | > 80%                        |

---

## 8. Segredos & Rotação

| Segredo                               | Rotação           | Como                                                      |
| ------------------------------------- | ----------------- | --------------------------------------------------------- |
| `BETTER_AUTH_SECRET`                  | 90 dias           | Novo valor na Vercel → redeploy                           |
| `CRON_SECRET`                         | 90 dias           | Novo valor na Vercel → redeploy                           |
| `SIGNED_TOKEN_SECRET`                 | 90 dias           | Novo valor na Vercel → redeploy (invalida tokens antigos) |
| `RESEND_API_KEY`                      | Conforme Resend   | Novo key no Resend → atualiza na Vercel                   |
| `STORAGE_SECRET_ACCESS_KEY`           | Conforme provedor | Novo key no provedor → atualiza na Vercel                 |
| `DATABASE_URL` / `DATABASE_URL_ADMIN` | Conforme provedor | Nova senha no provedor → atualiza na Vercel               |

**Nunca** reutilize segredos entre ambientes (dev/staging/prod).

---

## 9. Contatos de Emergência

| Papel          | Nome | Canal               |
| -------------- | ---- | ------------------- |
| Tech Lead      | —    | —                   |
| DBA / Infra    | —    | —                   |
| Security       | —    | —                   |
| Vercel Support | —    | Dashboard → Support |

---

## 10. Referências

- `docs/03-engineering-architecture-blueprint.md` (seções 34, 35, 36)
- `docs/04-project-audit-and-plan.md` (seção 16)
- ADR-014 (Deploy), ADR-017 (Ambiente)
- `scripts/backup-restore.mts`
- `.github/workflows/ci.yml`
