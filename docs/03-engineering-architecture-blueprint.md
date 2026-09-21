# DM Empresarial — Engineering Architecture Blueprint

Versão 1 · 21/09/2026 · Etapa: Prompt 3. **Sem código de produto, sem migrations, sem instalação de dependências.** Depende de [01-product-ux-blueprint.md](./01-product-ux-blueprint.md) e [02-design-system-blueprint.md](./02-design-system-blueprint.md). O estado real do repositório está em [04-project-audit-and-plan.md](./04-project-audit-and-plan.md).

**Legenda**

- **[VERIFICADO]** conferido neste trabalho (documentação embutida no Next 16.3.5 instalado, `npm view`, documentação oficial via Context7, ou execução no repositório).
- **[EXISTENTE]** já implementado na Fase 1 e mantido.
- **[PROPOSTA]** decisão deste documento, a validar.
- **[ABERTA]** depende de escolha da DM ou de informação que não existe.
- Prioridade (Prompt 3, §89): **CRÍTICA** (bloqueia a implementação) · **IMPORTANTE** · **RECOMENDADA** · **FUTURA**.

**Decisões aprovadas em 21/09/2026 (checkpoint do Prompt 4):** pilha Drizzle + PostgreSQL, Better Auth, Tiptap e Resend (ADR-002, 004, 005); decisões de produto D1 (sem `/servicos`), D3 (3 campos obrigatórios), D4 (publicar só com conteúdo real) e D5 (autor = especialista) (ADR-003); estrutura `features/` e `src/db` (ADR-013). Demais ADRs continuam como proposta.

**Numeração das seções = as 45 partes exigidas pelo Prompt 3 (§90).** Comentários do código já citam essas partes (por exemplo "§5 e §38" em `eslint.config.mjs`, "§28" em `errors.ts`, "§29" no logger). Elas correspondem às partes 5 Application Architecture, 38 Project Structure, 28 Error Handling e 29 Logging deste documento.

---

## 1. Executive Summary

**O que é:** uma plataforma de autoridade (institucional + soluções + especialistas + blog + leads), com CMS próprio, construída como um **monólito modular** em Next.js 16, PostgreSQL e Drizzle. Sem microserviços, sem backend separado, sem fila distribuída, sem serviço de busca externo.

**Escolhas centrais (todas com alternativa e trade-off nas seções seguintes):**

| Área         | Escolha                                                                                 | Situação                                    |
| ------------ | --------------------------------------------------------------------------------------- | ------------------------------------------- |
| Aplicação    | Next.js 16 (App Router), React 19, TypeScript estrito                                   | [EXISTENTE]                                 |
| Banco        | PostgreSQL 17 + Drizzle ORM 0.45.x (não a 1.0, ainda em RC)                             | [PROPOSTA]                                  |
| Autenticação | Better Auth (sessões em banco, e-mail + senha, cadastro fechado, 2FA para admin)        | [PROPOSTA]                                  |
| Autorização  | 3 papéis (ADMIN, EDITOR, AUTHOR) + regra de propriedade, negada por padrão, no servidor | [PROPOSTA]                                  |
| Editor       | Tiptap 3 guardando **JSON**, nunca HTML; renderização por allowlist                     | [PROPOSTA]                                  |
| Cache        | Cache Components (`use cache` + `cacheTag`), invalidação por tag na publicação          | [PROPOSTA]                                  |
| CSP          | Duas camadas: páginas públicas estáticas sem nonce; `/admin` com nonce                  | [PROPOSTA] (é o "ADR-009" citado no código) |
| Deploy       | Vercel + Postgres gerenciado + storage S3-compatível + Resend; portável por interfaces  | [ABERTA] (recomendação: seção 34)           |

**O que este blueprint muda em relação aos anteriores** (detalhes na seção 43 e no Project Audit):

1. `/servicos` deixa de ser árvore própria (Blueprint 1, D1). A entidade `solutions` tem `type`.
2. Não existe tabela `authors`: autor é `specialists` (Blueprint 1, D5).
3. Sem `page_sections` genérico: páginas institucionais usam **templates em código + dados validados por schema** (não é um page builder).
4. Sem `lead_events` no MVP: `audit_logs` + `status` do lead bastam.
5. Sem shadcn/ui: o Design System (raio 0/4 px, filete em vez de caixa) não combina com ele, e o único diálogo é o menu mobile (`<dialog>` nativo).

**Tamanho do MVP:** cerca de 20 tabelas de domínio e plataforma (mais 4 da biblioteca de autenticação), 3 papéis, 5 estados editoriais só para artigos, 1 job agendado.

---

## 2. Architectural Principles

1. **Monólito modular.** Fronteiras por domínio dentro de um só deploy. Dividir só com dor medida.
2. **Servidor é a única autoridade.** Nada do cliente é confiável: IDs, campos ocultos, cookies isolados, cabeçalhos.
3. **Negado por padrão.** Toda operação parte de "proibido" e libera o necessário.
4. **Regra de negócio fora da UI.** Publicar, cadastrar lead, assinar newsletter existem como serviços; a UI só os chama.
5. **Relacional onde há relação.** JSON só para conteúdo flexível de verdade (corpo de texto, dados de template).
6. **Dado real ou nada.** Nenhuma seed, fixture ou copy apresenta dado inventado como fato da DM.
7. **Mínimo dado, mínimo retenção.** Coleta só o necessário para a finalidade, com prazo.
8. **Estático por padrão, dinâmico por exceção.** O site público é cacheado e invalidado por tag; o admin é dinâmico.
9. **Menor mudança que resolve.** Preservar o que existe e funciona; abstração só com problema real.
10. **Falhar fechado.** Ambiente desconhecido → não indexar; erro de autorização → recusar; validação falhou → não gravar.
11. **Tudo reprodutível.** Banco por migrations, ambiente por variáveis, deploy por pipeline.
12. **A arquitetura desaparece atrás da experiência.** O visitante vê clareza e velocidade, não infraestrutura.

**Ordem de prioridade em conflitos (Prompt 4, §86):** segurança → integridade dos dados → corretude → UX → acessibilidade → performance → SEO → manutenibilidade → estética → conveniência.

---

## 3. Recommended Stack

**Versões consultadas no registro npm em 21/09/2026 [VERIFICADO].** Instalação usa versão exata (`.npmrc` já tem `save-exact=true`).

| Camada           | Escolha                                                         | Versão verificada       | Situação                 | Observação                                                                                  |
| ---------------- | --------------------------------------------------------------- | ----------------------- | ------------------------ | ------------------------------------------------------------------------------------------- |
| Framework        | Next.js                                                         | 16.3.5                  | [EXISTENTE]              | Docs completas em `node_modules/next/dist/docs`                                             |
| UI               | React                                                           | 19.3.0                  | [EXISTENTE]              |                                                                                             |
| Linguagem        | TypeScript                                                      | 6.0.3                   | [EXISTENTE]              | 7.x não usada por incompatibilidade com o typescript-eslint (decisão documentada no README) |
| Estilo           | Tailwind CSS                                                    | 4.3.3                   | [EXISTENTE]              | Tokens do Design System via CSS variables                                                   |
| Validação        | Zod                                                             | 4.6.5                   | [EXISTENTE]              | Schemas compartilhados entre formulário, action e banco                                     |
| Driver           | pg                                                              | 8.23.0                  | [EXISTENTE]              | Hoje só usado pelo script `db:check`                                                        |
| ORM + migrations | drizzle-orm / drizzle-kit                                       | 0.45.3 / 0.31.11        | [PROPOSTA]               | `latest` do npm é a 0.45.x; a 1.0 está em RC. Better Auth aceita `^0.45.2`                  |
| Autenticação     | better-auth + @better-auth/drizzle-adapter                      | 1.7.5 / 1.7.5           | [PROPOSTA]               | Peer `next ^16`, `drizzle-orm ^0.45.2`; sem autenticação caseira                            |
| Editor rich text | @tiptap/react, starter-kit, pm, extension-link, static-renderer | 3.31.3                  | [PROPOSTA]               | Editor só no bundle do admin; site público renderiza sem editor                             |
| E-mail           | resend                                                          | 6.28.1                  | [PROPOSTA]               | Só no servidor                                                                              |
| Upload / imagem  | file-type, sharp                                                | 22.1.1 / 0.35.4         | [PROPOSTA]               | Verificação por conteúdo (magic bytes) e reprocessamento de imagem                          |
| Testes           | vitest / @playwright/test / @axe-core/playwright                | 5.0.1 / 1.63.0 / 4.13.0 | [EXISTENTE] / [PROPOSTA] | E2E e acessibilidade automática                                                             |

**Avaliados e não adotados (com motivo):**

| Candidato                | Motivo                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------- |
| Lucia                    | **Descontinuada** (deprecação no registro npm, última publicação 06/2025) [VERIFICADO]              |
| next-auth / Auth.js      | Linha estável no npm é a 4.x (legado); o caminho novo é menos maduro que Better Auth para este caso |
| Prisma                   | Bom, mas mais pesado que o necessário e sem ganho aqui; ESLint do repositório já antecipa Drizzle   |
| shadcn/ui                | O Design System proíbe caixas/sombras/raio grande; o custo de reescrever estilos supera o ganho     |
| Upstash Ratelimit        | Serviço extra; rate limit em Postgres resolve no volume atual (seção 13). Reavaliar se houver Redis |
| pg-boss / filas          | Só há um job periódico; cron + rota protegida basta (seção 16)                                      |
| Elasticsearch/OpenSearch | Busca por Postgres FTS é suficiente por ordens de grandeza de volume (seção 19)                     |
| Firebase, MongoDB        | Vedados pelo Prompt 3 §84                                                                           |

**Regra:** cada dependência nova responde a "que problema real resolve?" (Prompt 4, §10) e é verificada com `npm view` + `npm audit` antes de entrar.

---

## 4. System Architecture

```text
                        ┌──────────── Visitante / Editor ────────────┐
                        └───────────────┬────────────────────────────┘
                                        │ HTTPS
                          ┌─────────────▼─────────────┐
                          │  CDN / borda do provedor   │  cache do HTML estático e de /_next/static
                          └─────────────┬─────────────┘
                                        │
                 ┌──────────────────────▼───────────────────────┐
                 │              Aplicação Next.js               │
                 │  Proxy ─ só redireciona/coloca cabeçalhos    │
                 │  ┌──────────────┐  ┌──────────────┐          │
                 │  │ Público (RSC)│  │ /admin (RSC) │          │
                 │  │ cacheado     │  │ dinâmico     │          │
                 │  └──────┬───────┘  └──────┬───────┘          │
                 │         │  Server Actions / Route Handlers    │
                 │  ┌──────▼──────────────────▼───────┐         │
                 │  │  Application (serviços, DAL)     │         │
                 │  │  Domain (regras puras)           │         │
                 │  └──┬──────┬───────┬────────┬──────┘         │
                 └─────┼──────┼───────┼────────┼─────────────────┘
                       │      │       │        │
               ┌───────▼─┐ ┌──▼────┐ ┌▼──────┐ ┌▼────────────┐
               │Postgres │ │Storage│ │E-mail │ │Logs/erros   │
               │(Drizzle)│ │ (S3)  │ │Resend │ │Observabilid.│
               └─────────┘ └───────┘ └───────┘ └─────────────┘
```

**Fronteiras de confiança:** (1) internet → aplicação (toda entrada é hostil); (2) aplicação → banco (usuário de banco **sem** privilégio de DDL); (3) aplicação → storage/e-mail (credenciais só no servidor); (4) público → admin (autenticação + autorização a cada operação).

**Processos:** um só deploy. Jobs periódicos são rotas protegidas chamadas pelo agendador da plataforma. Sem workers permanentes.

---

## 5. Application Architecture

```text
UI (src/app, src/components)
   ↓ chama
Application (src/features/*/application  +  src/server/*)   ← serviços, DAL, autorização, transações
   ↓ usa
Domain (src/features/*/domain, src/lib)                      ← regras puras, sem framework, sem I/O
   ↑ implementado por
Infrastructure (src/features/*/infrastructure, src/db, src/server/storage|email)  ← Drizzle, S3, Resend
```

**Regras de dependência (impostas por ESLint, ampliando as já existentes) [EXISTENTE] + [PROPOSTA]:**

| De                               | Pode importar                                                               | Não pode importar                                                     |
| -------------------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `components/**`                  | `lib`, outros `components`                                                  | `server/**`, `modules/**`, `pg`, `drizzle-orm` [EXISTENTE]            |
| `lib/**`, `features/*/domain/**` | `lib`                                                                       | `next`, `react`, `pg`, `drizzle-orm`, `server/**` [EXISTENTE]         |
| `app/**` (páginas/actions)       | `components`, `features/*/application`, `server/auth`, `server/permissions` | `features/*/infrastructure`, `db`, `drizzle-orm`, `pg` [PROPOSTA]     |
| `features/*/application/**`      | `domain`, `infrastructure` do **próprio** módulo, `server/*`                | infraestrutura de outro módulo (usar o `application` dele) [PROPOSTA] |
| `features/*/infrastructure/**`   | `domain`, `db`                                                              | `app/**`, `components/**`                                             |

**Consequência:** `React Component → SQL` é impossível por construção; `Database → UI` sem camada intermediária também.

**DECISÃO — DAL do Next como camada de aplicação.** O guia oficial de segurança de dados do Next 16 recomenda, para projetos novos, uma _Data Access Layer_ que roda só no servidor, verifica autorização e devolve DTOs mínimos [VERIFICADO em `guides/data-security`]. Cada módulo expõe funções em `application/` marcadas com `server-only`.

- **Motivo:** centraliza autorização e evita que um Server Component passe um objeto inteiro (com campos privados) a um Client Component.
- **Alternativas:** consultas soltas em cada página (rejeitado: autorização se espalha); API HTTP interna (rejeitado: um salto de rede sem ganho, e a própria doc do Next manda não chamar Route Handler de Server Component).
- **Trade-off:** um pouco mais de arquivos; em troca, um único ponto de revisão de segurança por módulo.
- **Regra:** funções públicas do `application/` devolvem **DTOs** (tipos próprios), nunca linhas cruas do banco.

**DECISÃO — Repositórios: um arquivo por módulo, sem abstração genérica (Prompt 3 §60).**

- **Motivo:** o problema real é "SQL só num lugar". Um `repository.ts` por módulo com funções nomeadas pela intenção (`findPublishedBySlug`, `listForAdmin`) resolve isso.
- **Alternativas:** repositório genérico com CRUD abstrato (rejeitado: enterprise sem ganho); Drizzle direto nos serviços (rejeitado: mistura orquestração e consulta).
- **Regra:** só `infrastructure/` importa `drizzle-orm` e o client de banco.

---

## 6. Domain Model

**Módulos (bounded contexts)** sob `src/features/`:

| Módulo       | Responsabilidade                            | Entidades principais             |
| ------------ | ------------------------------------------- | -------------------------------- |
| `content`    | Artigos e taxonomia                         | Post, Category, Tag              |
| `catalog`    | Soluções (consultorias e serviços)          | Solution, SolutionItem           |
| `people`     | Especialistas e autores                     | Specialist                       |
| `pages`      | Páginas institucionais                      | Page                             |
| `media`      | Arquivos e metadados                        | Media                            |
| `conversion` | Leads e newsletter                          | Lead, NewsletterSubscriber       |
| `identity`   | Usuários e papéis do CMS                    | User, Role (via Better Auth)     |
| `platform`   | Redirecionamentos, configurações, auditoria | Redirect, SiteSettings, AuditLog |

**Invariantes de domínio (viram checagens em código e constraints no banco):**

1. Slug é único por tipo, em minúsculas ASCII com hífen, e **não muda em silêncio depois de publicado** (a mudança cria redirecionamento).
2. `PUBLISHED` exige `published_at`; `SCHEDULED` exige `scheduled_for` futuro; `ARCHIVED` exige `archived_at`.
3. Um artigo tem **uma** categoria primária e **no máximo uma** solução primária.
4. Publicar exige o conjunto mínimo do Blueprint 1 (seções 08, 11, 13): título, autor, categoria, corpo, alt text da capa quando houver capa.
5. Nenhum conteúdo `DRAFT`/`REVIEW`/`SCHEDULED`/`ARCHIVED` é visível ao público.
6. Um lead sempre guarda consentimento e a versão do texto aceito.
7. Um usuário `AUTHOR` só altera artigos que ele criou e que estejam em `DRAFT`.

### DECISÃO — `solutions` como entidade única, com itens filhos (resolve Prompt 3 §8)

- **O que:** uma tabela `solutions` com `type` (`CONSULTORIA` | `SERVICO`) e campos comuns; listas ordenadas (situações, etapas, objetivos) em uma tabela filha `solution_items` com `kind`.
- **Motivo:** consultoria e serviço compartilham o mesmo raciocínio de página (Blueprint 1, seção 08). A diferença é de escopo, e é capturada por `type` e pelo critério editorial ("tem escopo fechado e entrega definida?"), não por campos diferentes.
- **Análise dos campos do esquema sugerido no Prompt 3:**

| Campo sugerido   | Destino                                                                                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `problem`        | `context` (rich text) + itens `SITUATION` (lista de situações atendidas)                                                                    |
| `approach`       | `approach` (rich text)                                                                                                                      |
| `implementation` | itens `STEP` (etapas numeradas, sequência real)                                                                                             |
| `result`         | **removido**: o Blueprint 1 proíbe prometer resultado. Vira itens `GOAL` (objetivos), e um campo opcional só se existir dado real com fonte |
| `featured`       | `is_featured` boolean                                                                                                                       |
| `metadata`       | descartado (JSON genérico sem propósito). Campos reais no lugar                                                                             |

- **Alternativas:** duas tabelas (`consultorias`, `servicos`) — rejeitada por duplicar código e URL; herança/tabela por tipo — rejeitada, não há campos exclusivos hoje; JSON para as listas — rejeitada, são consultáveis e ordenáveis.
- **Trade-off:** a tabela filha `solution_items` é genérica, mas restrita a três `kind`; não vira page builder.
- **Regra:** se surgir um campo que só faça sentido para um tipo, adicionar como coluna anulável com `CHECK` por tipo **antes** de considerar dividir a tabela. **Prioridade: IMPORTANTE.**

---

## 7. Database Model

**Convenções:**

- IDs: `uuid` (`gen_random_uuid()`) nas tabelas de domínio; as 4 tabelas da biblioteca de autenticação seguem o esquema dela (IDs `text`). URLs públicas usam **slug**, nunca ID.
- Todo registro: `created_at`, `updated_at` (`timestamptz`, UTC). Entidades editáveis: `version int` (bloqueio otimista, seção 16), `created_by`, `updated_by`.
- Enums do Postgres para estados fechados; `CHECK` para regras de coerência; `citext` ou índice em `lower(email)` para e-mails.
- Extensões previstas: `citext`, `unaccent` (busca sem acento). **Verificar disponibilidade no provedor escolhido.**
- Papéis de banco: `dm_owner` (DDL/migrations, já existe) e **`dm_app`** (runtime, só DML; sem `UPDATE`/`DELETE` em `audit_logs`) [PROPOSTA].

### 7.1 Tabelas do MVP

| Tabela                                                               | Finalidade                                | Colunas essenciais (além das convenções)                                                                                                                                                                                                                                                                         |
| -------------------------------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `users`, `sessions`, `accounts`, `verifications`, `auth_rate_limits` | Autenticação (Better Auth) [IMPLEMENTADO] | Plural porque `user` é palavra reservada. `users`: id, name, email (citext, único), email_verified, image, **`role`** (enum ADMIN/EDITOR/AUTHOR), **`disabled_at`**. `accounts.password` guarda o hash scrypt. `auth_rate_limits` é só do login; o limitador dos formulários terá tabela própria (`rate_limits`) |
| `specialists`                                                        | Especialistas **e** autores               | `slug` único, `name`, `role_title`, `summary`, `bio` (jsonb rich), `photo_media_id`, `kind` (TEAM/GUEST), `user_id` (opcional, único), `status` (DRAFT/PUBLISHED/ARCHIVED), `published_at`, campos SEO                                                                                                           |
| `specialist_solutions`                                               | Quem atua em quê                          | `specialist_id`, `solution_id`, `position`; PK composta                                                                                                                                                                                                                                                          |
| `specialist_categories`                                              | Áreas de atuação                          | `specialist_id`, `category_id`; PK composta                                                                                                                                                                                                                                                                      |
| `solutions`                                                          | Consultorias e serviços                   | `type`, `slug` único, `title`, `summary`, `context` (jsonb), `approach` (jsonb), `is_featured`, `position`, `status`, `published_at`, campos SEO                                                                                                                                                                 |
| `solution_items`                                                     | Situações, etapas e objetivos             | `solution_id`, `kind` (SITUATION/STEP/GOAL), `position`, `title`, `body` (text curto); único (`solution_id`, `kind`, `position`)                                                                                                                                                                                 |
| `posts`                                                              | Artigos                                   | `slug` único, `title`, `subtitle`, `excerpt`, `body` (jsonb Tiptap), `format` (enum editorial), `cover_media_id`, `author_id` → `specialists`, `status` (5 estados), `published_at`, `scheduled_for`, `archived_at`, `reading_minutes`, `search_vector` (tsvector gerado), campos SEO                            |
| `categories`                                                         | Temas editoriais                          | `slug` único, `name`, `description`, `position`                                                                                                                                                                                                                                                                  |
| `post_categories`                                                    | N:M artigo–categoria                      | `post_id`, `category_id`, `is_primary`; índice único parcial: uma primária por artigo                                                                                                                                                                                                                            |
| `tags`, `post_tags`                                                  | Marcação livre                            | `slug` único, `name`; N:M                                                                                                                                                                                                                                                                                        |
| `post_solutions`                                                     | N:M artigo–solução                        | `post_id`, `solution_id`, `is_primary`; índice único parcial: uma primária por artigo                                                                                                                                                                                                                            |
| `pages`                                                              | Páginas institucionais                    | `key` único (`about`, `contact`, `privacy`, `terms`…), `template` (enum), `title`, `data` (jsonb, validado por schema Zod do template), `status`, `published_at`, campos SEO                                                                                                                                     |
| `media`                                                              | Metadados de arquivos                     | `storage_key` único, `kind`, `mime`, `bytes`, `width`, `height`, `sha256`, `alt_text`, `caption`, `focal_x`, `focal_y`, `status` (PENDING/READY), `uploaded_by`                                                                                                                                                  |
| `leads`                                                              | Contatos comerciais                       | `name`, `email`, `message`, `phone`, `company`, `job_title`, `segment`, `website`, `interest_solution_id`, `origin_post_id`, `source`, `medium`, `campaign`, `utm_content`, `utm_term`, `landing_path`, `referrer_host`, `consent_at`, `consent_version`, `status`, `ip_hash`, `notified_at`, `assigned_to`      |
| `newsletter_subscribers`                                             | Assinaturas                               | `email` único (citext), `name`, `status` (PENDING/ACTIVE/UNSUBSCRIBED/BOUNCED), `consent_at`, `consent_version`, `confirm_token_hash`, `confirm_expires_at`, `confirmed_at`, `unsubscribed_at`, `source`                                                                                                         |
| `redirects`                                                          | Slugs antigos → novos                     | `from_path` único, `to_path`, `status_code` (301), `origin` (AUTO/MANUAL)                                                                                                                                                                                                                                        |
| `site_settings`                                                      | Dados reais da DM (linha única)           | `address`, `phone`, `email`, `whatsapp`, `social` (jsonb), `legal_name`, `cnpj`… **todos anuláveis até a DM fornecer**; campo nulo → some da tela e do JSON-LD                                                                                                                                                   |
| `rate_limits`                                                        | Contadores de janela fixa                 | `key`, `window_start`, `count`; PK (`key`, `window_start`); limpeza periódica                                                                                                                                                                                                                                    |
| `audit_logs`                                                         | Trilha administrativa (append-only)       | `at`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb mínimo), `request_id`                                                                                                                                                                                                             |

### 7.1.1 Estado da implementação (Fase 3, 21/09/2026)

Implementadas **23 tabelas** (5 de autenticação e 18 de domínio e plataforma), 5 migrations (`drizzle/0000` a `0004`) e 12 enums. Diferenças em relação à tabela acima, todas deliberadas:

- **`rate_limits` (formulários públicos) adiada para a Fase 7**, quando o limitador existe; criar agora seria uma tabela sem uso. O limite do login usa `auth_rate_limits`, da biblioteca.
- **Sem `is_demo`** e **sem seed fictício**: o seed carrega só dados confirmados (as 7 categorias e o endereço). Fixtures `[DEMO]` para desenvolvimento entram na fase de páginas públicas, quando houver quem as use.
- **`posts`** ganhou `first_published_at` (a primeira publicação nunca se perde; um artigo que já foi público só arquiva) e `body_text` (texto plano derivado, alimenta busca e tempo de leitura).
- **`site_settings`** nasce com o endereço confirmado; telefone, e-mail e redes seguem nulos.
- **Busca:** a função `public.f_unaccent` (migration 0002) permite coluna gerada e índice GIN sem acento.
- **`audit_logs` só-inserção:** o role `dm_app` só tem INSERT e SELECT; a migration 0004 e o `db:bootstrap` mantêm essa regra.
- **Regras no banco, não só no código:** `CHECK` de formato de slug, de coerência estado × datas, de tamanho de texto, de tipo de imagem, de e-mail, de redirecionamento (só caminho interno, sem laço), de convidado nunca publicado; índices únicos parciais (uma categoria e uma solução primárias por artigo); `RESTRICT` em categoria/autor em uso.

### 7.2 Constraints e índices essenciais

- **Coerência de estado (CHECK):** `status='PUBLISHED' → published_at IS NOT NULL`; `status='SCHEDULED' → scheduled_for IS NOT NULL`; `status='ARCHIVED' → archived_at IS NOT NULL`.
- **Slug (CHECK):** `slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'` e tamanho máximo.
- **Listagem pública:** índice parcial em `posts (published_at DESC) WHERE status = 'PUBLISHED'`; idem para `solutions` e `specialists`.
- **Busca:** índice `GIN` em `posts.search_vector`.
- **Relacionamentos:** índice em toda FK usada em junção.
- **Chaves estrangeiras:** `ON DELETE RESTRICT` para conteúdo (não apagar categoria/solução em uso); `CASCADE` só em tabelas de junção; `SET NULL` para referências a mídia opcionais.
- **Leads/assinaturas:** e-mail normalizado (minúsculas, sem espaços) antes de gravar.

### 7.3 Regras de exclusão (Prompt 3 §37)

| Entidade              | Regra                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------- |
| Artigo                | **Arquivar**, não apagar. Exclusão definitiva só para rascunho **nunca publicado**, só por ADMIN, com auditoria |
| Solução, especialista | Arquivar. Exclusão bloqueada se houver artigos/relacionamentos                                                  |
| Categoria, tag        | Bloqueada se em uso; ADMIN/EDITOR pode mesclar (mover artigos e apagar a vazia)                                 |
| Página                | Arquivar (as legais ficam sempre publicadas: proibido arquivar `privacy`/`terms` sem substituto)                |
| Mídia                 | Bloqueada se referenciada; órfãs são removidas por job (seção 21)                                               |
| Lead                  | Exclusão/anonimização por ADMIN a pedido do titular (LGPD), com auditoria; sem exclusão em massa                |
| Assinante             | Descadastro mantém o registro com `UNSUBSCRIBED` (prova da opção); apagar só sob pedido de eliminação           |
| Usuário CMS           | Desativar (`disabled_at`), nunca apagar (preserva a autoria e a auditoria)                                      |

---

## 8. Entity Relationship Overview

```text
user ──0..1── specialists ──1..N── posts ──N..M── categories   (post_categories, uma primária)
                  │  │                │  └──N..M── tags        (post_tags)
                  │  │                └─────N..M── solutions   (post_solutions, uma primária)
                  │  └──N..M── solutions   (specialist_solutions)
                  └─────N..M── categories  (specialist_categories: áreas de atuação)

solutions ──1..N── solution_items (SITUATION | STEP | GOAL)

posts/specialists/solutions ──0..1── media (capa, foto)
leads ──0..1── solutions (interesse)   leads ──0..1── posts (artigo de origem)
pages   redirects   site_settings   rate_limits   audit_logs   (independentes)
newsletter_subscribers (independente)
```

| Relação                      | Cardinalidade   | Observação                                                 |
| ---------------------------- | --------------- | ---------------------------------------------------------- |
| Artigo → Autor (specialists) | N:1 obrigatória | Convidado usa `kind = GUEST`, sem página pública           |
| Artigo ↔ Categoria           | N:M             | Exatamente uma marcada `is_primary`                        |
| Artigo ↔ Solução             | N:M             | No máximo uma primária; define o CTA contextual            |
| Solução ↔ Especialista       | N:M             | Alimenta "especialistas relacionados"                      |
| Lead → Solução / Artigo      | N:1 opcionais   | Origem verificada no servidor (deve existir e ser pública) |

---

## 9. CMS Architecture

**Quatro eixos separados (Prompt 3 §11):**

| Eixo         | O que é                    | Onde vive                                           |
| ------------ | -------------------------- | --------------------------------------------------- |
| Conteúdo     | O que é escrito            | `body`, `title`, `summary`… (dados)                 |
| Apresentação | Como aparece               | **Código** (templates e Design System), não o banco |
| SEO          | Como o buscador interpreta | Colunas `seo_*` + fallbacks automáticos (seção 20)  |
| Publicação   | Quando e se é público      | `status`, `published_at`, `scheduled_for`           |

O editor escolhe **conteúdo, SEO e publicação**. A apresentação é fixa, para garantir o Design System.

### DECISÃO — Editor Tiptap guardando JSON e renderizando por allowlist

- **O que:** o corpo é um documento ProseMirror em JSON (`jsonb`). **Nunca se guarda HTML do editor.** O site público renderiza o JSON com o renderizador estático do Tiptap (funciona sem instanciar editor) [VERIFICADO na doc], produzindo elementos React, sem `dangerouslySetInnerHTML`.
- **Motivo:** o risco de XSS armazenado desaparece na origem: o JSON só pode conter os nós e marcas da allowlist, e o renderizador só sabe desenhar esses.
- **Allowlist do MVP:** parágrafo, títulos H2–H4 (H1 é reservado ao título da página, Blueprint 2 §20), listas, citação, negrito, itálico, link, imagem (**só por ID de `media`**), bloco "Aplicação na empresa", linha divisória.
- **Links:** protocolos permitidos `http`, `https`, `mailto`, `tel`; nunca `javascript:` nem `data:`; links externos com `rel="noopener noreferrer"`.
- **Sem embeds no MVP.** Se houver vídeo depois: allowlist de domínios, modo de privacidade e carregamento sob demanda.
- **Validação no servidor:** o JSON recebido é validado contra o mesmo schema (nós, marcas, atributos, tamanho máximo); o que não estiver na allowlist é **rejeitado**, não "limpo em silêncio".
- **Alternativas:** HTML sanitizado (rejeitado: superfície de ataque maior, mais difícil de auditar); Markdown/MDX (rejeitado: editor menos amigável); editor de blocos genérico (rejeitado: page builder).
- **Trade-off:** o editor dá menos liberdade que um WYSIWYG aberto. É exatamente a intenção: qualidade e segurança acima de flexibilidade.
- **Regra:** o pacote do editor só entra em rotas `/admin`; nenhuma página pública importa `@tiptap/react`. **Prioridade: CRÍTICA.**

### DECISÃO — Páginas institucionais: templates em código + dados validados (Prompt 3 §12)

- **O que:** `pages` guarda `key`, `template` e `data` (jsonb). Cada `template` tem um **schema Zod** (por exemplo, o do Sobre define hero, "como pensamos", "como trabalhamos", valores). A Home e o Contato são templates em código cujo texto editável vem de `pages.data`; as páginas legais usam um template de texto simples (rich).
- **Motivo:** o Blueprint 1 pede que a DM altere textos sem alterar layout, e proíbe conteúdo inventado.
- **Alternativas:** `page_sections` genérico ordenável (rejeitado: page builder); tudo em código (rejeitado: qualquer ajuste de texto exigiria deploy).
- **Regra:** blocos ausentes em `data` **não renderizam** ("dado ausente = seção ausente", Blueprint 1). **Prioridade: IMPORTANTE.**

### Status editorial (Prompt 3 §10)

**Artigos usam 5 estados; soluções, especialistas e páginas usam 3** (`DRAFT`, `PUBLISHED`, `ARCHIVED`), porque não têm fluxo de revisão nem agendamento no MVP.

| Estado      | Significado                                | Visível ao público                           |
| ----------- | ------------------------------------------ | -------------------------------------------- |
| `DRAFT`     | Em escrita                                 | Não                                          |
| `REVIEW`    | Enviado para revisão; autor não edita mais | Não                                          |
| `SCHEDULED` | Aprovado, com data futura                  | Não (ainda)                                  |
| `PUBLISHED` | Público                                    | **Sim**                                      |
| `ARCHIVED`  | Retirado                                   | Não (404, ou 301 se houver redirecionamento) |

| Transição                  | Quem                         | Condição                                                   |
| -------------------------- | ---------------------------- | ---------------------------------------------------------- |
| `DRAFT → REVIEW`           | AUTHOR (dono), EDITOR, ADMIN | Campos mínimos preenchidos                                 |
| `REVIEW → DRAFT`           | EDITOR, ADMIN                | Devolver com comentário                                    |
| `DRAFT/REVIEW → PUBLISHED` | **EDITOR, ADMIN**            | Regras de publicação válidas; transação atômica (seção 16) |
| `DRAFT/REVIEW → SCHEDULED` | EDITOR, ADMIN                | `scheduled_for` no futuro; regras de publicação válidas    |
| `SCHEDULED → PUBLISHED`    | **Job agendado**             | `scheduled_for ≤ agora`; idempotente                       |
| `SCHEDULED → DRAFT`        | EDITOR, ADMIN                | Cancelar agendamento                                       |
| `PUBLISHED → ARCHIVED`     | EDITOR, ADMIN                | Pergunta se cria redirecionamento; remove do sitemap       |
| `ARCHIVED → DRAFT`         | EDITOR, ADMIN                | Restaurar                                                  |

Qualquer outra transição é **recusada pelo servidor**. `DRAFT` não vira `PUBLISHED` por acidente: só existe um caminho (`publishPost`), com permissão, validação e auditoria.

**Preview (Prompt 3 §67):** usa **Draft Mode** do Next (cookie `__prerender_bypass`, que ignora todas as camadas de cache [VERIFICADO na doc]). A ativação é uma rota que exige **sessão autenticada e autorizada** (não segredo compartilhado na URL), a resposta leva `noindex` e `Cache-Control: private, no-store`, e o conteúdo em preview nunca entra em sitemap, busca ou JSON-LD.

**Classificação do CMS (Prompt 3 §66):**

| Recurso                                                             | Fase               |
| ------------------------------------------------------------------- | ------------------ |
| CRUD de artigos, taxonomia, especialistas, soluções, páginas, mídia | **MVP**            |
| Rascunho, revisão, publicar, agendar, arquivar                      | **MVP**            |
| Bloqueio otimista contra edição simultânea                          | **MVP**            |
| Preview                                                             | **MVP**            |
| Controle de slug + redirecionamento automático                      | **MVP**            |
| Campos SEO com fallback e prévia simples                            | **MVP**            |
| Autosave                                                            | Segunda fase       |
| Histórico de revisões (`post_revisions`)                            | Segunda fase       |
| Comentários de revisão                                              | Segunda fase       |
| Colaboração em tempo real                                           | **Fora de escopo** |

---

## 10. Authentication

**Área pública:** sem autenticação. **Área administrativa:** autenticada, cadastro **fechado** (usuários criados por ADMIN).

### DECISÃO — Better Auth com sessões em banco

- **O que:** e-mail + senha para usuários do CMS; sessão em cookie `HttpOnly`, `Secure`, `SameSite=Lax`, com registro da sessão no Postgres (revogável); cadastro público **desligado**; 2FA por TOTP.
- **Motivo:** o Prompt 3 proíbe autenticação caseira. Better Auth 1.7.5 declara suporte a `next ^16` e `drizzle-orm ^0.45.2` e tem adaptador Drizzle próprio [VERIFICADO]. A documentação oficial cobre limitação de taxa, plugin `nextCookies` (para Server Actions) e checagem de cookie no Proxy.
- **Alternativas:** Auth.js/next-auth (linha estável é a v4, legado); Lucia (descontinuada); sessão JWT sem estado (rejeitada: não permite revogar imediatamente; risco alto em CMS com dados pessoais); serviço hospedado (rejeitado: custo e dependência sem necessidade).
- **Trade-off:** dependência de um projeto jovem e de ritmo rápido de releases (1.7.x). **Mitigação:** versão exata, leitura de changelog em cada atualização, e a autorização **não** delegada à biblioteca (seção 11).
- **Regra:** senha, sessão e limitação de taxa do login vêm da biblioteca; **papéis e permissões são nossos**. Nunca ler ou gravar hash de senha fora dela. **Prioridade: CRÍTICA.**

**Confirmado na implementação (21/09/2026, lido no código instalado e coberto por testes de integração):** a opção `emailAndPassword.disableSignUp` existe e está ligada; o hash de senha é **scrypt** (`node:crypto`); o rate limit aceita armazenamento em banco com `consume` atômico (usado no login: 5 falhas / 15 min por IP); `input: false` em campos extras impede o usuário de definir o próprio papel. **Dois achados que não estavam no blueprint:** (1) por padrão a biblioteca **desliga a checagem de origem quando `NODE_ENV=test`**, então `disableOriginCheck` e `disableCSRFCheck` foram fixados como `false` explicitamente; (2) a checagem de origem da biblioteca só age quando a requisição **já traz cookie**, deixando passar um _login CSRF_ (login "frio" vindo de outro site). Por isso a rota `/api/auth` tem uma guarda própria (`server/auth/origin.ts`) que recusa `Origin` diferente da configurada e usa Fetch Metadata quando não há `Origin`.

**Ciclo de vida:**

| Item                       | Proposta                                                                                                                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Criação de usuário         | ADMIN cria e envia convite; nunca senha padrão. O primeiro ADMIN nasce por script único de bootstrap (lê e-mail e senha de variáveis, não grava nada no repositório) |
| Senha                      | Mínimo de 12 caracteres; sem regras artificiais de composição                                                                                                        |
| Sessão                     | Duração e expiração absoluta a definir (sugestão: 7 dias deslizantes, teto de 30)                                                                                    |
| 2FA (TOTP)                 | **Obrigatório para ADMIN e EDITOR antes de existirem leads reais em produção**                                                                                       |
| Recuperação de acesso      | Link único por e-mail, expiração curta, resposta idêntica exista ou não a conta                                                                                      |
| Logout / troca de senha    | Revoga todas as sessões da conta                                                                                                                                     |
| Redirecionamento pós-login | Parâmetro `next` só aceita caminhos internos (evita _open redirect_)                                                                                                 |
| Eventos auditados          | login, falha repetida, logout, troca de senha, ativação/desativação de 2FA                                                                                           |

**Proxy:** o Next 16 chama o antigo middleware de **Proxy** (`proxy.ts`) [VERIFICADO]. Aqui ele só faz redirecionamento otimista por presença de cookie (a própria doc da biblioteca marca isso como "não seguro"); **não é a barreira de autorização** (Prompt 3 §17, Prompt 4 §42).

---

## 11. Authorization

### DECISÃO — RBAC de 3 papéis + propriedade, negado por padrão, no servidor

- **Papéis:** `ADMIN`, `EDITOR`, `AUTHOR` (coluna `user.role`). Sem tabela de permissões nem centenas de _flags_.
- **Modelo:** a função `can(user, action, resource?)` em `src/server/permissions` é o único lugar que responde. Toda operação passa por ela; a resposta padrão é **negar**.
- **Cadeia obrigatória em toda operação administrativa (Prompt 4, §41):**

```text
autenticado? → autorizado para a ação? → recurso acessível a este usuário? → estado atual permite a ação?
```

- **Onde a cadeia roda:** dentro de cada Server Action / Route Handler / função da DAL. A doc de produção do Next é explícita: verificar autenticação e autorização **dentro de cada ação**, sem confiar em Proxy nem em layout [VERIFICADO em `guides/production-checklist`].
- **IDOR/BOLA (Prompt 3 §19):** buscar por ID **sempre junto** com a checagem de propriedade/permissão (`WHERE id = $1` seguido de `can(...)`, ou filtro por dono na própria consulta). Para objetos que o usuário não pode ver, responder **404** (não 403), para não revelar existência.
- **Alternativas:** ABAC completo (rejeitado: excesso); permissões por usuário (rejeitado: custo de gestão); delegar ao plugin de papéis da biblioteca (rejeitado: acopla regra de negócio a terceiros).
- **Regra:** função nova na DAL sem chamada a `can(...)` **não passa em revisão**. **Prioridade: CRÍTICA.**

**Dados públicos × privados (Prompt 3 §64):**

| Público (só se `PUBLISHED`)                                                                                                                             | Privado (nunca exposto por rota pública)                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Artigos, soluções, especialistas, páginas, categorias, tags publicados; `site_settings` só nos campos exibidos; mídia referenciada por conteúdo público | Rascunhos e conteúdos não publicados, leads, assinantes, usuários, sessões, tokens, `audit_logs`, `rate_limits`, IPs, metadados internos |

A separação existe **na aplicação** (DAL pública só consulta `PUBLISHED`) **e no banco** (o role `dm_app` não altera `audit_logs`; consultas públicas usam funções separadas das do admin).

---

## 12. Permission Matrix

| Ação                                  | ADMIN | EDITOR |          AUTHOR          | Justificativa                                                                                                        |
| ------------------------------------- | :---: | :----: | :----------------------: | -------------------------------------------------------------------------------------------------------------------- |
| Criar artigo                          |   ✔   |   ✔    |            ✔             | Autor precisa poder começar                                                                                          |
| Editar artigo                         |   ✔   |   ✔    | só o próprio, em `DRAFT` | Fecha edição de terceiros; travar em `REVIEW` evita mudar o que está em revisão                                      |
| Enviar para revisão                   |   ✔   |   ✔    |       só o próprio       | Fluxo editorial                                                                                                      |
| Publicar / agendar                    |   ✔   |   ✔    |            ✘             | Decisão editorial e de reputação                                                                                     |
| Arquivar / restaurar                  |   ✔   |   ✔    |            ✘             | Retirar conteúdo afeta SEO e links                                                                                   |
| Excluir rascunho nunca publicado      |   ✔   |   ✘    |       só o próprio       | Exclusão definitiva é rara; EDITOR não precisa                                                                       |
| Gerenciar categorias e tags           |   ✔   |   ✔    |            ✘             | Taxonomia afeta a estrutura do site                                                                                  |
| Gerenciar especialistas               |   ✔   |   ✔    |   só o próprio perfil    | Perfil é dado pessoal da pessoa; ela mantém o seu                                                                    |
| Gerenciar soluções                    |   ✔   |   ✔    |            ✘             | Posicionamento comercial                                                                                             |
| Gerenciar páginas institucionais      |   ✔   |   ✔    |            ✘             | Texto oficial da empresa                                                                                             |
| Enviar mídia                          |   ✔   |   ✔    |            ✔             | Necessário para escrever; sujeito às validações de upload                                                            |
| Excluir mídia                         |   ✔   |   ✔    | só a própria, se sem uso | Bloqueada se referenciada                                                                                            |
| Ver leads                             |   ✔   |   ⚠️   |            ✘             | Dado pessoal comercial. **EDITOR só se a DM definir que a equipe editorial atende leads (decisão aberta, seção 43)** |
| Alterar status de lead / atribuir     |   ✔   |   ⚠️   |            ✘             | Idem                                                                                                                 |
| Exportar leads                        |   ✔   |   ✘    |            ✘             | Exportação em massa aumenta o risco de vazamento; registra auditoria                                                 |
| Excluir/anonimizar lead (pedido LGPD) |   ✔   |   ✘    |            ✘             | Ação irreversível                                                                                                    |
| Ver/exportar assinantes               |   ✔   |   ✘    |            ✘             | Dado pessoal                                                                                                         |
| Gerenciar usuários e papéis           |   ✔   |   ✘    |            ✘             | Escalada de privilégio                                                                                               |
| Alterar `site_settings`               |   ✔   |   ✘    |            ✘             | Alimenta rodapé, JSON-LD e contato: dado factual                                                                     |
| Gerenciar redirecionamentos           |   ✔   |   ✔    |            ✘             | Afeta SEO                                                                                                            |
| Ver `audit_logs`                      |   ✔   |   ✘    |            ✘             | Trilha sensível                                                                                                      |

`⚠️` = decisão pendente da DM. Padrão recomendado: **ADMIN apenas**.

---

## 13. Security Architecture

**Camadas de controle:**

| Camada               | Controles                                                                                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Borda / cabeçalhos   | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, proteção contra _framing_ **[4 EXISTENTES]** |
| Entrada              | Validação Zod no servidor, limites de tamanho, rate limit, honeypot                                                        |
| Identidade           | Sessão em banco, 2FA, bloqueio de login por taxa                                                                           |
| Autorização          | `can(...)` em toda operação, propriedade, 404 para objetos invisíveis                                                      |
| Dados                | Role de banco sem DDL, `audit_logs` append-only, minimização, `ip_hash`                                                    |
| Saída                | Renderização por allowlist (sem HTML arbitrário), erros sem detalhes internos [EXISTENTE]                                  |
| Segredos             | Só em variáveis do provedor/`.env.local`; redação no logger [EXISTENTE]                                                    |
| Cadeia de suprimento | Versões exatas, `npm ci`, `npm audit` no CI [EXISTENTE], varredura de segredos e revisão de dependências (a adicionar)     |

### DECISÃO — CSP em duas camadas (ADR-009)

- **O que:**
  - **Camada pública** (páginas estáticas/cacheadas): CSP definida em `next.config.ts` **sem nonce**: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `style-src 'self' 'unsafe-inline'`, `img-src 'self' data: blob:` (+ host do storage), `font-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.
  - **Camada admin** (`/admin`, sempre dinâmica): CSP com **nonce por requisição** e `'strict-dynamic'`, gerada no Proxy, **sem** `unsafe-inline` em scripts.
- **Motivo (verificado na doc do Next 16):** nonce exige renderização dinâmica em **todas** as páginas que o usam, desativa cache estático/ISR, impede CDN e é **incompatível com PPR** (Cache Components) [VERIFICADO em `guides/content-security-policy`]. Aplicar nonce ao site público custaria exatamente o que o Prompt 3 §27 manda evitar ("não torne todo o site dinâmico"). O site público não renderiza HTML de usuário e não tem conteúdo interativo sensível; o admin tem.
- **Exceção documentada:** `'unsafe-inline'` em `script-src` na camada pública, exigida pelos scripts inline do próprio framework. Ela é compensada por: conteúdo sem HTML arbitrário, `object-src 'none'`, `base-uri`, `form-action`, `frame-ancestors`.
- **Alternativa futura:** CSP por hash via SRI, hoje **experimental** no Next (não aceita scripts gerados dinamicamente) [VERIFICADO]. Reavaliar quando estável.
- **Alternativas rejeitadas:** nonce em tudo (custo de cache e PPR); CSP só em modo `report-only` (dispensável como estado final; útil no rollout).
- **Rollout:** publicar primeiro em `Content-Security-Policy-Report-Only` em staging, corrigir violações, só então impor.
- **Regra:** proibido `unsafe-eval` em produção (o Next só o exige em desenvolvimento) [VERIFICADO]. **Prioridade: IMPORTANTE.**

**Cabeçalhos:**

| Cabeçalho                    | Valor proposto                                                                         | Situação    |
| ---------------------------- | -------------------------------------------------------------------------------------- | ----------- |
| `Content-Security-Policy`    | Duas camadas acima                                                                     | [PROPOSTA]  |
| `Strict-Transport-Security`  | `max-age=31536000; includeSubDomains` (só `preload` após validar todos os subdomínios) | [PROPOSTA]  |
| `X-Content-Type-Options`     | `nosniff`                                                                              | [EXISTENTE] |
| `Referrer-Policy`            | `strict-origin-when-cross-origin`                                                      | [EXISTENTE] |
| `Permissions-Policy`         | `camera=(), microphone=(), geolocation=()`                                             | [EXISTENTE] |
| `X-Frame-Options`            | `DENY` (redundante com `frame-ancestors`, mantido por compatibilidade)                 | [EXISTENTE] |
| `Cross-Origin-Opener-Policy` | `same-origin`                                                                          | [PROPOSTA]  |

**CSRF:** Server Actions comparam `Origin` com `Host` e recusam divergência, e o corpo é limitado a 1 MB por padrão [VERIFICADO em `guides/server-actions`]. Route Handlers que **mudam estado** repetem a checagem de origem e exigem cookie `SameSite=Lax`. **Login CSRF:** a biblioteca só valida a origem quando a requisição já traz cookie; a rota `/api/auth` tem guarda própria (`server/auth/origin.ts`, testada) e as opções `disableOriginCheck`/`disableCSRFCheck` são fixadas como `false` (o padrão da biblioteca as desliga em `NODE_ENV=test`). Formulários públicos (lead/newsletter) não dependem de cookie de sessão. Em deploy com mais de uma instância: definir chave estável de criptografia de closures (`NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`) [VERIFICADO].

**SSRF:** o servidor **não busca URL informada pelo usuário** (sem "pré-visualização de link", sem importação por URL). Mídia entra somente por upload.

**Rate limit (Prompt 3 §43):** implementação própria mínima em Postgres (janela fixa, `INSERT … ON CONFLICT DO UPDATE`), sem serviço extra.

| Endpoint                       | Limite proposto (janela)                        | Chave                          | Ao exceder                        |
| ------------------------------ | ----------------------------------------------- | ------------------------------ | --------------------------------- |
| Login                          | 5 falhas / 15 min por conta; 20 / 15 min por IP | e-mail normalizado + `ip_hash` | Erro genérico + espera; auditoria |
| Recuperação de acesso          | 3 / hora por e-mail; 10 / hora por IP           | e-mail + `ip_hash`             | Resposta idêntica, sem envio      |
| Contato                        | 5 / hora por IP; 3 / hora por e-mail            | `ip_hash`, e-mail              | 429 com mensagem humana           |
| Newsletter                     | 5 / hora por IP; 3 / dia por e-mail             | `ip_hash`, e-mail              | 429                               |
| Upload                         | 30 / hora por usuário                           | `user.id`                      | 429                               |
| Ações administrativas em massa | 60 / min por usuário                            | `user.id`                      | 429                               |

Valores iniciais **[PROPOSTA]**, a calibrar com tráfego real para não punir usuários legítimos (Prompt 3 §43). `ip_hash` = HMAC do IP com segredo do servidor, nunca o IP cru.

**Uploads:** ver seção 21. **Sessões e cookies:** seção 10. **Privacidade/LGPD (Prompt 3 §46):** finalidade única por coleta, minimização (só campos necessários), retenção definida (seção 22), transparência via Política de Privacidade (texto jurídico **[ABERTA]**, L-11), atendimento a direitos do titular (acesso, correção, eliminação) por ação de ADMIN com auditoria. A arquitetura permite plugar as políticas reais; não as inventa.

---

## 14. Threat Model

**Metodologia:** avaliação **qualitativa** (Baixo / Médio / Alto). _Impacto_ = pior consequência plausível para a DM (dado pessoal, reputação, continuidade). _Probabilidade_ = exposição do ativo × incentivo do atacante × facilidade. Sem pontuação numérica, por não haver base de dados que a sustente; **revisar após um teste de intrusão real antes do lançamento**.

| #   | Ameaça                                                  | Impacto | Prob. | Mitigação principal                                                                                               |
| --- | ------------------------------------------------------- | :-----: | :---: | ----------------------------------------------------------------------------------------------------------------- |
| 1   | _Credential stuffing_ no login do admin                 |  Alto   | Média | Rate limit por conta e IP, 2FA obrigatório para ADMIN/EDITOR, senha longa, mensagens genéricas, auditoria         |
| 2   | Força bruta de senha/2FA                                |  Alto   | Média | Bloqueio progressivo, limite no TOTP, alerta por e-mail de login novo (recomendado)                               |
| 3   | XSS armazenado via editor                               |  Alto   | Baixa | JSON + allowlist, sem HTML, sem `dangerouslySetInnerHTML`, protocolos de link restritos, CSP                      |
| 4   | XSS refletido (busca, parâmetros)                       |  Médio  | Baixa | Escape padrão do React, validação Zod de `searchParams`, sem HTML em mensagens                                    |
| 5   | CSRF em ações administrativas                           |  Alto   | Baixa | Checagem de origem das Server Actions, `SameSite=Lax`, checagem manual em Route Handlers mutáveis                 |
| 6   | SQL injection                                           |  Alto   | Baixa | Drizzle parametrizado; proibido SQL por concatenação (regra de revisão e teste)                                   |
| 7   | SSRF                                                    |  Médio  | Baixa | Nenhuma busca de URL do usuário; `remotePatterns` de imagem restrito ao host do storage                           |
| 8   | IDOR/BOLA em rotas de admin                             |  Alto   | Média | `can(...)` com propriedade em toda operação, 404 para invisíveis, testes negativos por papel                      |
| 9   | Abuso de upload (executável, _polyglot_, imagem enorme) |  Alto   | Média | Magic bytes, reprocessamento com `sharp`, sem SVG, limites de tamanho/dimensão, nome gerado, bucket sem execução  |
| 10  | Spam e abuso do formulário/newsletter                   |  Médio  | Alta  | Honeypot, tempo mínimo, rate limit, dedupe, status `SPAM`; CAPTCHA só se o spam persistir                         |
| 11  | _Scraping_ de conteúdo                                  |  Baixo  | Alta  | Conteúdo é público por natureza; sem dado privado exposto; `robots` e limites básicos                             |
| 12  | Escalada de privilégio (AUTHOR → ADMIN)                 |  Alto   | Baixa | Papel só alterável por ADMIN; a coluna `role` não é aceita de payload; testes                                     |
| 13  | Roubo de sessão                                         |  Alto   | Baixa | Cookie `HttpOnly`/`Secure`, CSP do admin com nonce, sessão revogável, expiração                                   |
| 14  | Vazamento de dados (leads, assinantes)                  |  Alto   | Média | Rota pública nunca lê tabelas privadas, DTOs mínimos, logs com redação, `ip_hash`, exportação restrita e auditada |
| 15  | Vazamento de rascunhos                                  |  Médio  | Média | Consultas públicas só `PUBLISHED`; sitemap/busca/JSON-LD/preview testados; `noindex` no preview                   |
| 16  | Abuso da rota de cron                                   |  Médio  | Baixa | Segredo em cabeçalho, comparação em tempo constante, idempotência                                                 |
| 17  | _Open redirect_ (`next` do login)                       |  Médio  | Baixa | Aceitar só caminho interno normalizado                                                                            |
| 18  | Injeção de cabeçalho em e-mail                          |  Médio  | Baixa | Remetente e destinatário fixos; dados do usuário só no corpo, escapados                                           |
| 19  | Dependência comprometida                                |  Alto   | Baixa | Versões exatas, `npm ci`, `npm audit`, revisão de dependências, poucas dependências                               |
| 20  | Fraude de identidade (_phishing_ de admin)              |  Alto   | Média | 2FA, alerta de novo login, domínio de e-mail com SPF/DKIM/DMARC                                                   |

---

## 15. API Architecture

**Princípio:** não existe API pública de conteúdo (YAGNI). O site lê dados **direto pela DAL** em Server Components; mutações são **Server Actions**. Route Handlers existem só onde o protocolo exige HTTP.

| Rota / mecanismo                          | Método                | Uso                                                  | Autenticação                    |
| ----------------------------------------- | --------------------- | ---------------------------------------------------- | ------------------------------- |
| Server Actions (CMS)                      | POST                  | Criar/editar/publicar conteúdo                       | Sessão + `can(...)`             |
| Server Actions (público)                  | POST                  | Enviar lead, assinar newsletter                      | Nenhuma; rate limit + anti-spam |
| `/api/auth/[...all]`                      | vários                | Endpoints da biblioteca de autenticação              | Própria da biblioteca           |
| `/api/health` [EXISTENTE]                 | GET                   | Vida da aplicação para monitor externo               | Nenhuma; sem dado interno       |
| `/api/cron/publish`                       | POST                  | Publicar agendados, notificações pendentes, limpezas | Segredo de cron                 |
| `/api/preview`                            | POST                  | Ligar/desligar Draft Mode                            | Sessão + `can(...)`             |
| `/api/newsletter/confirm`, `/unsubscribe` | GET→página, POST→ação | Confirmação e descadastro por token                  | Token assinado de uso único     |
| `sitemap.xml`, `robots.txt`, OG images    | GET                   | SEO                                                  | Nenhuma                         |
| Upload de mídia                           | POST                  | Envio de imagem (Server Action ou Route Handler)     | Sessão + `can(...)`             |

**Contratos:**

- Toda entrada passa por **schema Zod** (`safeParse`); saída da DAL tipada por DTO.
- Server Actions devolvem `ActionResult<T>` [EXISTENTE em `lib/result.ts`]; erros esperados voltam como valor, o inesperado é lançado e logado.
- Route Handlers devolvem `{ error: { code, message } }` com o status de `AppError.httpStatus` [EXISTENTE]. Nunca stack, SQL ou detalhe interno.
- Parâmetros de paginação têm **teto** (página ≥ 1, tamanho ≤ 50). Buscas têm tamanho máximo de termo.
- Envio de lead usa chave de idempotência (repetir o envio não cria segundo lead).

---

## 16. Server Architecture

**Ciclo de uma mutação:**

```text
Server Action → origem/tamanho → sessão → can() → Zod → serviço (transação) → efeitos pós-commit → ActionResult
```

**Transações (Prompt 3 §35) — o que precisa ser atômico:**

| Operação             | Dentro da transação                                                                                             | Fora (após o commit)                                      |
| -------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Publicar artigo      | Verificar estado + versão, gravar `status`/`published_at`, `audit_logs`, criar redirecionamento se o slug mudou | Invalidar tags de cache; e-mails                          |
| Mudar slug           | Atualizar slug + inserir `redirects` (antigo → novo)                                                            | Invalidar tags                                            |
| Criar lead           | Inserir lead + registro de auditoria/evento                                                                     | E-mail de notificação (a partir de `notified_at IS NULL`) |
| Assinar newsletter   | Inserir/atualizar assinante e token                                                                             | E-mail de confirmação                                     |
| Arquivar / restaurar | Estado + auditoria                                                                                              | Invalidação                                               |
| Publicar agendados   | Uma transação por item, `SELECT … FOR UPDATE SKIP LOCKED`                                                       | Invalidação                                               |

Se a invalidação de cache falhar depois do commit, o conteúdo **já está correto no banco**; a próxima expiração de `cacheLife` cobre o atraso, e a falha é logada. Nunca deixar conteúdo "meio publicado" (Prompt 4 §67).

**Concorrência (Prompt 3 §36) — bloqueio otimista:** toda entidade editável tem `version`. O `UPDATE` inclui `WHERE id = $1 AND version = $2` e incrementa `version`. Zero linhas afetadas → erro `CONFLICT` (já existe no modelo de erros) com a mensagem pública "Este conteúdo foi alterado por outra pessoa. Recarregue…" [EXISTENTE]. Publicação simultânea: a segunda transação vê o estado novo e é recusada. Exclusão durante edição: o `UPDATE` afeta zero linhas → conflito. **Sem colaboração em tempo real.**

**E-mail sem perder dados:** o lead é gravado **antes** de qualquer envio. O envio roda depois da resposta (`after()` do Next) e marca `notified_at`. Falha → o job de cron reenvia os leads com `notified_at IS NULL`. Isso é um _outbox_ mínimo, sem fila externa.

**Jobs:** uma rota `/api/cron/publish`, chamada pelo agendador da plataforma a cada poucos minutos: publica agendados, reenvia notificações pendentes, limpa `rate_limits` e `ip_hash` vencidos, remove mídia órfã, alerta se o próprio job ficou parado. Todas as etapas são idempotentes. **Limites de frequência do agendador dependem do plano do provedor: verificar antes de contratar [ABERTA].**

---

## 17. Frontend Architecture

- **Server Components por padrão.** `"use client"` apenas em: menu mobile, formulários (por `useActionState`), editor do CMS, campo de busca, estado de carregamento. Nenhuma biblioteca de estado global.
- **Formulários:** Server Actions com melhoria progressiva (funcionam sem JS), erros por campo vindos de `fieldErrors` do modelo de erros [EXISTENTE].
- **Tokens do Design System (Prompt 3 §48):** variáveis CSS em duas camadas (Blueprint 2, seção 26): primitivos em português (`papel`, `tinta`, `verde-tinta`, `areia`, `terracota`) e semânticos em inglês (`surface`, `text`, `action`, `focus`…), expostos ao Tailwind 4 pela configuração de tema em CSS. **Nenhum hexadecimal fora do arquivo de tokens** (regra de revisão; pode virar regra de lint).
- **Tipografia:** `next/font` com Newsreader e Instrument Sans, hospedadas pelo próprio Next (sem requisição a terceiros), `display: swap`, subconjunto latino. Nada de fonte carregada por CSS externo.
- **Imagens:** `next/image` com `sizes` corretos, `priority` só na imagem principal, proporções fixas por caso de uso (Blueprint 2, seção 32), `object-position` vindo do ponto focal (`focal_x`, `focal_y`), texto alternativo obrigatório.
- **Movimento:** apenas CSS (opacidade e transformação), com uma regra global para `prefers-reduced-motion` que desliga revelações e transformações.
- **Responsividade:** mobile primeiro; composições distintas por faixa (Blueprint 2, seção 24), não desktop reduzido.
- **Navegação:** `next/link` com pré-busca padrão; o menu mobile usa `<dialog>` nativo (foco preso e `Esc` já tratados pelo navegador), sem biblioteca.
- **Erros e estados:** `error.tsx`, `global-error.tsx`, `not-found.tsx` com microcopy do Blueprint 2, seção 29; `loading.tsx` só onde há dado dinâmico real.

---

## 18. Component Architecture

Quatro níveis (Prompt 3 §49), mapeados aos componentes do Blueprint 2 (seção 27). Só entram os que têm função.

| Nível          | Conteúdo                                                                                                                                                                   | Pasta                                   |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| **Primitives** | Container, Section, Heading, SectionLabel, Button, Link, Field (Input, Textarea, Select, Checkbox), FormMessage, Figure, SkipLink                                          | `components/ui`                         |
| **Components** | Header, MobileMenu, Footer, Breadcrumb, ArticleCard, SolutionCard, ExpertCard, ContentCard, AuthorBio, RichText, CategoryNav, Pagination, EmptyState, CTASection, LeadForm | `components/layout`, `content`, `forms` |
| **Sections**   | Blocos de página compostos: Hero (variantes), Reconhecimento, SoluçõesDestaque, ProcessSteps, EspecialistasDestaque, ConteúdoEditorial                                     | `components/sections`                   |
| **Templates**  | HomeTemplate, AboutTemplate, BlogIndexTemplate, ArticleTemplate, SolutionTemplate, SpecialistTemplate, ContactTemplate                                                     | `components/templates`                  |

**Regras:** componente sem dado de servidor (recebe **props**); nenhum componente passa de algumas dezenas de linhas de marcação sem ser dividido; estados (hover/foco/ativo/desabilitado/carregando/erro) fazem parte de cada componente interativo (Blueprint 2, seção 28); nenhum componente cria estilo fora dos tokens. **Removidos por decisão do Design System:** Modal, Toast, Badge/Tag em pílula.

---

## 19. Content Architecture

**Tipos de conteúdo e campos obrigatórios para publicar (do Blueprint 1):**

| Tipo         | Obrigatórios                                   | Opcionais                                                           |
| ------------ | ---------------------------------------------- | ------------------------------------------------------------------- |
| Artigo       | título, slug, autor, categoria primária, corpo | subtítulo, capa (com alt), solução primária, tags, SEO              |
| Solução      | título, slug, resumo, contexto, abordagem      | situações, etapas, objetivos, especialistas, SEO                    |
| Especialista | nome, slug, cargo, foto real, resumo           | biografia, experiência, formação, especialidades (só se fornecidas) |
| Página       | chave, título, dados do template               | SEO                                                                 |

**Slugs:** gerados do título (minúsculas, sem acento, hífen), editáveis, **únicos por tipo**, com lista de reservados (`admin`, `api`, `categoria`, …). Após publicar, mudar o slug cria redirecionamento automático (seção 20).

**Tempo de leitura:** calculado ao salvar a partir do texto plano do corpo.

**Relacionados (Blueprint 1, seção 13):** ordem de prioridade — escolha editorial → mesma solução → mesma categoria → mesma tag; sem resultado, o bloco não aparece.

### DECISÃO — Busca com Postgres Full-Text Search (Prompt 3 §71)

- **O que:** coluna `search_vector` gerada (`to_tsvector` com configuração em português e `unaccent`), pesos A título, B subtítulo/resumo, C corpo em texto plano; consulta com `websearch_to_tsquery`; ranking por `ts_rank_cd`; filtro por categoria; paginação.
- **Motivo:** cobre milhares de artigos sem serviço extra. A documentação do Drizzle mostra colunas `tsvector` geradas com índice GIN [VERIFICADO].
- **Alternativas:** Elasticsearch/OpenSearch (rejeitado: custo e operação sem necessidade); `LIKE` (rejeitado: lento, sem ranking).
- **Sem resultado:** mensagem e saída para categorias (Blueprint 2, seção 29). Busca **só** de conteúdo `PUBLISHED`.
- **Quando ligar:** só depois de volume mínimo de artigos (Blueprint 1, D6). **Prioridade: RECOMENDADA.**

### DECISÃO — Paginação por deslocamento (offset) (Prompt 3 §72)

- **O que:** `?pagina=N`, 12 itens por página, teto de página, "Página X de Y".
- **Motivo:** o Design System pede paginação numerada; o volume não justifica _cursor_; páginas de listagem numeradas são melhores para SEO.
- **Alternativas:** cursor (rejeitado agora; reavaliar acima de dezenas de milhares de linhas ou em listas de leads muito longas).
- **Regra:** ordenação **estável** (`published_at DESC, id`) para não repetir/perder itens. **Prioridade: RECOMENDADA.**

---

## 20. SEO Architecture

- **Metadata por página** pela API de Metadata do Next, com **fallback em cascata** (Prompt 4 §37): `seo_title` → título do conteúdo; `seo_description` → resumo/subtítulo → primeiros ~155 caracteres do texto plano; imagem OG → capa → imagem padrão. **Nunca** `undefined` nem descrição vazia. Título com modelo "Página — DM Empresarial".
- **Canônica:** URL absoluta (`SITE_URL` + caminho, sem parâmetros de rastreio, sem barra final). `SITE_URL` já é validado por `env.ts` [EXISTENTE].
- **URLs:** sem barra final; caixa baixa; hífen; estrutura do Blueprint 1, seção 05. Conteúdo com `noindex`: preview, admin, resultados de busca e páginas de paginação profunda (a decidir com dados).
- **Sitemap:** gerado do banco com **apenas** conteúdo público `PUBLISHED` e indexável; `lastModified` real. Nunca rascunho, preview, admin ou privado. Invalidado pela tag `sitemap`.
- **Robots** [EXISTENTE]: bloqueia tudo fora de production; em production libera e exclui `/admin` e `/api`. **Atenção:** a correção feita hoje usa `export const dynamic = "force-dynamic"`. Com Cache Components ligado, esse _export_ **passa a dar erro** [VERIFICADO em `migrating-to-cache-components`]; a migração é ler o ambiente em tempo de requisição com `connection()` (API existente no Next instalado). Registrado como tarefa da fase de cache.
- **Redirecionamentos (Prompt 3 §69):** tabela `redirects`. A resolução acontece quando **a página de conteúdo não encontra o slug**: consulta `redirects` (cacheada por tag) e faz `permanentRedirect` (301). **Não** se consulta o banco no Proxy (o Proxy não é lugar de leitura lenta [VERIFICADO na doc]).
- **404:** página própria com saídas úteis; conteúdo arquivado devolve 404, salvo redirecionamento definido.
- **Dados estruturados (JSON-LD)** — só com dado real e visível na página:

| Schema                                | Onde                 | Campos                                                              | Regra                                                              |
| ------------------------------------- | -------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `Organization`                        | Global               | nome, URL, logo (se existir), `sameAs` (só redes reais)             | Campo sem dado é **omitido**                                       |
| `WebSite`                             | Home                 | nome, URL                                                           | Sem `SearchAction` até a busca existir                             |
| `LocalBusiness`/`ProfessionalService` | Contato/Home         | nome, endereço confirmado (Av. C. Delfino Nunes, 1111, Frutal — MG) | **Sem** telefone, horário, coordenadas, avaliações até serem reais |
| `Article`                             | Artigo               | título, datas de publicação/atualização, autor `Person`, imagem     | Só artigos publicados                                              |
| `Person`                              | Especialista         | nome, cargo, imagem, URL                                            | Sem formação/certificação inventadas                               |
| `BreadcrumbList`                      | Páginas de 2+ níveis | itens reais                                                         |                                                                    |

Nunca: avaliações, notas, preços, eventos ou qualquer coisa não sustentada pelo conteúdo (Prompt 4 §39).

- **SEO local (Prompt 3 §25):** fonte única de nome/endereço/contato em `site_settings` (consistência); categoria editorial "Negócios em Frutal e Região" com fontes; nenhuma página artificial cheia de palavras-chave; nenhum dado de cobertura, telefone ou horário inventado.
- **CMS controla:** título SEO, descrição, canônica (sobrescrita), imagem OG e slug, **sempre com padrão inteligente** para que o editor não precise preencher (Prompt 3 §68).

---

## 21. Media Architecture

### DECISÃO — Storage atrás de uma interface, imagens reprocessadas no servidor

- **O que:** binários **fora** do Postgres, em storage de objetos; o banco guarda `media` (metadados). O código fala com uma interface `StoragePort` (`put`, `remove`, `publicUrl`); o provedor é escolha aberta (seção 34).
- **Pipeline de upload (Prompt 3 §22):** autenticação e `can(...)` → limite de tamanho → **detecção do tipo por conteúdo** (magic bytes com `file-type`, sem confiar em extensão nem em `Content-Type` do cliente) → aceitar só JPEG, PNG, WebP e AVIF → checar dimensões máximas → **reprocessar com `sharp`** (decodifica e recodifica: remove EXIF/metadados e neutraliza _polyglots_) → gerar nome no servidor (`yyyy/mm/<uuid>.<ext>`, nunca o nome original) → gravar → registrar `media` com hash, dimensões e `alt_text`.
- **Sem SVG enviado por usuário** no MVP (vetor de XSS). SVG só como ativo estático versionado no repositório.
- **Limites propostos:** 10 MB de origem, 6000 px no maior lado, saída limitada a 2400 px [PROPOSTA].
- **Servir:** URL pública do bucket (ou CDN) restrita por `remotePatterns` do `next/image`; bucket **sem** execução de conteúdo; rascunhos usam a mesma mídia (imagem em si não é sigilosa; a **referência** só aparece em conteúdo publicado).
- **Órfãs:** o job remove `media` `PENDING` antigas e mídias sem referência há mais de 7 dias, com auditoria.
- **Restrição de plataforma:** funções serverless costumam ter limite de corpo de requisição (**verificar o valor vigente do provedor**). Se o limite for menor que 10 MB, o upload passa a ser por **URL pré-assinada direta ao storage** + etapa de "finalização" no servidor (verifica, reprocessa, registra). Essa escolha depende da decisão de deploy.
- **Alternativas:** guardar imagem no Postgres (vedado sem justificativa forte); aceitar qualquer arquivo (rejeitado).
- **Regra:** nenhuma rota serve arquivo por caminho recebido do cliente. **Prioridade: IMPORTANTE.**

**Imagens do Design System:** proporções e mínimos por uso estão no Blueprint 2, seção 32; o texto alternativo é **obrigatório para publicar** quando a imagem não é decorativa.

---

## 22. Lead Architecture

**Pipeline (Prompt 4 §32):**

```text
Form (validação para UX) → Server Action
  → origem + tamanho do corpo
  → honeypot + token de tempo mínimo (assinado)
  → rate limit (ip_hash e e-mail)
  → Zod (servidor) + normalização
  → dedupe (mesmo e-mail + mesma mensagem em janela curta)
  → transação: lead + auditoria
  → resposta ao usuário
  → após a resposta: e-mail de notificação → marca notified_at (retry por cron se falhar)
```

**Campos (Blueprint 1 §14, D3):** obrigatórios **nome, e-mail, mensagem, consentimento**; opcionais telefone, empresa, cargo, segmento, site, **interesse** (solução, opcional; o Prompt 3/4 acrescentam este campo). Todos com tamanho máximo e validação de formato. Nada além disso é coletado ("mínimo necessário", Prompt 3 §14).

**Verificações de origem:** `interest_solution_id` e `origin_post_id` são **confirmados no servidor** (devem existir e estar publicados); o que o cliente informa sobre origem não é confiável.

**Atribuição (Prompt 3 §15) — mínima e opcional:**

| Dado                                         | Como                                                                                                                                                                                                                              |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| _last touch_ (parâmetros da visita do envio) | Lidos da própria requisição do formulário                                                                                                                                                                                         |
| _first touch_ (primeira visita)              | Cookie próprio, definido no Proxy **só quando** há parâmetros de campanha ou referência externa; conteúdo: `source`, `medium`, `campaign`, `content`, `term`, `landing_path`, `referrer_host`; validade curta (sugestão: 30 dias) |
| Página que levou ao contato                  | Artigo/solução de origem (verificado)                                                                                                                                                                                             |

O cookie de _first touch_ e o consentimento associado dependem da **orientação jurídica (L-11)**; fica atrás da variável `ATTRIBUTION_ENABLED`, **desligada até decisão**. Sem ela, a atribuição continua funcionando com _last touch_ + origem do artigo/solução.

**Privacidade:** IP nunca armazenado; só `ip_hash` (HMAC diário) para anti-abuso, apagado em até 30 dias. Retenção do lead: **prazo a definir com o jurídico [ABERTA]**. Lead com `status = SPAM` não notifica.

**Estados do lead:** `NEW → CONTACTED → QUALIFIED | DISCARDED | SPAM`. Sem `lead_events` no MVP: mudanças de estado vão para `audit_logs`.

**Anti-spam sem atrito (Prompt 3 §21):** honeypot + tempo mínimo + limites + heurística (muitos links no texto → `SPAM`). CAPTCHA só se o spam real justificar, preferindo desafio invisível.

**Feedback ao usuário (Prompt 4 §33):** enviando · sucesso · erro de validação por campo · indisponibilidade ("Não conseguimos enviar agora. Tente de novo em instantes.") — sem mensagem técnica, sem prometer prazo não confirmado (L-12).

---

## 23. Newsletter Architecture

- **Duplo aceite (_double opt-in_)** recomendado: o cadastro cria `PENDING` + token de confirmação (aleatório de 32 bytes, **só o hash** é guardado, expira em 48 h); o e-mail traz o link; a confirmação marca `ACTIVE` com `confirmed_at`.
- **Consentimento:** caixa **não marcada por padrão**, com a versão do texto aceito (`consent_version`) e data.
- **Estados:** `PENDING → ACTIVE → UNSUBSCRIBED` (`BOUNCED` por retorno do provedor).
- **Descadastro:** link em todo e-mail (token assinado) e cabeçalho `List-Unsubscribe`; efeito imediato, sem exigir login.
- **Duplicidade:** e-mail único (normalizado); reinscrição após descadastro exige novo aceite.
- **Envio de campanhas:** **fora do MVP** (L-13). O banco é a fonte do consentimento; a exportação/integração com a ferramenta de envio é decisão posterior. Nenhum e-mail sai do navegador; a chave do provedor nunca vai ao cliente.
- **Rate limit** e honeypot como no contato.

---

## 24. Analytics Architecture

- **Interface, não ferramenta:** `analytics.track(evento)` com união tipada de eventos (`page_view`, `solution_view`, `article_view`, `lead_started`, `lead_submitted`, `newsletter_subscribed`, `cta_clicked`) e um adaptador **nulo por padrão**. Escolher a ferramenta é decisão posterior [ABERTA]; preferência por solução sem cookie, para simplificar LGPD.
- **Autoridade no servidor:** `lead_submitted` e `newsletter_subscribed` são emitidos pelo servidor (não dependem do navegador do usuário).
- **Sem PII** em eventos; sem _tracking_ excessivo (Prompt 3 §47). Se o adaptador escolhido exigir consentimento, ele é quem controla o carregamento.
- **Prioridade: FUTURA** para a ferramenta; **RECOMENDADA** para a interface, por ser barata e evitar acoplamento.

---

## 25. Caching Strategy

### DECISÃO — Cache Components com invalidação por tag (Prompt 3 §27)

- **O que:** habilitar `cacheComponents: true` ao iniciar as páginas públicas. Funções de dados públicas usam `use cache` + `cacheLife(...)` + `cacheTag(...)`; o conteúdo dinâmico (busca, admin) fica fora do cache e em `<Suspense>`.
- **Motivo (verificado na doc do Next 16.3.5):** é o modelo atual do framework; dados dinâmicos por padrão, cache explícito; PPR vira o comportamento padrão e o HTML estático serve da CDN; a invalidação usa `updateTag` (a própria edição vê o resultado na hora, só em Server Actions) e `revalidateTag(tag, 'max')` (_stale-while-revalidate_) — **note o segundo argumento, obrigatório nesta versão** [VERIFICADO].
- **Alternativas:** modelo anterior (`revalidate`/`dynamic` por segmento; ISR clássico) — funciona, mas é o modelo que a doc marca como anterior; tudo dinâmico (rejeitado: contraria o Prompt 3).
- **Trade-off:** API recente; exige disciplina (`use cache` não pode ler cookies/headers; `new Date()`/`Math.random()` fora de escopo cacheado geram erro de _prerender_). **Mitigação:** adotar página por página e validar o build.
- **Regra:** nenhuma função com `use cache` lê sessão ou dado privado. **Prioridade: IMPORTANTE.**

**Estratégia por conteúdo:**

| Conteúdo                           | Renderização                          | `cacheLife` | Tags                                   | Invalidado quando                               |
| ---------------------------------- | ------------------------------------- | ----------- | -------------------------------------- | ----------------------------------------------- |
| Home, Sobre, Contato               | Estático + blocos cacheados           | `hours`     | `pages`, `page:{key}`, `site-settings` | Editar página/config; publicar conteúdo listado |
| Índice e categoria do blog         | Estático + cache de dados             | `hours`     | `posts`, `categories`                  | Publicar/arquivar artigo                        |
| Artigo                             | Estático (gerado sob demanda) + cache | `days`      | `post:{slug}`, `posts`                 | Editar/publicar/arquivar esse artigo            |
| Soluções (índice e detalhe)        | Estático + cache                      | `days`      | `solutions`, `solution:{slug}`         | Editar/publicar solução                         |
| Especialistas (diretório e perfil) | Estático + cache                      | `days`      | `specialists`, `specialist:{slug}`     | Editar/publicar especialista                    |
| Redirecionamentos                  | Cache de dados                        | `hours`     | `redirects`                            | Criar/alterar redirecionamento                  |
| Sitemap                            | Cache de dados                        | `hours`     | `sitemap`                              | Publicar/arquivar qualquer conteúdo             |
| Busca, admin, preview, formulários | **Dinâmico**, sem cache               | —           | —                                      | —                                               |

Perfis `seconds`/`revalidate: 0` **saem do pré-render** e viram "buracos dinâmicos" [VERIFICADO]; usar só quando houver motivo. Preview ignora todo o cache (Draft Mode).

---

## 26. Performance Strategy

**Orçamentos propostos — a medir, não estimar (Prompt 4 §47):**

| Métrica                            | Alvo                                                       | Base                                             |
| ---------------------------------- | ---------------------------------------------------------- | ------------------------------------------------ |
| LCP (p75, móvel)                   | ≤ 2,5 s                                                    | Limiar "bom" publicado do Core Web Vitals        |
| INP (p75)                          | ≤ 200 ms                                                   | Idem                                             |
| CLS (p75)                          | ≤ 0,1                                                      | Idem                                             |
| JavaScript inicial de rota pública | **[a definir após a medição da linha de base]**            | Público sem editor, sem bibliotecas de UI/estado |
| Fontes                             | ≲ 150 KB no total                                          | Blueprint 2, seção 07                            |
| Imagem principal (hero)            | Peso por imagem na casa de dezenas de KB a poucas centenas | Formatos modernos, `sizes` corretos              |
| Scripts de terceiros no MVP        | Nenhum                                                     | Analytics só depois e sem bloquear               |

**Técnicas:** Server Components; editor Tiptap só no admin; `next/image` e `next/font`; `Suspense` para o que é dinâmico; consultas com índice e sem N+1 (uma consulta por bloco, carregando relações em lote); paginação com teto; sem vídeos grandes nem animação pesada. **Verificação:** Lighthouse/Web Vitals em cada template antes de considerar pronto, com o resultado registrado. Segurança tem prioridade sobre milissegundos irrelevantes (Prompt 3 §76).

---

## 27. Accessibility Strategy

Meta **WCAG 2.2 AA** (Blueprint 2, seção 25). Como a arquitetura garante:

- **Semântica:** um `h1` por página, marcos (`header`, `nav`, `main`, `footer`), link "Ir para o conteúdo" primeiro. O editor **não permite H1** no corpo e valida a hierarquia sem saltos.
- **Formulários:** rótulo visível associado, `aria-describedby` para ajuda e erro, resumo de erros com foco movido, erro anunciado.
- **Foco e teclado:** anel de foco visível nos tokens; menu em `<dialog>`; nada dependente de _hover_.
- **Movimento:** regra global de `prefers-reduced-motion`.
- **CMS:** texto alternativo **obrigatório** para publicar imagem não decorativa.
- **Contraste como teste:** um teste unitário calcula as razões de contraste a partir dos **valores dos tokens** e falha se uma combinação prevista cair abaixo do mínimo (protege a tabela do Blueprint 2, seção 10).
- **Verificação automática e manual:** `eslint-plugin-jsx-a11y` (já incluído na configuração do Next) [VERIFICADO na doc], axe em cada template no E2E, roteiro manual de teclado e leitor de tela por gabarito.

---

## 28. Error Handling

**Base [EXISTENTE] em `lib/errors.ts` e `lib/result.ts`:** `AppError` com códigos `VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `DOMAIN_RULE`, `RATE_LIMITED`, `EXTERNAL_SERVICE`, `UNEXPECTED`; mensagens públicas em português; `toActionError` que **nunca** vaza detalhe; `ActionResult<T>`. Mantida integralmente.

| Classe de erro     | Código             | Comportamento                                                          |
| ------------------ | ------------------ | ---------------------------------------------------------------------- |
| Validação          | `VALIDATION`       | `fieldErrors` por campo; nada é gravado                                |
| Não autenticado    | `UNAUTHENTICATED`  | Redireciona ao login (admin) ou pede entrada                           |
| Não autorizado     | `FORBIDDEN`        | Mensagem genérica; **404** quando revelar existência seria vazamento   |
| Inexistente        | `NOT_FOUND`        | Página 404 própria (público) ou aviso (admin)                          |
| Conflito de edição | `CONFLICT`         | Pede recarregar, sem perder o texto digitado                           |
| Regra de negócio   | `DOMAIN_RULE`      | Explica o que falta ("Falta o texto alternativo da capa")              |
| Limite de taxa     | `RATE_LIMITED`     | Mensagem humana + `retryAfterSeconds`                                  |
| Serviço externo    | `EXTERNAL_SERVICE` | Não perde o dado; agenda nova tentativa quando aplicável               |
| Inesperado         | `UNEXPECTED`       | Log completo no servidor (com redação); usuário vê a mensagem genérica |

**Next:** `error.tsx`, `global-error.tsx`, `not-found.tsx` e, opcionalmente, `global-not-found.tsx` (marcado como experimental na doc) [VERIFICADO na checklist do Next]; `instrumentation.ts` com `onRequestError` para registrar falhas de renderização no logger. **Nunca** expor stack, SQL, segredo ou estrutura interna.

---

## 29. Logging & Observability

**Logs de aplicação [EXISTENTE]:** logger estruturado (uma linha JSON por evento), níveis por `LOG_LEVEL`, **redação de segredos** por nome de chave e credenciais em URLs, 100% testado.

**A acrescentar [PROPOSTA]:** `request_id` por requisição (gerado no Proxy, propagado ao logger via `child`); um logger filho por módulo; `onRequestError` do Next; log de cada falha de e-mail, de cron e de rate limit.

| Separação             | Onde                      | Conteúdo                                    | Quem lê    |
| --------------------- | ------------------------- | ------------------------------------------- | ---------- |
| **Logs de aplicação** | Saída padrão / plataforma | Problemas técnicos, latências, falhas       | Engenharia |
| **Audit logs**        | Tabela `audit_logs`       | Ações administrativas relevantes (seção 30) | ADMIN      |

**Nunca logar:** senha, token, chave de API, corpo de formulário, e-mail/telefone de lead, IP cru.

**Monitoramento mínimo:** monitor externo em `/api/health`; alerta se o job de cron parar; contagem de falhas de envio de lead; erros de autenticação e de banco. **Ferramenta de rastreio de erros (por exemplo Sentry) é decisão aberta**; o mínimo funcional são os logs da plataforma + `onRequestError`.

---

## 30. Audit Logs

**Tabela `audit_logs` (append-only):** `at`, `actor_user_id`, `action`, `entity_type`, `entity_id`, `metadata` (jsonb **mínimo**: nomes dos campos alterados e estados de/para, nunca o conteúdo), `request_id`.

**Ações registradas:** login (sucesso e falhas repetidas), logout, troca de senha, 2FA, criar/editar/publicar/agendar/arquivar/restaurar/excluir conteúdo, alterar redirecionamento, upload/exclusão de mídia, alterar `site_settings`, criar/desativar usuário, alterar papel, ver/exportar/excluir leads, alterar estado de lead.

**Garantias:** escrita **na mesma transação** da mudança (não existe mudança sem registro); o role `dm_app` tem `INSERT` e `SELECT`, **sem** `UPDATE`/`DELETE`; visível só a ADMIN; retenção proposta de 12 meses (a confirmar). Sem dados pessoais desnecessários.

---

## 31. Testing Strategy

**Pirâmide por risco (não por cobertura percentual):**

| Nível      | Ferramenta             | Alvo                                                                                              | Situação                                                                       |
| ---------- | ---------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Unitário   | Vitest                 | Regras de domínio, validações, `can(...)`, slug, máquina de estados, redação, contraste           | [EXISTENTE] 31 testes (env, erros, logger, health, robots, config)             |
| Integração | Vitest + Postgres real | Repositórios, transações, constraints, concorrência (`version`), rate limit, permissões por papel | [PROPOSTA] banco de teste dedicado, migrations aplicadas, limpeza entre testes |
| E2E        | Playwright + axe       | Navegação pública, contato, newsletter, login, criar/publicar artigo, preview, admin sem sessão   | [PROPOSTA]                                                                     |

Banco de teste separado (nunca o de desenvolvimento). Sem 100% artificial.

**Catálogo de testes negativos e de segurança (Prompt 3 §55 + Prompt 4 §51):**

| Área             | Casos                                                                                                                                       |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Autenticação     | Sem sessão em `/admin` e em cada Server Action; sessão expirada; login com senha errada repetida (limite); enumeração de conta              |
| Autorização      | Cada linha da matriz por papel; AUTHOR editando artigo alheio; AUTHOR publicando; EDITOR gerenciando usuários; **IDOR** por ID em cada rota |
| Estados          | Transições proibidas; publicar duas vezes em paralelo; publicar com campos faltando; agendar no passado                                     |
| Conteúdo público | Rascunho/agendado/arquivado por slug direto → 404; fora do sitemap, da busca e do JSON-LD; preview `noindex`                                |
| Entrada          | E-mail inválido; payload gigante; campos além do limite; slug inexistente; parâmetros de página negativos/enormes                           |
| XSS              | JSON com nó/atributo/protocolo não permitido (`javascript:`); `<script>` em texto; parâmetros refletidos                                    |
| Upload           | Extensão falsa (`.jpg` com conteúdo executável), tipo falso, imagem gigante, SVG, _polyglot_, nome com `../`                                |
| Rate limit       | Estouro em login, contato, newsletter, upload; janela reinicia                                                                              |
| Concorrência     | Duas edições simultâneas (`CONFLICT`); exclusão durante edição; duplo envio de lead                                                         |
| Resiliência      | Banco indisponível; e-mail indisponível (lead preservado, reenvio); sessão que expira durante a ação                                        |
| Privacidade      | Nenhuma resposta pública contém campos privados; logs sem segredos                                                                          |

---

## 32. CI/CD

```text
Pull Request → format → lint → typecheck → testes unitários → testes de integração (Postgres de serviço)
             → verificação de migrations → build → E2E (fumaça) → segurança → preview → (merge) → deploy de produção
```

**Segurança no pipeline:** `npm audit` (alto/crítico), revisão de dependências no PR, varredura de segredos, `drizzle-kit check` (consistência de migrations). **Situação:** existe `.github/workflows/ci.yml` (format + `check` + `audit`) [criado nesta etapa, ainda sem _remote_]; integração, E2E e segredos são [PROPOSTA].

**Regras:** `main` protegida; deploy só com verde; migration aplicada por etapa **separada e explícita** com o role `dm_owner`, antes do código novo; falha de qualquer etapa bloqueia o deploy (Prompt 3 §56).

**Git (Prompt 3 §57):** ramos curtos `feat/…`, `fix/…`; _Conventional Commits_ (já usado no histórico); commits pequenos e coerentes (Prompt 4 §53); PR com descrição do que muda, risco e como testar; migrations revisadas como código; _tags_ de versão a cada deploy de produção. Sem burocracia adicional.

---

## 33. Environment Strategy

| Ambiente      | Banco                                           | Storage                      | E-mail                           | Auth / domínio               | Indexação     | Logs            |
| ------------- | ----------------------------------------------- | ---------------------------- | -------------------------------- | ---------------------------- | ------------- | --------------- |
| `development` | Postgres local (Docker, porta 5433) [EXISTENTE] | Pasta local ou bucket de dev | Registro no console/_sandbox_    | `localhost`                  | Bloqueada     | Nível debug     |
| `staging`     | Instância própria                               | Bucket próprio               | Domínio de teste / _sandbox_     | Domínio de staging protegido | **Bloqueada** | Nível info      |
| `production`  | Instância própria + backup                      | Bucket próprio               | Domínio da DM com SPF/DKIM/DMARC | Domínio real, HTTPS          | Liberada      | Nível info/warn |

**Regras:** três conjuntos de segredos **distintos**, sem reaproveitar credencial; banco de produção **nunca** acessível de máquina de desenvolvimento; `robots` só libera em `production` [EXISTENTE]; com `NODE_ENV=production`, `APP_ENV` explícito é obrigatório [EXISTENTE desde esta etapa].

**Variáveis (Prompt 3 §41) — nomes apenas, sem valores:**

| Grupo        | Variável                                                              | Observação                                                                             |
| ------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Aplicação    | `APP_ENV`, `SITE_URL`, `LOG_LEVEL`                                    | [EXISTENTES], validadas por `env.ts`                                                   |
| Banco        | `DATABASE_URL` (role `dm_app`)                                        | Runtime, sem DDL. **A criar**                                                          |
|              | `DATABASE_URL_ADMIN` (role `dm_owner`)                                | Só migrations/bootstrap. [EXISTENTE]                                                   |
| Autenticação | `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`                               | Nomes da biblioteca (o Prompt 3 os chama de `AUTH_SECRET`); confirmar na implementação |
| Segurança    | `IP_HASH_SECRET`, `CRON_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Segredos distintos; a última só para multi-instância                                   |
| Storage      | `STORAGE_*` (endpoint, bucket, chaves, URL pública)                   | Conforme provedor                                                                      |
| E-mail       | `EMAIL_FROM`, `RESEND_API_KEY`, `LEAD_NOTIFY_TO`                      | Só servidor                                                                            |
| Analytics    | `ANALYTICS_*`                                                         | Só se houver ferramenta                                                                |
| Recursos     | `ATTRIBUTION_ENABLED`                                                 | Desligado por padrão                                                                   |

`.env.example` só com _placeholders_ [EXISTENTE, a ampliar]. `env.ts` valida por grupo, com exigências crescentes em production e **mensagens que citam só o nome da variável** [EXISTENTE].

---

## 34. Deployment Architecture

### DECISÃO — Vercel + Postgres gerenciado + storage S3-compatível + Resend, com portabilidade por interfaces (Prompt 3 §79) **[ABERTA]**

| Critério                                       | A) Vercel + Postgres gerenciado (Neon/Supabase) + storage                                    | B) VPS/Docker próprio (Postgres + storage local ou S3)                                             |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Recursos do Next 16 (cache por tag, ISR, cron) | Nativos                                                                                      | Funcionam, com mais configuração (cache compartilhado em multi-instância, chave de Server Actions) |
| Operação                                       | Baixa (gerenciado)                                                                           | Alta (patches, backup, TLS, monitoramento por conta própria)                                       |
| Custo inicial                                  | Baixo, cresce com uso (**verificar preços e limites vigentes na contratação**)               | Previsível, mas com custo de tempo de operação                                                     |
| Backup/recuperação                             | Do provedor (retenção e _point-in-time_ variam por plano: **verificar**)                     | Por conta própria                                                                                  |
| Portabilidade                                  | Boa se o código evitar APIs proprietárias                                                    | Máxima                                                                                             |
| Latência para o Brasil                         | Depende de região (**verificar disponibilidade de região em São Paulo** para função e banco) | Escolha livre                                                                                      |

- **Recomendação:** **A**. Menor esforço operacional e melhor aderência ao modelo de cache do Next 16, adequado a uma empresa em crescimento (Prompt 3 §78).
- **Como manter a saída aberta:** Docker-compatível, sem uso de APIs proprietárias fora das interfaces (`StoragePort`, e-mail, agendador), configuração só por variáveis.
- **Provedor de banco:** escolher com base em região, política de _backup_/PITR, extensões (`citext`, `unaccent`) e _pooling_. **Nada foi contratado nem verificado em conta.**
- **Domínio/DNS:** domínio definitivo é lacuna L-02; SPF/DKIM/DMARC configurados antes do primeiro e-mail real.
- **Rollback (Prompt 4 §74):** _rollback_ de deploy pela plataforma; migrations sempre **retrocompatíveis** (expandir → migrar → contrair) para que o código anterior continue funcionando.

---

## 35. Backup & Recovery

**Metas propostas [ABERTA, a validar com a DM]:** RPO ≤ 24 h (melhor com recuperação a ponto no tempo), RTO ≤ 4 h.

| Ativo    | Estratégia                                                                                        | Retenção proposta    |
| -------- | ------------------------------------------------------------------------------------------------- | -------------------- |
| Banco    | Backup/PITR do provedor **+** `pg_dump` lógico semanal para um bucket de **outra conta/provedor** | 30 dias + 12 mensais |
| Mídia    | Versionamento do bucket ou cópia para segundo bucket                                              | 30 dias              |
| Segredos | Cofre do provedor + procedimento de recriação; nada no repositório                                | —                    |
| Código   | Repositório remoto (ainda **não existe** remote)                                                  | —                    |

**Backup só vale se restaurado:** _runbook_ de restauração escrito e **teste de _restore_** antes do lançamento e a cada trimestre, registrando o tempo real.

**Cenários (Prompt 3 §81):**

| Cenário                       | Resposta mínima                                                                                         |
| ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| Perda/corrupção do banco      | Restaurar do PITR/último dump em instância nova; trocar `DATABASE_URL`; validar integridade e sitemap   |
| Perda do storage              | Restaurar do segundo bucket; reprocessar referências órfãs                                              |
| Indisponibilidade do provedor | Páginas estáticas seguem no CDN; comunicar; plano de migração B só se prolongado                        |
| Vazamento de credenciais      | Rotacionar segredo, invalidar sessões, revisar `audit_logs`, avaliar notificação (LGPD, com o jurídico) |
| Deploy ruim                   | _Rollback_ pelo provedor; migration retrocompatível                                                     |

Não é infraestrutura enterprise: são processos escritos e testados.

---

## 36. Scalability

100 → 10.000+ visitantes/dia: como a maior parte do tráfego é HTML estático/cacheado servido pela CDN, o banco só é tocado em **revalidações, busca, admin e envio de formulários**. Sem reconstruir:

| Gargalo provável                  | Sinal                           | Passo                                                          |
| --------------------------------- | ------------------------------- | -------------------------------------------------------------- |
| Conexões ao Postgres (serverless) | Erros de conexão em pico        | _Pooling_ do provedor, limitar `max` de conexões por instância |
| Busca                             | Latência da consulta FTS        | Índice GIN (já previsto), depois revisar pesos/limites         |
| Imagens                           | Custo/tempo de otimização       | CDN de imagens, tamanhos pré-gerados                           |
| Listagens                         | Offset lento em tabelas grandes | Migrar para _cursor_ **naquela** listagem                      |
| Cron único                        | Jobs demorando                  | Dividir em rotas por tipo de tarefa                            |
| Envio de e-mail                   | Fila crescendo                  | Só então avaliar fila (pg-boss) — não antes                    |

Não se projeta infraestrutura para milhões de usuários.

---

## 37. Cost Considerations

Sem valores em reais/dólares: **não os verifiquei** e preços mudam. O que orienta custo (Prompt 3 §78):

| Componente                     | Direcionador de custo                                | Como manter baixo                                           |
| ------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| Hospedagem                     | Invocações de função, banda, transformação de imagem | Estático + cache; tamanhos de imagem controlados            |
| Banco                          | Computação ativa e armazenamento                     | Consultas indexadas; _pooling_; sem dados binários no banco |
| Storage                        | Armazenamento e saída (_egress_)                     | CDN na frente; imagens reprocessadas e leves                |
| E-mail                         | Volume de envios                                     | Só notificações e confirmações no MVP                       |
| Ferramentas (erros, analytics) | Volume de eventos                                    | Adiar; começar pelos logs da plataforma                     |

**Ação:** cotar Vercel, provedor de Postgres, storage e Resend **no momento da decisão** e configurar alertas de gasto. Custo da alternativa B inclui horas de operação.

---

## 38. Project Structure

**Segue a sugestão do Prompt 3 §58** (`features/` e `src/db`, decisão de 21/09/2026), mantendo `server/` para infraestrutura transversal (env, logging, auth, permissões):

```text
src/
├── app/
│   ├── (public)/               # site público: /, /sobre, /solucoes, /blog, /contato …
│   ├── admin/                  # CMS (dinâmico, com nonce)
│   ├── api/                    # health [EXISTE], auth/[...all], cron/publish, preview, newsletter/*
│   ├── layout.tsx  not-found.tsx  error.tsx  global-error.tsx
│   ├── robots.ts [EXISTE]  sitemap.ts
│   └── globals.css [EXISTE]    # tokens do Design System
├── components/
│   ├── ui/  layout/  content/  forms/  sections/  templates/     # (pasta existe, vazia)
├── features/                   # domínios
│   └── <modulo>/{ domain/  application/  infrastructure/  schemas.ts  index.ts }
│       # modulos: content, catalog, people, pages, media, conversion, identity, platform
├── db/             # cliente Drizzle, schema (por módulo), utilitários de migration
├── server/
│   ├── env.ts [EXISTE]  logging/ [EXISTE]
│   ├── auth/       # configuração Better Auth, getSession, requireUser
│   ├── permissions/# can(user, action, resource)
│   ├── rate-limit/ storage/ email/ analytics/ jobs/
├── lib/  errors.ts [EXISTE]  result.ts [EXISTE]  slug.ts  reading-time.ts   # puro e isomórfico
drizzle/                        # migrations versionadas (SQL revisado)
tests/                          # integration/, e2e/, stubs/ [EXISTE]
scripts/                        # db-check [EXISTE], bootstrap-admin, seed-dev
docs/                           # blueprints, ADRs, runbooks
```

**Regras:** sem pasta `utils/` genérica; toda regra de negócio mora em `features/*/domain|application`; `src/lib` é só código puro e isomórfico (imposto por ESLint [EXISTENTE]). A escolha de `features/` e `src/db` está no ADR-013.

---

## 39. Migration Strategy

- **Ferramenta:** Drizzle Kit gera SQL a partir do schema TypeScript; o SQL gerado é **revisado e versionado** no repositório (`drizzle/`). Aplicação por comando explícito com `dm_owner` [VERIFICADO no fluxo `generate` + `migrate` da doc do Drizzle].
- **Nunca** criar/alterar tabela à mão. Toda mudança estrutural = uma migration reprodutível.
- **Padrão expandir → migrar → contrair:** adicionar coluna anulável → preencher → só numa release seguinte tornar obrigatória/remover. Nada de `DROP`/`ALTER … TYPE` destrutivo em uma etapa só em produção (Prompt 4 §68).
- **Reversão:** _forward-fix_ (nova migration que corrige) + backup antes de migration de risco. Migration reversível quando possível.
- **Privilégios:** uma das primeiras migrations cria o role `dm_app` e concede só o necessário (e nega `UPDATE`/`DELETE` em `audit_logs`).
- **Ambientes:** local (`npm run db:up` + migrate) → CI (banco efêmero) → staging (ensaio com dados parecidos) → produção (backup → migrate → deploy → verificação).

**Seeds (Prompt 3 §39):**

| Tipo                | Conteúdo                                                                                                                          | Onde roda                                                         |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| **Real (produção)** | Só o que é **confirmado**: as 7 categorias do Blueprint 1; o script de bootstrap do primeiro ADMIN                                | Todos os ambientes                                                |
| **Desenvolvimento** | Dados claramente fictícios: prefixo `[DEMO]` no título, flag `is_demo`, e-mails `@example.test`; nada apresentado como dado da DM | **Só `development`/`test`** (o script recusa rodar em production) |

**Proibido em qualquer seed:** clientes, depoimentos, especialistas, números, certificações ou resultados inventados.

---

## 40. ADR List

Registros a criar em `docs/adr/` (formato: contexto, decisão, alternativas, consequência). Status: **Aceita** (já refletida no código), **Proposta** (a aprovar), **Aberta** (depende da DM).

| ADR     | Título                                                  | Status     | Resumo                                                                                          |
| ------- | ------------------------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------- |
| ADR-001 | Monólito modular em Next.js                             | Aceita     | Um deploy, fronteiras por módulo, sem microserviços                                             |
| ADR-002 | PostgreSQL + Drizzle ORM 0.45.x                         | Aceita     | Relacional, migrations SQL; 1.0 só após estável                                                 |
| ADR-003 | Unificação de Soluções                                  | Aceita     | `solutions.type` + `solution_items`; sem `/servicos` próprio                                    |
| ADR-004 | Arquitetura do CMS                                      | Aceita     | Tiptap em JSON, allowlist, máquina de estados, templates de página                              |
| ADR-005 | Autenticação com Better Auth e sessões em banco         | Aceita     | Cadastro fechado, 2FA, sem auth caseira                                                         |
| ADR-006 | RBAC de 3 papéis + propriedade, negado por padrão       | Proposta   | `can(...)` no servidor; 404 para invisíveis                                                     |
| ADR-007 | Cache Components e invalidação por tag                  | Proposta   | `use cache` + `cacheTag`; `updateTag`/`revalidateTag(tag,'max')`                                |
| ADR-008 | Mídia: `StoragePort` + reprocessamento com sharp        | Proposta   | Sem SVG de usuário; magic bytes                                                                 |
| ADR-009 | CSP em duas camadas e cabeçalhos de segurança           | Proposta   | Público sem nonce (estático); admin com nonce. **É a referência já citada em `next.config.ts`** |
| ADR-010 | Pipeline de leads e atribuição mínima                   | Proposta   | Servidor valida tudo; first-touch atrás de _flag_ até parecer jurídico                          |
| ADR-011 | Newsletter com duplo aceite                             | Proposta   |                                                                                                 |
| ADR-012 | Busca por Postgres FTS e paginação por offset           | Proposta   |                                                                                                 |
| ADR-013 | Estrutura `features/` e `src/db` (segue o Prompt 3 §58) | Aceita     | Decidido em 21/09/2026: renomeado de `modules/`; regras de ESLint e README atualizados          |
| ADR-014 | Plataforma de deploy, banco e storage                   | **Aberta** | Recomendação A (seção 34)                                                                       |
| ADR-015 | Rate limit em Postgres                                  | Proposta   | Janela fixa, sem serviço extra                                                                  |
| ADR-016 | Resolução de redirecionamentos na página, não no Proxy  | Proposta   |                                                                                                 |
| ADR-017 | Falha para o lado seguro em ambiente                    | Aceita     | `APP_ENV` explícito em produção; `robots` fechado fora dela                                     |

---

## 41. Security Checklist

Situação em 21/09/2026: ✔ feito · ◐ parcial · ☐ pendente.

| Item                                                                                             | Situação | Onde                              |
| ------------------------------------------------------------------------------------------------ | :------: | --------------------------------- |
| Segredos fora do repositório; `.env.local` ignorado e com permissão restrita                     |    ✔     | Fase 1                            |
| Redação de segredos no logger                                                                    |    ✔     | Fase 1                            |
| Mensagens de erro sem detalhes internos                                                          |    ✔     | Fase 1                            |
| Cabeçalhos básicos (nosniff, referrer, permissions, frame)                                       |    ✔     | Fase 1                            |
| `APP_ENV` obrigatório em produção; `robots` fechado fora de produção                             |    ✔     | Esta etapa                        |
| `npm audit` sem vulnerabilidades; versões exatas                                                 |    ✔     | Fase 1                            |
| CSP (duas camadas) e HSTS                                                                        |    ☐     | Fase de segurança                 |
| Autenticação: cadastro fechado ✔, sessão em banco ✔, guarda de origem ✔, **2FA ☐**               |    ◐     | 2FA na fase do CMS                |
| Autorização: `can(...)` e matriz testadas (75 casos) ✔; **aplicar em cada ação e testar IDOR ☐** |    ◐     | Fase do CMS                       |
| Validação Zod em toda entrada; limites de tamanho                                                |    ◐     | `env.ts` apenas                   |
| Rate limit: login ✔ (5 falhas/15 min); **contato, newsletter, upload ☐**                         |    ◐     | Fases CMS/Leads                   |
| Upload seguro (magic bytes, `sharp`, sem SVG)                                                    |    ☐     | Fase do CMS                       |
| Editor sem HTML arbitrário; protocolos de link restritos                                         |    ☐     | Fase do CMS                       |
| `audit_logs` append-only com role sem `UPDATE`/`DELETE`                                          |    ☐     | Fase de banco                     |
| Preview não indexável e sem vazamento de rascunho                                                |    ☐     | Fase do CMS                       |
| Rota de cron protegida por segredo                                                               |    ☐     | Fase do CMS                       |
| Backups testados por restauração                                                                 |    ☐     | Fase de deploy                    |
| Varredura de segredos e revisão de dependências no CI                                            |    ◐     | `npm audit` no CI; resto pendente |
| Política de Privacidade e retenção definidas (jurídico)                                          |    ☐     | **Bloqueio da DM (L-11)**         |
| Teste de intrusão antes do lançamento                                                            |    ☐     | Fase de testes                    |

---

## 42. Technical Risks

| Risco                                                                                                            | Efeito                                 | Mitigação                                                                                      |
| ---------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Next 16 tem mudanças que fogem do conhecimento comum (Proxy, `revalidateTag` com 2º argumento, Cache Components) | Código escrito "de memória" quebra     | **Ler a doc embutida** (`node_modules/next/dist/docs`) antes de cada uso; build a cada mudança |
| Cache Components é recente                                                                                       | Erros de _prerender_ inesperados       | Adoção página a página; testes de build; plano de recuo ao modelo anterior                     |
| Better Auth é jovem e muda rápido                                                                                | Quebra em atualização                  | Versão exata, changelog, testes de autenticação, autorização própria                           |
| Drizzle 1.0 em RC                                                                                                | Migração futura                        | Fixar 0.45.x; ADR para reavaliar na 1.0 estável                                                |
| CSP pública com `unsafe-inline`                                                                                  | Defesa de XSS menos rígida             | Conteúdo sem HTML arbitrário + demais diretivas; reavaliar SRI                                 |
| Sem conteúdo real (especialistas, soluções, fotos, textos)                                                       | Site vazio ou tentação de inventar     | Regras "dado ausente = seção ausente"; seeds só `[DEMO]` e só em dev                           |
| LGPD/jurídico indefinido                                                                                         | Bloqueio do rastreio e da coleta       | _Flag_ de atribuição; coleta mínima; texto real a cargo da DM                                  |
| Conexões de banco em ambiente serverless                                                                         | Falhas em pico                         | _Pooling_; limite de conexões                                                                  |
| Limites do agendador do provedor                                                                                 | Publicação agendada atrasada           | Verificar plano; job idempotente; alerta de job parado                                         |
| `sharp` usa binário nativo                                                                                       | Falha de instalação por plataforma     | Fixar versão, testar no CI e no deploy                                                         |
| Extensões do Postgres (`unaccent`, `citext`) indisponíveis                                                       | Busca/e-mail sem acento/caixa          | Verificar no provedor antes de decidir                                                         |
| Dependência de uma pessoa (ou agente) para manter                                                                | Risco de continuidade                  | Documentação (este conjunto de blueprints, ADRs, runbooks) e testes                            |
| Fase 1 declarada concluída mas incompleta frente ao Prompt 4 §9                                                  | Surpresa na fase de banco/autenticação | Item "Fase 1b" no plano (Project Audit)                                                        |

---

## 43. Open Decisions

**Conflitos entre os prompts e o que existe (Prompt 3 §88):**

| Conflito                                                                                                                             | Impacto                          | Opções                                               | Recomendação                                                                          | Decisão necessária        |
| ------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------- | ------------------------- |
| Prompt 3 sugere `features/`; o repositório usava `modules/`                                                                          | Renomear pastas e regras de lint | (A) manter `modules/`; (B) renomear para `features/` | **B, decidido em 21/09/2026** (pasta ainda vazia: custo mínimo)                       | Decidido                  |
| Prompt 3 sugere `src/db`; o repositório usava `src/server`                                                                           | Local do cliente/schema          | (A) `src/server/db`; (B) `src/db`                    | **B, decidido em 21/09/2026**                                                         | Confirmação               |
| Prompt 3 lista `authors`; Blueprint 1 D5 unifica autor = especialista                                                                | Uma tabela a menos               | (A) `specialists` com `kind`; (B) `authors` separada | **A**                                                                                 | Aprovar D5 do Blueprint 1 |
| `/servicos` (Prompt 1) × entidade única (Prompt 3, §8)                                                                               | URLs e menu                      | (A) só `/solucoes`; (B) duas árvores                 | **A**                                                                                 | Aprovar D1 do Blueprint 1 |
| Prompt 4 §11 pede Badge e Modal; Blueprint 2 os removeu                                                                              | Componentes a construir          | (A) seguir o Design System; (B) incluir              | **A** (Prompt 4 §81: decisão local não destrói a global)                              | Confirmação               |
| Prompt 4 §25 propõe outra ordem de Home ("Conteúdo → Sobre → Soluções…") que a do Blueprint 1                                        | Estrutura da Home                | (A) Blueprint 1; (B) Prompt 4                        | **A** (o próprio §25 diz "não trate como dogma; use o Prompt 1")                      | Confirmação               |
| Campos do contato: Prompt 4 §31 (nome, e-mail, telefone, empresa, interesse, mensagem) × Prompt 1 §21 (inclui cargo, site, segmento) | Formulário e tabela `leads`      | (A) união com opcionais; (B) só os do Prompt 4       | **A** com 3 obrigatórios (Blueprint 1, D3). Cortar `site`/`segmento` se a DM não usar | Decisão da DM             |
| Numeração de fases do Prompt 4: §8 (12 fases) × títulos de seção (FASE 2 = Banco …) × §77 (18 etapas)                                | Ordem e contagem                 | Usar a lista do §8 como fases e o §77 como sequência | Ver seção 45                                                                          | Confirmação               |
| Prompt 3 chama o segredo de `AUTH_SECRET`; a biblioteca usa `BETTER_AUTH_SECRET`                                                     | Nome de variável                 | Usar o da biblioteca                                 | Usar o da biblioteca                                                                  | Nenhuma                   |

**Decisões abertas (prioridade, §89):**

| ID   | Decisão                                              | Opções                                        | Recomendação                     | Prioridade  | Quem decide   |
| ---- | ---------------------------------------------------- | --------------------------------------------- | -------------------------------- | ----------- | ------------- |
| T-01 | Plataforma de deploy                                 | Vercel + gerenciado × VPS                     | Vercel + gerenciado              | **CRÍTICA** | DM + eng.     |
| T-02 | Provedor de Postgres (região, PITR, extensões)       | Neon × Supabase × outro                       | Verificar e decidir com dados    | **CRÍTICA** | Engenharia    |
| T-03 | Provedor de storage                                  | S3-compatível × storage do provedor de deploy | S3-compatível atrás de interface | IMPORTANTE  | Engenharia    |
| T-04 | Quem vê leads (ADMIN só, ou EDITOR)                  | ADMIN × ADMIN+EDITOR                          | ADMIN                            | IMPORTANTE  | DM            |
| T-05 | 2FA obrigatório para ADMIN/EDITOR                    | Sim × opcional                                | Obrigatório antes de leads reais | IMPORTANTE  | DM            |
| T-06 | Atribuição _first touch_ (cookie)                    | Ligar × só _last touch_                       | Desligado até parecer jurídico   | IMPORTANTE  | DM + jurídico |
| T-07 | Retenção de leads, assinantes e `audit_logs`         | Prazos                                        | A definir com jurídico           | IMPORTANTE  | DM + jurídico |
| T-08 | Ferramenta de rastreio de erros                      | Nenhuma no início × Sentry                    | Começar pelos logs da plataforma | RECOMENDADA | Engenharia    |
| T-09 | Ferramenta de analytics                              | Nenhuma × sem cookie × GA4                    | Sem cookie, depois               | FUTURA      | DM            |
| T-10 | Adoção de `cacheComponents` (e migração do `robots`) | Sim × modelo anterior                         | Sim, ao iniciar páginas públicas | IMPORTANTE  | Engenharia    |
| T-11 | Domínio e e-mail de envio (SPF/DKIM/DMARC)           | —                                             | Antes do 1º e-mail real          | IMPORTANTE  | DM            |
| T-12 | Envio de newsletter (ferramenta e frequência)        | —                                             | Fora do MVP                      | FUTURA      | DM            |

Somam-se as decisões do Blueprint 1 (D1–D7) e as lacunas L-01 a L-16, que **continuam bloqueando conteúdo**, não arquitetura.

---

## 44. MVP vs Future

| Área               | MVP                                                                                          | Segunda fase                                    | Futuro                                         |
| ------------------ | -------------------------------------------------------------------------------------------- | ----------------------------------------------- | ---------------------------------------------- |
| Público            | Home, Sobre, Especialistas, Soluções, Blog (índice, categoria, artigo), Contato, legais, 404 | Busca (com volume), páginas de tag (se úteis)   | Cases, eventos, materiais, newsletter dedicada |
| CMS                | CRUD, estados, agendamento, preview, SEO, mídia, redirecionamentos                           | Autosave, revisões, comentários de revisão      | Fluxos de aprovação avançados                  |
| Identidade         | Better Auth, 3 papéis, 2FA                                                                   | Alertas de login novo                           | SSO, se houver equipe maior                    |
| Conversão          | Lead com anti-spam, notificação por e-mail, newsletter com duplo aceite                      | Painel de leads com filtros                     | Integração com CRM                             |
| Dados              | Tabelas da seção 7, auditoria                                                                | `post_revisions`, `lead_events` (se justificar) | Data warehouse                                 |
| Observabilidade    | Logs, health, alerta de cron                                                                 | Rastreio de erros                               | Métricas e _tracing_                           |
| Analytics          | Interface + adaptador nulo                                                                   | Ferramenta sem cookie                           | Funil completo                                 |
| Infra              | 3 ambientes, backups testados                                                                | Testes de carga                                 | Multirregião                                   |
| **Fora de escopo** | Microserviços, filas distribuídas, Elasticsearch, tempo real, IA generativa, page builder    | —                                               | —                                              |

---

## 45. Implementation Roadmap

Fases do Prompt 4 §8, com **estado real do repositório** (detalhe no [Project Audit](./04-project-audit-and-plan.md)):

| Fase | Nome             | Entregas principais                                                                                                                                                                     | Estado                                                                                                                                                | Critério de saída                                            |
| ---- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| 1    | Fundação técnica | TS, lint, formatação, env, erros, logger, testes; **cliente de banco e configuração de autenticação**                                                                                   | **Concluída em 21/09/2026 (1b)**: cliente de banco, role `dm_app`, migrations, autenticação (esqueleto) e `can()`. Falta só o 2FA e as telas (Fase 4) | `npm run check` verde + conexão do app ao banco por `dm_app` |
| 2    | Design System    | Tokens, fontes, Container/Heading/Button/Link/Field, RichText base, estados                                                                                                             | Não iniciada                                                                                                                                          | Página de referência dos componentes; teste de contraste     |
| 3    | Banco e domínio  | Schema Drizzle, migrations, roles, seed de dados confirmados, regras de domínio puras e serviços de artigo (transição de estado, mudança de slug com redirecionamento), leitura pública | **Concluída em 21/09/2026** (77 testes de integração em Postgres real; 4 mutações críticas derrubam testes)                                           | Migrations reproduzíveis; constraints testadas               |
| 4    | CMS              | Auth + 2FA, `can(...)`, CRUD, editor Tiptap, estados, preview, mídia, auditoria                                                                                                         | Não iniciada                                                                                                                                          | Matriz de permissões 100% testada, incluindo IDOR e upload   |
| 5    | Páginas públicas | Home, Sobre, Especialistas, Soluções, Contato + cache por tag                                                                                                                           | Não iniciada                                                                                                                                          | Build estático + regras "dado ausente = seção ausente"       |
| 6    | Blog/editorial   | Índice, categoria, artigo, relacionados, busca (quando aplicável), paginação                                                                                                            | Não iniciada                                                                                                                                          | Rascunho nunca vaza (testado)                                |
| 7    | Leads            | Pipeline completo, newsletter, e-mail, rate limit, anti-spam                                                                                                                            | Não iniciada                                                                                                                                          | Testes negativos de spam, duplicidade e falha de e-mail      |
| 8    | SEO              | Metadata com fallback, sitemap, JSON-LD, redirecionamentos, 404, `robots` via `connection()`                                                                                            | Não iniciada                                                                                                                                          | Validação de dados estruturados; sitemap só com público      |
| 9    | Segurança        | CSP duas camadas, HSTS, auditoria completa da lista da seção 41, teste de intrusão                                                                                                      | Não iniciada                                                                                                                                          | Checklist da seção 41 sem ☐ crítico                          |
| 10   | Performance      | Medição e ajuste contra os orçamentos da seção 26                                                                                                                                       | Não iniciada                                                                                                                                          | Métricas registradas dentro dos alvos                        |
| 11   | Testes           | Suíte E2E e de acessibilidade; regressões                                                                                                                                               | Parcial (unitários da Fase 1)                                                                                                                         | Fluxos críticos cobertos                                     |
| 12   | Deploy           | Ambientes, migrations em pipeline, backups testados, pós-deploy                                                                                                                         | Não iniciada                                                                                                                                          | Restore testado; _rollback_ ensaiado                         |

**Contagem:** dos 12 marcos do Prompt 4 §8, o 1 está **parcialmente** concluído e restam **11 não iniciados** (na prática 11 mais a conclusão da 1b). Acessibilidade, QA e verificação pós-deploy do §77 são transversais e entram como critério de saída de cada fase.

**Bloqueios de conteúdo (não de código):** as fases 5, 6 e 8 constroem estrutura e regras de ausência com dados `[DEMO]`; o **lançamento** depende das lacunas L-02 a L-11 do Blueprint 1.

**Regra por fase (Prompt 4 §52):** ao fim de cada uma, `lint` → `typecheck` → testes → `build` → revisão do diff → checagem de regressão; commits pequenos; nenhuma fase começa sem a anterior verde.
