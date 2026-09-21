# DM Empresarial — Project Audit

Versão 1 · 21/09/2026 · Etapa: Prompt 4, passos 1 a 7 (auditoria, classificação, conflitos, riscos, plano de migração, ordem de implementação e **checkpoint**). Nenhuma implementação de fase foi iniciada.

Base: [01 Product + UX](./01-product-ux-blueprint.md) · [02 Design System](./02-design-system-blueprint.md) · [03 Engineering Architecture](./03-engineering-architecture-blueprint.md).

**Método.** Foram lidos todos os arquivos de configuração e de código; executados `lint`, `typecheck`, testes, `build`, `npm audit`, `npm outdated` e `prettier --check`; servido o build de produção com `next start` para inspecionar cabeçalhos e rotas; consultados o Docker, o git e a documentação embutida no Next 16.3.5. Nada disso alterou dados. O que **não** foi possível verificar está marcado.

---

## 1. Stack atual

| Item           | Situação                                                                                     |
| -------------- | -------------------------------------------------------------------------------------------- |
| Runtime        | Node 24 (`.nvmrc`, `engines >=24`, `engine-strict`); Node 24.20.0 e npm 11.19.0 na máquina   |
| Framework      | Next.js 16.3.5 (Turbopack), React 19.3.0, App Router                                         |
| Linguagem      | TypeScript 6.0.3, `strict` + `noUncheckedIndexedAccess`                                      |
| Estilo         | Tailwind CSS 4.3.3 via PostCSS; `globals.css` só com `@import "tailwindcss"`                 |
| Validação      | Zod 4.6.5                                                                                    |
| Banco (driver) | `pg` 8.23.0 (usado só por `scripts/db-check.mts`)                                            |
| Qualidade      | ESLint 9.39.5 (`eslint-config-next`), Prettier 3.9.8, Vitest 5.0.1                           |
| Dependências   | Produção: 6 (`next`, `pg`, `react`, `react-dom`, `server-only`, `zod`). Desenvolvimento: 11  |
| Versões        | Todas exatas (`save-exact`); `npm audit`: **0 vulnerabilidades** (produção e total)          |
| Desatualizadas | `eslint` 9→10, `typescript` 6→7, `@types/node` 24→26: **intencional**, documentado no README |

## 2. Estrutura atual

```text
.  compose.yaml  eslint.config.mjs  next.config.ts  vitest.config.mts  package.json  README.md
├── src/app/         layout.tsx  page.tsx  globals.css  robots.ts  api/health/route.ts   (+ testes)
├── src/lib/         errors.ts  result.ts                                                  (+ testes)
├── src/server/      env.ts  logging/logger.ts                                             (+ testes)
├── src/components/  (vazia)          src/modules/  (vazia)
├── scripts/         db-check.mts
├── tests/           stubs/server-only.ts  next-config.test.ts
├── docs/            01, 02, 03, 04 (criados nesta etapa; a pasta estava vazia)
├── .github/workflows/ci.yml   .githooks/pre-commit                (criados nesta etapa)
└── ~650 linhas de TypeScript no total, incluindo testes
```

## 3. Rotas atuais

| Rota          | Tipo                  | Conteúdo                                                                        |
| ------------- | --------------------- | ------------------------------------------------------------------------------- |
| `/`           | Estática              | Placeholder: "DM Empresarial / Consultoria empresarial • Frutal/MG", sem estilo |
| `/api/health` | Dinâmica              | `{"status":"ok"}`, `Cache-Control: no-store`                                    |
| `/robots.txt` | Dinâmica (desde hoje) | Fecha tudo fora de production; em production libera e exclui `/admin` e `/api`  |
| `/_not-found` | Estática              | 404 padrão do Next (sem página própria)                                         |

Verificado servindo o build de produção: os 4 cabeçalhos de segurança presentes em todas as respostas (nosniff, referrer, permissions, frame `DENY`). **Ausentes:** CSP e HSTS.

## 4. Banco atual

- `compose.yaml`: Postgres 17-alpine, container `dm_empresarial_db`, publicado em `127.0.0.1:5433`, healthcheck, volume `dm-empresarial_dm_empresarial_pgdata`.
- **Estado hoje:** o container **não existe** (foi removido depois do início da sessão, provavelmente por `db:down`); o **volume persiste**. Por isso **não consultei as tabelas**: a afirmação "sem banco modelado" vem do README e do código (não há schema, ORM nem migration), não de uma consulta.
- Um único role, `dm_owner` (dono do banco). Não há role de aplicação.
- Sem ORM. Sem `drizzle/`. `DATABASE_URL_ADMIN` é a única URL.

## 5. Autenticação atual

**Nenhuma.** Não há `proxy.ts`, sessão, papéis nem área administrativa.

## 6. APIs atuais

Só `/api/health`. Sem Server Actions, sem Route Handlers de negócio.

## 7. Componentes existentes

**Nenhum.** `src/components/` está vazia. Não há tokens do Design System, fontes, nem página real.

## 8. Funcionalidades existentes (e testadas)

| Funcionalidade                                                                                     | Onde                                   | Testes |
| -------------------------------------------------------------------------------------------------- | -------------------------------------- | ------ |
| Variáveis de ambiente validadas, _fail-fast_, sem vazar valores; `APP_ENV` obrigatório em produção | `src/server/env.ts`                    | Sim    |
| Logger estruturado com redação de segredos (chaves e credenciais em URL)                           | `src/server/logging/logger.ts`         | Sim    |
| Modelo de erros (`AppError`, `toActionError`) e `ActionResult`                                     | `src/lib/errors.ts`, `result.ts`       | Sim    |
| Health check                                                                                       | `src/app/api/health/route.ts`          | Sim    |
| `robots` que falha para o lado seguro                                                              | `src/app/robots.ts`                    | Sim    |
| Cabeçalhos de segurança de base                                                                    | `next.config.ts`                       | Sim    |
| Fronteiras de camada por ESLint (componentes e domínio puro)                                       | `eslint.config.mjs`                    | Lint   |
| Postgres local por Docker e script de verificação de conexão                                       | `compose.yaml`, `scripts/db-check.mts` | Manual |

Estado dos portões em 21/09/2026: **lint, typecheck, format, 31 testes (6 arquivos) e build passam**.

## 9. Integrações

Nenhuma (sem e-mail, storage, analytics, CDN, monitoramento). Deploy: **nenhum configurado** (sem `.vercel`, `vercel.json` ou Dockerfile).

## 10. Problemas encontrados

| #   | Problema                                                                                                                                                                                         | Gravidade            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------- |
| P1  | **Fase 1 declarada "concluída" no README, mas o Prompt 4 §9 inclui "configuração de banco" e "configuração de autenticação".** Não há cliente de banco, ORM nem auth. Falta uma "Fase 1b"        | Média                |
| P2  | Os documentos citados no código ("ADR-009", "Prompt 3 §…", Product Blueprint, Design System) **não existiam** no repositório. Agora existem `docs/01` a `04`; os ADRs ainda precisam ser criados | Média                |
| P3  | **Nenhum _remote_ git**, um único commit, e **todo o trabalho desta sessão está sem commit** (env, robots, CI, hook, testes, docs)                                                               | Média                |
| P4  | `robots.ts` usa `export const dynamic = "force-dynamic"`. Com `cacheComponents` ligado (recomendado no ADR-007), esse _export_ **vira erro**; migrar para `connection()`                         | Baixa (adiada)       |
| P5  | Sem CSP e HSTS (adiados no código com referência ao ADR-009, que não existia)                                                                                                                    | Baixa (planejado)    |
| P6  | Sem `error.tsx`, `global-error.tsx`, `not-found.tsx`, `instrumentation.ts`, `proxy.ts`, `sitemap.ts`, fontes nem tokens; metadata e página são provisórias                                       | Baixa (planejado)    |
| P7  | `logger.ts` lê `process.env.LOG_LEVEL` direto, fora do `env()` validado, e não tem `server-only` (apontado na primeira auditoria, **ainda aberto**)                                              | Baixa                |
| P8  | Hook de pre-commit só passa a valer após `npm install` (script `prepare`) ou `git config core.hooksPath .githooks`; hoje `core.hooksPath` está **vazio**                                         | Baixa                |
| P9  | Container do Postgres do DM parado; volume preservado                                                                                                                                            | Info                 |
| P10 | **Fora do projeto:** o container `avanca_db` (Avança-Imóveis) está publicado em `0.0.0.0:5432`, acessível pela rede local                                                                        | Info (outro projeto) |
| P11 | README: `db:check` não consta na tabela de comandos; ainda descreve `src/components` e `src/modules` (existem, vazias)                                                                           | Baixa                |

## 11. Débitos técnicos

- Cobertura de testes limitada ao que existe (sem integração nem E2E; sem banco de teste).
- Sem rotina de atualização de dependências (Dependabot/Renovate) nem varredura de segredos no CI.
- Sem ADRs, _runbooks_ ou documentação de segurança/deploy (`ARCHITECTURE`, `SECURITY`, `DEPLOYMENT`, `DATABASE`, `CMS`).
- Comentários de código citam "Prompt 3 §N" onde N é o número da **parte do blueprint** (não do prompt). Passa a fazer sentido com o documento 03, mas convém trocar por links para `docs/`.

## 12. Vulnerabilidades potenciais

| Área           | Achado                                                                                                                          |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Dependências   | Nenhuma conhecida (`npm audit` = 0)                                                                                             |
| Segredos       | `.env.local` ignorado pelo git, modo 600, senha de 48 caracteres, **nenhum segredo no histórico** (varredura por padrões feita) |
| Cabeçalhos     | Sem CSP/HSTS (esperado nesta fase)                                                                                              |
| Superfície     | Pequena: 1 rota dinâmica sem dado e sem entrada de usuário. **Nenhum vetor de IDOR/XSS/upload existe ainda**                    |
| Configuração   | Falha de configuração de produção **agora** é detectada (`APP_ENV` obrigatório)                                                 |
| Fora do escopo | P10 (porta 5432 do Avança-Imóveis na rede)                                                                                      |

---

## 13. Classificação (KEEP / REFACTOR / REPLACE / REMOVE / CREATE)

| Item                                                                          | Classe                  | Justificativa                                                                                     |
| ----------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| Next 16, React 19, TS 6, Tailwind 4, ESLint 9, Vitest, Prettier               | **KEEP**                | Funcionam, alinhados ao Prompt 3; versões pinadas por motivos documentados                        |
| `src/lib/errors.ts`, `result.ts`                                              | **KEEP**                | Já implementam o modelo de erros do Prompt 3 §32; testados                                        |
| `src/server/env.ts`                                                           | **KEEP**                | Será **estendido** por grupo (banco, auth, storage, e-mail); a regra de produção já foi reforçada |
| `src/server/logging/logger.ts`                                                | **REFACTOR**            | Ler nível via `env()`, adicionar `server-only` e `request_id` (P7); não reescrever                |
| `src/app/robots.ts`                                                           | **REFACTOR**            | Trocar `force-dynamic` por `connection()` quando `cacheComponents` for ligado (P4)                |
| `next.config.ts` (cabeçalhos)                                                 | **REFACTOR**            | Acrescentar CSP (camada pública), HSTS, COOP; manter os 4 existentes                              |
| `eslint.config.mjs` (fronteiras)                                              | **REFACTOR**            | Estender: `app/` não importa `infrastructure` nem `drizzle-orm`; regra de tokens                  |
| `compose.yaml`, `scripts/db-check.mts`                                        | **KEEP**                | Ambiente local do banco; acrescentar banco de teste e role `dm_app` via migration                 |
| `.env.example`                                                                | **REFACTOR**            | Ampliar com `DATABASE_URL`, auth, storage, e-mail (placeholders)                                  |
| `src/app/layout.tsx`, `page.tsx`, `globals.css`                               | **REPLACE**             | Provisórios por definição (comentários do próprio código); substituídos pelas Fases 2 e 5         |
| `.github/workflows/ci.yml`, `.githooks/pre-commit`                            | **KEEP** (criados hoje) | Estender com integração, E2E, segredos                                                            |
| Estrutura `modules/` e `server/`                                              | **KEEP**                | ADR-013: preservar a convenção existente em vez de renomear para `features/`/`src/db`             |
| Página `/` placeholder                                                        | **REMOVE**              | Somente quando a Home real existir (Fase 5). Até lá permanece                                     |
| Cliente de banco, schema, migrations, roles                                   | **CREATE**              | Fase 1b/3                                                                                         |
| Autenticação, `can(...)`, CMS, editor, mídia                                  | **CREATE**              | Fase 4                                                                                            |
| Tokens, fontes, primitivos, componentes, templates                            | **CREATE**              | Fases 2, 5, 6                                                                                     |
| Leads, newsletter, e-mail, rate limit                                         | **CREATE**              | Fase 7                                                                                            |
| Sitemap, JSON-LD, redirecionamentos, `not-found`/`error`                      | **CREATE**              | Fase 8                                                                                            |
| ADRs, `ARCHITECTURE`, `SECURITY`, `DEPLOYMENT`, `DATABASE`, `CMS`, _runbooks_ | **CREATE**              | Ao longo das fases; só documentar o que existir (Prompt 4 §75)                                    |

**Nada a remover agora.** Não há código funcional a descartar; toda mudança é **aditiva** ou de refino.

---

## 14. Conflitos com os Prompts 1–3

Detalhados no [documento 03, seção 43](./03-engineering-architecture-blueprint.md). Resumo:

| Conflito                                                                                                          | Recomendação                                                                          |
| ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `features/` (Prompt 3) × `modules/` (repositório)                                                                 | Manter `modules/` (ADR-013)                                                           |
| `src/db` (Prompt 3) × `src/server` (repositório)                                                                  | Manter `src/server/db`                                                                |
| Tabela `authors` (Prompt 3) × autor = especialista (Blueprint 1, D5)                                              | Uma entidade só (`specialists` com `kind`)                                            |
| `/servicos` (Prompt 1) × entidade única de soluções (Prompt 3 §8)                                                 | Só `/solucoes` (Blueprint 1, D1). **Muda o menu.**                                    |
| Badge e Modal (Prompt 4 §11) × Design System que os removeu                                                       | Seguir o Design System                                                                |
| Ordem da Home (Prompt 4 §25) × Blueprint 1                                                                        | Blueprint 1 (o próprio §25 diz "não trate como dogma")                                |
| Campos do contato (Prompt 4 §31) × Prompt 1 §21                                                                   | União com opcionais, 3 obrigatórios (D3)                                              |
| **Numeração de fases do Prompt 4** (§8: 12 fases · títulos: "FASE 2 = Banco", "FASE 8 = Testes" · §77: 18 etapas) | Usar a lista do §8 como fases e o §77 como sequência interna (documento 03, seção 45) |
| `AUTH_SECRET` (Prompt 3) × `BETTER_AUTH_SECRET` (biblioteca)                                                      | Usar o nome da biblioteca                                                             |
| Prompt 3 §8 (`result` em soluções) × Blueprint 1 (proíbe prometer resultado)                                      | Substituir por itens `GOAL`; sem promessa                                             |

Conflitos **entre o Prompt 3 e o estado do repositório**: nenhum bloqueante. O código existente segue o que o Prompt 3 pede (erros, logging, env, camadas).

## 15. Riscos

Os riscos técnicos completos estão na [seção 42 do documento 03](./03-engineering-architecture-blueprint.md). Os que afetam a **sequência de execução**:

1. **Documentação do Next 16 diverge do que se conhece** (Proxy, `revalidateTag` com 2º argumento, Cache Components): consultar `node_modules/next/dist/docs` antes de cada uso.
2. **Conteúdo real inexistente** (soluções, especialistas, fotos, textos, contato): as Fases 5 e 6 constroem a estrutura e as regras de ausência com dados `[DEMO]`; **o lançamento fica bloqueado** pelas lacunas L-02 a L-11.
3. **Decisão de deploy em aberto** condiciona upload de mídia (limite de corpo), agendador e escolha do Postgres; pode esperar até a Fase 4, mas não além.
4. **Jurídico/LGPD** bloqueia atribuição de origem, retenção e textos legais.
5. **Trabalho sem commit e sem _remote_:** risco de perda; primeiro passo do plano é corrigir isso.

---

## 16. Plano de migração e ordem de implementação

Toda etapa é **aditiva** (nenhuma exclusão em massa, nenhuma reescrita do que funciona). Ao fim de cada uma: `lint` → `typecheck` → testes → `build` → revisão do diff → checagem de regressão de rotas existentes (`/`, `/api/health`, `/robots.txt`).

| Passo | Fase  | Entrega                                                                                                                                                                                                                                                                  | Depende de                                               |
| ----- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------- |
| 0     | —     | **Commit** do trabalho pendente (em commits pequenos e coerentes) e, se quiser, criar o _remote_                                                                                                                                                                         | Sua autorização                                          |
| 1     | 1b    | Drizzle (0.45.x) + cliente em `src/server/db`; role `dm_app` por migration; `DATABASE_URL`; banco de teste; P7 (logger via `env()`); ADRs 001, 002, 013, 017                                                                                                             | Aprovação da pilha (ADR-002)                             |
| 2     | 1b    | Configuração do Better Auth (sem telas ainda) e `can(...)` esqueleto com testes; ADRs 005, 006                                                                                                                                                                           | Aprovação da pilha (ADR-005)                             |
| 3     | 2     | **Design System**: tokens (paleta e escala do Blueprint 2), Newsreader + Instrument Sans por `next/font`, Container/Section/Heading/Button/Link/Field/SectionLabel/Figure, estados, regra de movimento reduzido, **teste de contraste dos tokens**, página de referência | Blueprint 2 (valores de cor/fonte a validar visualmente) |
| 4     | 3     | Schema completo, migrations revisadas, constraints e índices, seeds (categorias reais + `[DEMO]`), repositórios e testes de integração                                                                                                                                   | Passos 1–2; aprovação de D1, D3, D5                      |
| 5     | 4     | CMS: login + 2FA, papéis, CRUD, editor Tiptap, estados, preview, mídia, auditoria; **matriz de permissões e IDOR 100% testados**                                                                                                                                         | Passo 4; T-03 (storage), T-04, T-05                      |
| 6     | 5     | Páginas públicas + `cacheComponents` (migrar `robots`), regras "dado ausente = seção ausente"                                                                                                                                                                            | Passos 3–5; D4                                           |
| 7     | 6     | Blog: índice, categoria, artigo, relacionados, paginação; busca quando houver volume                                                                                                                                                                                     | Passo 6                                                  |
| 8     | 7     | Leads e newsletter (pipeline completo, e-mail, rate limit, anti-spam)                                                                                                                                                                                                    | T-11 (domínio de e-mail); T-06/T-07 (jurídico)           |
| 9     | 8     | SEO: metadata com fallback, sitemap, JSON-LD, redirecionamentos, 404                                                                                                                                                                                                     | Passos 6–7                                               |
| 10    | 9     | Segurança: CSP em duas camadas (primeiro _report-only_), HSTS, auditoria da lista da seção 41, teste de intrusão                                                                                                                                                         | Passos 5–9                                               |
| 11    | 10–11 | Performance (medida contra orçamentos), acessibilidade, suíte E2E                                                                                                                                                                                                        | Passos 6–10                                              |
| 12    | 12    | Ambientes, pipeline com migrations, backups **testados por restauração**, _rollback_ ensaiado, pós-deploy                                                                                                                                                                | T-01, T-02; conteúdo real (L-02 a L-11)                  |

**Contagem final:** Fase 1 **parcial** (falta a 1b: banco e auth) + **11 fases não iniciadas**.

### Como cada etapa é entregue (Prompt 4 §88)

Cada feature importante será relatada com: objetivo, arquivos alterados, banco, API, frontend, segurança, SEO, testes e status (`DONE` / `PARTIAL` / `BLOCKED`), e ao final da implementação o _Implementation Report_ de 20 itens (Prompt 4 §87).

---

## 17. CHECKPOINT — o que preciso de você antes de implementar

O Prompt 4 §7 manda **parar** depois da auditoria e do plano, e o §84 manda parar e documentar em decisões de arquitetura, segurança, banco ou produto. Nada do plano é destrutivo; a parada é por decisão, não por risco de dano.

**Autorizações e decisões, em ordem de necessidade:**

1. **Posso commitar o trabalho pendente** em commits pequenos (env/robots, testes, CI/hook, docs)? E você quer criar um _remote_ agora?
2. **Aprova a pilha** dos ADRs 002 e 005: Drizzle 0.45.x + PostgreSQL, Better Auth com sessões em banco, Tiptap 3 em JSON, Resend? (Sem isso não começo a Fase 1b.)
3. **Aprova as decisões de produto** D1 (sem `/servicos`, menu com "Soluções"), D3 (3 campos obrigatórios), D4 (publicar só com conteúdo real) e D5 (autor = especialista)? (Necessárias antes da Fase 3.)
4. **Confirma manter `modules/` e `src/server/db`** (ADR-013), em vez de renomear para `features/` e `src/db`?
5. **Pode esperar até a Fase 4:** T-01/T-02 (deploy e Postgres gerenciado), T-03 (storage), T-04 (quem vê leads), T-05 (2FA obrigatório).
6. **Pode esperar até a Fase 7:** T-06/T-07 (jurídico, retenção, atribuição) e T-11 (domínio de e-mail).

**O que dá para começar já, sem esperar as decisões 5 e 6:** passos 0, 1, 2 e 3 (commit, Drizzle + roles, Better Auth esqueleto e o Design System).

**Sugestão de sequência:** responda 1 a 4; eu executo os passos 0 a 3, com relatório por fase, e paro de novo antes do passo 4.
