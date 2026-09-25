# Instruções para o agente que continua o DM Empresarial (Fases 9 → 12)

Você vai continuar a implementação de um projeto que tem as **Fases 1, 2, 3, 5, 6 e 8 prontas**, as
**Fases 4, 7, 9 e 11 parciais** (com pendências pontuais registradas abaixo) e as **Fases 10 e 12
pendentes**. Este documento é o plano de execução das fases restantes, com foco em **9 → 10 → 11 →
12**. Leia-o inteiro antes de mexer em qualquer coisa. Ele substitui qualquer versão anterior deste
arquivo (que tratava da Fase 5, já concluída).

## 0. O que é o projeto

Site institucional + blog + CMS da DM Empresarial (consultoria em Frutal/MG). Next.js 16.3.5 (App
Router), React 19, TypeScript 6 estrito, Tailwind 4, PostgreSQL + Drizzle 0.45.3, Better Auth 1.7.5,
Tiptap 3, Vitest 5.

Leia nesta ordem antes de codificar:

1. `docs/01-product-ux-blueprint.md` — produto, páginas, regras de publicação.
2. `docs/02-design-system-blueprint.md` — cores, tipografia, componentes.
3. `docs/03-engineering-architecture-blueprint.md` — arquitetura, banco, segurança, cache. **Seção
   41** (checklist de segurança) e **seção 45** (roadmap) foram reconferidas em 23/09/2026 contra o
   código real — confie nelas. Seções 26 (performance), 31 (testes), 32 (CI/CD), 33 (ambientes), 34
   (deploy), 35 (backup) têm os critérios de aceite de cada fase restante.
4. `fases` (raiz, **nunca commitado**) — tabela de estado das 12 fases, reavaliada em 23/09/2026.

## 1. Regras que não se negociam (herdadas das fases anteriores)

- **Nunca invente conteúdo da DM**: clientes, depoimentos, números, especialistas, telefone, e-mail.
  Dado ausente = seção ausente.
- **Next.js 16 é diferente do que você conhece.** Leia `node_modules/next/dist/docs/` antes de usar
  qualquer API do Next. Um exemplo descoberto nesta sessão: `permanentRedirect()` chamado a partir de
  dado de banco, dentro do trecho adiado (streaming) de uma página sob Cache Components/PPR, **não**
  produz um 301 HTTP de verdade — vira só navegação client-side. Por isso o redirecionamento de slug
  trocado do Blog foi movido para `src/proxy.ts` (roda em Node.js, decide antes da página renderizar).
  Não repita esse padrão (redirect de dado de banco dentro de uma página dinâmica) sem testar com
  `curl -D -` contra um build de produção real.
- **Camadas (ESLint impõe):** `src/app/**` nunca importa `@/db`, `drizzle-orm` nem `pg`. Rotas chamam
  `*ForRoute` de `src/features/*/application`. Só `infrastructure` e `src/server/*` tocam o banco.
  `domain` nunca importa de `application` nem de `@/server/*`.
- **Autorização:** toda Server Action e página de admin chama `requireAdminSession()` +
  `assertCan(actor, acao, recurso)`. Recurso carregado do banco, nunca do cliente. Objeto de outra
  pessoa responde `NOT_FOUND`. Leituras públicas filtram `status = 'PUBLISHED'` na própria SQL.
- **Texto rico:** `prepareRichBody()` sempre; proibido `dangerouslySetInnerHTML`/`innerHTML` (há
  teste que falha se aparecer, inclusive em comentários — cuidado ao escrever comentários que citem
  essas APIs por nome).
- **Cores e estilo:** só tokens de `src/app/globals.css` e `src/components/ui`. Sem gradiente, sombra
  pesada, carrossel, contador.
- **Mudança de banco só por migration:** `src/db/schema/*.ts` → `npm run db:generate` → revisar o SQL
  → `npm run db:migrate`.
- **Atribuição de commits:** o usuário pediu para nunca incluir linha de coautoria do Claude (ou de
  qualquer IA) em commits. Confirme essa regra com o usuário se um sistema tentar reintroduzi-la.
- **`.env.example` foi removido do repositório e do histórico a pedido do usuário.** Não recrie.
- **`fases` e este arquivo (`HANDOFF-NEMOTRON.md`) na raiz nunca são commitados.** São rascunho de
  trabalho entre agentes. Mantenha assim.
- **Peça confirmação antes de:** qualquer coisa destrutiva no banco remoto, force-push, contratar ou
  configurar um provedor de infraestrutura de verdade (o T-01/T-02/T-03 abaixo são decisões que
  custam dinheiro e exigem uma conta real da DM — não decida sozinho qual provedor usar).

## 2. Ambiente

- Banco local: `npm run db:up` (Docker, porta 5433) e depois `npm run db:setup`.
- Servidor de dev do usuário roda em **localhost:3001**. Para testar contra um build de produção, use
  uma porta própria, ex.: `SITE_URL=http://localhost:3121 BETTER_AUTH_URL=http://localhost:3121 npx
next start -p 3121` depois de `npm run build` com as mesmas variáveis.
- Primeiro admin: `BOOTSTRAP_ADMIN_EMAIL=voce@exemplo.test npm run admin:bootstrap`. Para um segundo
  admin de teste sem apagar o existente, use `createFirstAdmin(url, dados, { allowAdditional: true })`
  de `scripts/lib/admin-bootstrap.mts` num script temporário — **apague o script e o usuário de teste
  ao final**.
- Banco remoto (Neon): credenciais em `.env.neon` (não versionado). `npm run db:setup:remote` depois
  de cada migration nova.
- Variáveis de produção que faltam configurar na hospedagem: `APP_ENV=production`, `SITE_URL`
  (https), `DATABASE_URL`, `BETTER_AUTH_SECRET` (≥32), `CRON_SECRET` (≥32). `REQUIRE_2FA` deve ficar
  **sem definir** (padrão `true`; não pode ser `false` em produção — `env.ts` recusa).

## 3. Portão obrigatório antes de cada commit (não mudou)

```bash
npm run format:check && npm run check        # lint + typecheck + testes unitários + build
npm run test:integration                     # Postgres real (banco de teste separado)
npm audit                                    # 0 vulnerabilidades
npm run db:verify                            # se mexeu em migration
```

Hoje: **414 testes unitários e 248 de integração passando localmente.** Não deixe esses números cair.

**Atenção crítica descoberta em 23/09/2026:** o CI remoto (`gh run list`) falhou em **10 de 10**
execuções desde que foi criado, incluindo o commit mais recente. O job `check` roda `npm run build`
sem `DATABASE_URL` no ambiente, e páginas que leem o banco no *prerender* (`/blog/[slug]`,
`/admin/especialistas/[id]`, etc.) quebram o build. **Isso é o primeiro item da Fase 12** — não é
culpa de nenhum código de fase anterior, é configuração do workflow. Ver Fase 12, Etapa 1.

**Verifique a interface num navegador de verdade** contra um **build de produção**
(`mcp__chrome-devtools__*`), sem erros de console nem violações de CSP. Ao final de qualquer
verificação manual: pare o servidor de teste, apague dados/usuários de teste do banco, apague
scripts `scripts/tmp-*.mts` temporários.

## 4. Estado atual por fase (resumo — detalhe em `fases` e em `docs/03` §41/§45)

| # | Fase | Estado | Pendência registrada |
|---|------|:------:|------------------------|
| 1 | Fundação técnica | 🟢 | — |
| 2 | Design System | 🟢 | — |
| 3 | Banco e domínio | 🟢 | — |
| 4 | CMS | 🟡 | Preview de rascunho não existe (não bloqueia 9–12, mas fica registrado) |
| 5 | Páginas públicas | 🟢 | — |
| 6 | Blog/editorial | 🟢 | — |
| 7 | Leads | 🟡 | Newsletter com duplo aceite não existe (schema pronto, sem feature) |
| 8 | SEO | 🟢 | Ponto de referência desta reavaliação (23/09/2026) |
| **9** | **Segurança** | 🟡 | **Ver Fase 9 abaixo** |
| **10** | **Performance** | 🔴 | **Ver Fase 10 abaixo** |
| **11** | **Testes** | 🟡 | **Ver Fase 11 abaixo** |
| **12** | **Deploy** | 🔴 | **Ver Fase 12 abaixo** |

**Não reabra as fases 1–8.** Elas estão funcionalmente prontas e verificadas (testes + navegador
real). As duas pendências pontuais das fases 4 e 7 (preview, newsletter) **não bloqueiam** o início
da Fase 9 — só entre nelas se o usuário pedir explicitamente, ou se alguma das fases 9–12 depender
delas (nenhuma depende: confirmado abaixo).

---

## FASE 9 — Segurança

### Objetivo

Fechar o checklist de segurança de `docs/03` §41 até não sobrar nenhum item ☐ que dependa só de
código (os itens que dependem da DM — política de privacidade/retenção jurídica, L-11 — continuam
fora do seu controle; registre-os como bloqueio de conteúdo, não tente resolvê-los).

### Estado atual

Prontos: CSP em duas camadas (nonce em `/admin`, fixa em público — `src/proxy.ts`,
`src/server/security/csp.ts`), 2FA obrigatório para ADMIN/EDITOR, upload seguro (MIME real, sem SVG,
`sharp`, limites), `audit_logs` append-only (`REVOKE` de `dm_app`), rate limit de login e de
lead/contato (`rate_limits`, por IP e por e-mail), rota de cron protegida por segredo em tempo
constante, cabeçalhos básicos (nosniff, referrer, permissions, frame).

Faltando: HSTS, rate limit de upload de mídia, varredura sistemática de IDOR por rota (hoje só há
teste de propriedade/BOLA em `src/server/permissions/permissions.test.ts`, não uma varredura
end-to-end por rota pública e de admin), varredura de segredos e revisão de dependências no CI, teste
de intrusão formal. A newsletter (Fase 7) não existe ainda, então "rate limit de newsletter" não se
aplica — não crie a feature aqui, só documente que o item fica pendente até a Fase 7 fechar.

### O que falta

1. HSTS.
2. Rate limit no upload de mídia (`/admin/midia`, Server Action de upload).
3. Varredura sistemática de IDOR: cada rota que recebe um ID (slug ou UUID) precisa de um teste que
   tenta acessar um recurso de outro ator/tipo errado e confirma `NOT_FOUND` (nunca `FORBIDDEN` — a
   regra já documentada é "não revelar existência").
4. Varredura de segredos no CI (ex.: `gitleaks` ou equivalente) e revisão de dependências (ex.:
   `npm audit` já roda; considere um passo de revisão de licenças/dependências novas em PR — decisão
   de ferramenta é sua, mas documente a escolha em `docs/03` ADR).
5. Teste de intrusão: um roteiro manual (ou semi-automatizado) cobrindo o catálogo de `docs/03` §31
   (autenticação, autorização, estados, conteúdo público, entrada, XSS, upload, rate limit,
   concorrência, resiliência, privacidade) — não precisa ser uma ferramenta comercial, mas precisa ser
   **executado e registrado**, não só planejado.

### Dependências

Nenhuma dependência de fases restantes. Pode começar imediatamente. **HSTS depende de HTTPS estar
configurado no ambiente de destino** — em `localhost`/`next start` sem TLS, o cabeçalho pode ser
emitido mas não terá efeito prático; isso é esperado, não é bug. A validação real de HSTS só acontece
depois que a Fase 12 tiver um ambiente com HTTPS de verdade — registre isso e não bloqueie a Fase 9
por causa disso (o cabeçalho pode e deve ser configurado agora; só o *teste em produção com HTTPS*
fica condicionado à Fase 12).

### Arquivos e áreas envolvidas

- `next.config.ts` (cabeçalho HSTS, junto dos `securityHeaders` existentes).
- `src/features/media/application/upload-media.ts` (ou onde a Server Action de upload vive) +
  `src/features/conversion/infrastructure/rate-limit-repository.ts` (reutilizar `windowedKey`/
  `consumeRateLimit`, já testados e usados pelo pipeline de lead).
- Novo arquivo de teste de integração, ex. `tests/integration/idor-sweep.test.ts`, cobrindo rotas
  públicas (blog, soluções, especialistas, páginas) e Server Actions de admin (artigos, categorias,
  especialistas, soluções, páginas, mídia, usuários) com um segundo registro pertencente a outro
  "dono" quando aplicável.
- `.github/workflows/ci.yml` (varredura de segredos/dependências — cuidado: **não mexa no problema do
  `DATABASE_URL` aqui**, isso é Fase 12 Etapa 1; se você chegar à Fase 9 antes da 12, ainda pode
  adicionar os passos de segurança ao workflow, só não espere que o job `check` passe até a Fase 12
  corrigir isso).
- `docs/03-engineering-architecture-blueprint.md` §41 (marcar itens ✔ conforme fechar).

### Sequência de execução

#### Etapa 1 — HSTS

- Objetivo: adicionar `Strict-Transport-Security` aos cabeçalhos já emitidos por `next.config.ts`.
- Tarefas: leia `node_modules/next/dist/docs` por "headers" e "Strict-Transport-Security" para
  confirmar a sintaxe atual do Next 16 (não assuma — a doc embutida é a fonte de verdade). Adicione ao
  array `securityHeaders` algo equivalente a `max-age=63072000; includeSubDomains; preload` — mas
  **antes de incluir `preload`, avalie com o usuário**: entrar na lista de preload do navegador é uma
  decisão de longo prazo e difícil de reverter (documente a recomendação, não decida sozinho se o
  domínio real da DM ainda não está definido — L-02 do Blueprint 1 já registra isso como lacuna).
- Arquivos: `next.config.ts`.
- Cuidado: não emita HSTS incondicionalmente em `development` sem necessidade — confirme se o array
  `securityHeaders` já é aplicado só em produção ou sempre (leia o código antes de mudar; hoje ele é
  aplicado sempre, o que é seguro para os cabeçalhos atuais, mas HSTS em `http://localhost` não tem
  efeito nenhum, então não há risco em mantê-lo incondicional — só não gaste tempo tentando "testar"
  HSTS em dev, ele é inerte sem TLS).
- Resultado esperado: `curl -I` contra um build local mostra o cabeçalho; teste unitário (se já existe
  um teste de `next.config.ts`/headers, estenda-o; veja `tests/next-config.test.ts` mencionado no
  Project Audit).

#### Etapa 2 — Rate limit de upload

- Objetivo: impedir abuso do endpoint de upload de mídia (hoje sem limite, ao contrário de login e
  lead).
- Tarefas: leia como `submitLead` (`src/features/conversion/application/submit-lead.ts`) usa
  `consumeRateLimit`/`windowedKey` e replique o padrão na Server Action de upload — decida a janela
  (ex.: N uploads por minuto por sessão de admin) com base no que já existe de precedente no projeto,
  não invente um número sem justificativa; documente a escolha num comentário.
- Arquivos: a Server Action de upload em `src/app/admin/(painel)/midia/actions.ts` (confirme o
  caminho exato lendo a árvore atual) + reuso de `rate-limit-repository.ts`.
- Cuidado: upload é uma ação autenticada de admin (não anônima como o formulário de contato) — a
  chave do rate limit deve ser por usuário/sessão, não por IP (evite bloquear um escritório inteiro
  atrás do mesmo IP).
- Resultado esperado: teste de integração que faz N+1 uploads seguidos do mesmo usuário e confirma
  `RATE_LIMITED` no N+1.

#### Etapa 3 — Varredura de IDOR

- Objetivo: fechar a lacuna "aplicar em cada ação e testar IDOR" da checklist.
- Tarefas: para cada entidade com rota por ID/slug (artigos, categorias, especialistas, soluções,
  páginas, mídia, usuários — no admin; posts/soluções/especialistas/páginas — no público), escreva um
  caso de teste que tenta acessar um recurso que não pertence ao ator ou que está num estado que não
  deveria ser visível (rascunho por ator diferente, etc.) e confirma que a resposta é `NOT_FOUND`
  (nunca revela existência) ou, no caso de leitura pública de conteúdo não publicado, 404 real da
  rota.
- Arquivos: `tests/integration/idor-sweep.test.ts` (novo) ou distribua os casos nos arquivos de teste
  de integração já existentes por feature — escolha o que for mais consistente com o padrão atual do
  repositório (veja como os outros 17 arquivos de `tests/integration/` estão organizados antes de
  decidir).
- Cuidado: não duplique testes que já existem (ex.: `permissions.test.ts` já cobre BOLA a nível de
  `can()`) — o objetivo aqui é a varredura **por rota/Server Action**, não reprovar a mesma regra de
  novo no nível de domínio.
- Resultado esperado: uma lista explícita (no próprio arquivo de teste, como comentário ou nomes de
  `describe`) de quais rotas foram varridas, para que a próxima pessoa veja o que já está coberto.

#### Etapa 4 — CI: varredura de segredos e dependências

- Objetivo: fechar "varredura de segredos e revisão de dependências no CI" (hoje só `npm audit`).
- Tarefas: adicione um passo ao `.github/workflows/ci.yml` para varredura de segredos (ex.:
  `gitleaks-action` ou equivalente que rode sem precisar de conta paga) e considere um passo de
  revisão de dependências novas em PRs (o GitHub tem uma action oficial de "dependency review" para
  isso, mas confirme se o repositório é público ou privado — algumas features exigem GitHub
  Advanced Security em repositórios privados; **verifique antes de assumir que está disponível**).
- Arquivos: `.github/workflows/ci.yml`.
- Cuidado: **não misture esta etapa com a correção do `DATABASE_URL` (Fase 12, Etapa 1)** — são
  mudanças independentes no mesmo arquivo; faça commits separados para não confundir o diff.
- Resultado esperado: workflow com os novos passos; rode manualmente (`gh workflow run` ou um PR de
  teste) para confirmar que o passo novo executa (mesmo que o job inteiro ainda falhe por causa do
  `DATABASE_URL`, até a Fase 12 resolver isso).

#### Etapa 5 — Teste de intrusão

- Objetivo: executar (não só planejar) o catálogo de testes negativos de `docs/03` §31 como um
  roteiro de verificação manual/semi-automatizada.
- Tarefas: percorra cada linha da tabela de §31 (Autenticação, Autorização, Estados, Conteúdo
  público, Entrada, XSS, Upload, Rate limit, Concorrência, Resiliência, Privacidade) contra um build
  de produção local, registrando o resultado de cada item (passou/falhou/não aplicável, com evidência
  — print, log ou trecho de resposta HTTP). Onde já existe teste automatizado cobrindo o item, cite o
  arquivo de teste em vez de repetir manualmente.
- Arquivos: produza um relatório (ex.: `docs/05-security-review.md`, novo — siga o padrão dos outros
  documentos de `docs/`) com o resultado. Não precisa ser extenso, precisa ser **verificável**.
- Cuidado: isso é verificação, não implementação — se encontrar uma falha real durante o teste de
  intrusão, **pare, registre e corrija antes de marcar a Fase 9 como pronta**; não adie silenciosamente
  um achado crítico para depois.
- Resultado esperado: `docs/05-security-review.md` com todos os itens de §31 cobertos e a checklist de
  §41 sem nenhum ☐ que dependa só de código.

### Definition of Done — Fase 9

- [ ] HSTS emitido em todas as respostas (cabeçalho presente e testado).
- [ ] Rate limit de upload implementado e testado (integração).
- [ ] Varredura de IDOR cobrindo todas as rotas por ID/slug, pública e de admin, com teste automatizado.
- [ ] CI com passo de varredura de segredos e (se disponível no plano do repositório) revisão de dependências.
- [ ] `docs/05-security-review.md` criado com o resultado do teste de intrusão, item a item contra §31.
- [ ] `docs/03` §41 atualizada: nenhum ☐ restante que dependa só de código (os bloqueios de conteúdo/jurídico continuam ☐, documentados como tal).
- [ ] Todo o portão da seção 3 verde (format, lint, typecheck, unit, integration, build, audit).
- [ ] Nenhuma funcionalidade das fases 1–8 quebrada (rode a suíte completa, não só os testes novos).

### O que validar antes de passar para a Fase 10

Rode o portão completo mais uma vez depois de todas as etapas (não confie em verificações
incrementais). Confirme que o build de produção ainda sobe sem erro de console/CSP no navegador em
pelo menos: Home, `/blog/[slug]`, `/admin` (login), `/admin/midia`. Só então comece a Fase 10.

---

## FASE 10 — Performance

### Objetivo

Medir (não estimar) as páginas reais contra os orçamentos de `docs/03` §26 (LCP ≤2,5s p75 móvel, INP
≤200ms p75, CLS ≤0,1 p75) e ajustar o que estiver fora do alvo. Definir o orçamento de JavaScript
inicial de rota pública, hoje marcado como "a definir após a medição da linha de base".

### Estado atual

Técnicas já em uso (Server Components por padrão, editor Tiptap só no admin, paginação com teto,
sem scripts de terceiros). **Nenhuma medição real existe** — os orçamentos são metas, não resultados
verificados.

### O que falta

1. Medir Web Vitals reais (não só Lighthouse de laboratório, que é proxy — mas comece por ele, é o
   que está disponível sem instrumentação de campo) em cada template público: Home, Sobre, Sobre →
   Especialista, Soluções, Solução → detalhe, Blog, Blog → categoria, Blog → artigo, Contato, páginas
   legais.
2. Definir o orçamento de JS inicial com base na medição de baseline.
3. Corrigir o que estourar o orçamento (a estratégia já está descrita em §26 — Server Components,
   `next/image`, `Suspense`, consultas sem N+1 — use essas ferramentas, não invente uma nova).
4. Registrar os números (não é suficiente "parecer rápido" — a seção 45 do roadmap exige "métricas
   registradas dentro dos alvos").

### Dependências

Nenhuma dependência de código de outras fases. Pode rodar em paralelo com a Fase 9 se quiser, mas a
ordem recomendada é 9 → 10 porque medir performance de páginas com CSP quebrada/rate limit ausente
mediria um estado que vai mudar de novo depois.

### Arquivos e áreas envolvidas

- Não há arquivo de "performance" dedicado ainda. As medições devem ser feitas contra um **build de
  produção real** (`npm run build` + `next start`), nunca `next dev` (o dev server tem overhead que
  não reflete produção).
- `mcp__chrome-devtools__performance_start_trace` / `performance_stop_trace` /
  `performance_analyze_insight` e `mcp__chrome-devtools__lighthouse_audit` (ferramentas já disponíveis
  no ambiente deste agente) são o caminho mais direto para medir sem instalar nada novo.
- Resultado deve ser registrado em `docs/03` §26 (substituindo "a definir após a medição da linha de
  base" pelos números reais) ou num novo `docs/06-performance-baseline.md`, à sua escolha — mas
  **registre em algum lugar versionado**, não deixe só no histórico da conversa.

### Sequência de execução

#### Etapa 1 — Build de produção e ambiente de medição

- Objetivo: ter um alvo estável para medir.
- Tarefas: `SITE_URL=http://localhost:3121 BETTER_AUTH_URL=http://localhost:3121 npm run build` →
  `next start -p 3121`. Garanta que o banco local tem conteúdo publicado suficiente para cada template
  renderizar de verdade (não medir uma página vazia por falta de dado — isso mediria o caminho errado).
  Se faltar conteúdo de teste, pergunte ao usuário antes de criar posts/soluções fictícios (mesmo que
  sejam de teste, marcados e removidos depois — não é "inventar conteúdo da DM", é dado de teste
  técnico, mas ainda assim confirme, porque o padrão da sessão é sempre perguntar antes de popular o
  banco de desenvolvimento com registros novos).
- Resultado esperado: servidor de produção local respondendo, com conteúdo real em todas as rotas
  listadas acima.

#### Etapa 2 — Medição de baseline

- Objetivo: números reais de LCP/INP/CLS e peso de JS por template.
- Tarefas: rode `mcp__chrome-devtools__lighthouse_audit` (ou trace de performance) em cada rota
  listada em "O que falta" item 1, em pelo menos duas larguras (móvel e desktop — os orçamentos de
  §26 são "p75 móvel", então priorize emulação móvel). Anote LCP, INP, CLS e o tamanho do JS
  carregado por rota.
- Resultado esperado: uma tabela com página × LCP × INP × CLS × JS inicial.

#### Etapa 3 — Definir o orçamento de JS e comparar contra os alvos

- Objetivo: fechar a lacuna "a definir após a medição da linha de base" de §26.
- Tarefas: com os números da Etapa 2, proponha um orçamento de JS inicial razoável (ex.: baseado no
  que as rotas mais leves já alcançam, deixando margem) e registre em §26. Compare cada template
  contra LCP/INP/CLS alvo.
- Resultado esperado: `docs/03` §26 com a linha "JavaScript inicial de rota pública" preenchida com um
  número, não mais "[a definir]".

#### Etapa 4 — Corrigir o que estourar o orçamento

- Objetivo: trazer para dentro do alvo qualquer template que tenha estourado LCP/INP/CLS/JS.
- Tarefas: aplique as técnicas já descritas em §26 (não introduza bibliotecas novas de otimização sem
  necessidade clara). Exemplos prováveis, dependendo do que a medição revelar: `next/image` com
  `sizes` corretos nas fotos de especialista/capa de post; `Suspense` ao redor de blocos dinâmicos que
  hoje bloqueiam a renderização; revisar se alguma consulta pública está fazendo N+1 (as leituras
  públicas já usam `use cache`/`cacheTag` da Fase 5 — confirme que isso está de fato evitando
  round-trips repetidos, não assuma).
- Cuidado: **não otimize prematuramente o que já está dentro do orçamento.** Meça de novo depois de
  cada correção para confirmar o ganho real, não estime.
- Resultado esperado: nova rodada de medição (repita a Etapa 2) confirmando que os templates
  corrigidos entraram no alvo.

#### Etapa 5 — Registro final

- Objetivo: deixar a métrica final documentada e reproduzível.
- Tarefas: consolide os números finais em `docs/03` §26 ou em `docs/06-performance-baseline.md`, com
  a data da medição e o build/commit medido (para que a próxima pessoa saiba se o número ainda é
  válido depois de mudanças futuras).
- Resultado esperado: documento versionado com os números reais, pronto para servir de referência em
  regressões futuras.

### Definition of Done — Fase 10

- [ ] Baseline medido (não estimado) em todos os templates públicos, mobile e desktop.
- [ ] Orçamento de JS inicial definido com base em dado real, preenchido em `docs/03` §26.
- [ ] LCP ≤2,5s, INP ≤200ms, CLS ≤0,1 (p75 móvel, ou a aproximação de laboratório disponível,
      documentada como tal) em cada template — ou desvio justificado e registrado, não escondido.
- [ ] Nenhuma regressão funcional introduzida pelas otimizações (rode o portão completo de novo).
- [ ] Resultado registrado em documento versionado.

### O que validar antes de passar para a Fase 11

Confirme que as mudanças de performance (se houve) não quebraram nenhum teste de integração nem
alteraram o comportamento de "dado ausente = seção ausente" (é comum uma otimização de `Suspense`
introduzir um estado de loading que, se mal implementado, aparece mesmo quando a seção deveria estar
ausente — teste esse caso explicitamente).

---

## FASE 11 — Testes

### Objetivo

Fechar a lacuna de testes de ponta a ponta (E2E) e de verificação automática de acessibilidade por
página, complementando (não substituindo) os 414 unitários + 248 de integração já existentes.

### Estado atual

Unitário e integração são fortes e já cobrem regras de domínio, permissões, repositórios,
constraints, rate limit. **Não existe nenhuma configuração de Playwright** (nem outra ferramenta de
E2E) no repositório — `package.json` não tem os scripts nem a dependência. **Não existe verificação
automática de acessibilidade por página** (o único teste de acessibilidade hoje é o de contraste
estático de tokens, `src/lib/color.test.ts`, que é unitário e não substitui uma varredura de página
renderizada).

### O que falta

1. Escolher e configurar a ferramenta de E2E — `docs/03` §31 já recomenda **Playwright + axe**. Este
   agente tem acesso a `mcp__playwright__*` como ferramenta externa de verificação manual, mas isso
   **não é o mesmo** que ter Playwright configurado como dependência de teste do projeto, rodando no
   CI. São coisas diferentes: a ferramenta MCP é para você verificar interativamente; o que falta é
   uma suíte de teste que continue existindo e rodando depois que você terminar.
2. Cobrir os fluxos críticos listados no MVP (§31): navegação pública, contato, login, criar/publicar
   artigo, admin sem sessão. Adapte a lista aos fluxos que hoje realmente existem (ex.: newsletter não
   existe ainda, não escreva E2E para ela).
3. Verificação automática de acessibilidade por página (axe integrado ao Playwright, rodando contra
   cada template público e as telas principais do admin).
4. Rodar o catálogo de testes negativos de §31 como suíte, onde ainda não estiver coberto por
   integração (parte disso já foi feito na Fase 9, Etapa 3 — não duplique).

### Dependências

**Depende da Fase 9 estar concluída** para os testes de segurança/IDOR não serem duplicados aqui —
se você chegar à Fase 11 e a Fase 9 ainda não tiver a varredura de IDOR, faça-a lá primeiro (a
varredura de IDOR é, por natureza, mais teste de integração/segurança do que E2E de fluxo de usuário).
Não depende da Fase 10.

### Arquivos e áreas envolvidas

- `package.json` (nova dependência de desenvolvimento, novo script `test:e2e`).
- Novo diretório `tests/e2e/` (siga o padrão de nomeação já usado em `tests/integration/`).
- `playwright.config.ts` (novo, na raiz).
- `.github/workflows/ci.yml` (novo job ou passo de E2E — só depois que a Fase 12, Etapa 1, corrigir o
  `DATABASE_URL` do job `check`, ou o E2E também vai falhar pelo mesmo motivo se depender de build).

### Sequência de execução

#### Etapa 1 — Configurar Playwright

- Objetivo: ter a ferramenta instalada e um teste de fumaça rodando.
- Tarefas: `npm install --save-dev @playwright/test` (confirme a versão mais recente estável no
  momento — não fixe uma versão antiga de memória) + `npx playwright install --with-deps` (ou
  equivalente; leia a documentação oficial do Playwright instalada em `node_modules` depois de
  instalar, o mesmo princípio de "não confiar em conhecimento antigo" vale aqui). Configure
  `playwright.config.ts` para rodar contra um build de produção local (`webServer` do Playwright pode
  subir `next start` automaticamente antes dos testes — use isso em vez de depender de um servidor já
  rodando).
- Arquivos: `package.json`, `playwright.config.ts`.
- Cuidado: instalar dependências é uma ação que o usuário pode querer revisar — se estiver em dúvida
  sobre isso ser autorizado neste momento da sessão, pergunte antes de rodar `npm install`.
- Resultado esperado: `npx playwright test` roda (mesmo que só com um teste trivial de fumaça,
  confirmando que a Home carrega).

#### Etapa 2 — Fluxos críticos públicos

- Objetivo: cobrir navegação pública e o formulário de contato de ponta a ponta.
- Tarefas: escreva testes E2E para: navegação Home → Soluções → detalhe → Contato; Home → Blog →
  artigo; busca do blog; envio do formulário de contato (caminho feliz, chegando em
  `/contato/obrigado`) e pelo menos um caminho de erro (ex.: e-mail inválido, mensagem de erro visível
  e associada ao campo via `aria-describedby`, já implementado — o teste é para confirmar que
  continua funcionando).
- Arquivos: `tests/e2e/public-navigation.spec.ts`, `tests/e2e/contact-form.spec.ts` (nomes
  sugeridos — adapte ao padrão que fizer mais sentido).
- Resultado esperado: suíte verde cobrindo os caminhos felizes e pelo menos um caminho de erro por
  fluxo.

#### Etapa 3 — Fluxos críticos de admin

- Objetivo: cobrir login (com e sem 2FA), publicação de artigo e acesso negado sem sessão.
- Tarefas: login completo (usuário de teste criado e removido pelo próprio setup/teardown do teste,
  seguindo o padrão de `scripts/tmp-test-admin.mts` já usado manualmente nesta sessão, mas agora
  automatizado dentro do teste); criar e publicar um artigo do zero até aparecer no `/blog` público;
  acessar `/admin` sem cookie de sessão e confirmar o redirecionamento para `/admin/login`.
- Arquivos: `tests/e2e/admin-auth.spec.ts`, `tests/e2e/admin-publish-flow.spec.ts`.
- Cuidado: **nunca** deixe um teste E2E criar um admin de verdade sem limpar depois — o teardown é
  parte do teste, não uma etapa manual separada. Rode contra o banco de teste, nunca contra o banco de
  desenvolvimento ou remoto.
- Resultado esperado: suíte verde; nenhum dado de teste sobrando no banco depois da execução.

#### Etapa 4 — Acessibilidade automatizada

- Objetivo: fechar "verificação automática de acessibilidade por página" de §27/§31.
- Tarefas: integre `@axe-core/playwright` (ou equivalente) e rode a varredura de axe contra cada
  template público listado na Fase 10 e as telas principais do admin (login, dashboard, editor de
  artigo). Trate qualquer violação encontrada como bug real a corrigir, não como algo a silenciar.
- Arquivos: `tests/e2e/accessibility.spec.ts`.
- Resultado esperado: suíte de axe verde (zero violações) em todas as páginas varridas, ou violações
  corrigidas antes de marcar a fase como pronta.

#### Etapa 5 — Integrar ao CI

- Objetivo: rodar a suíte E2E automaticamente.
- Tarefas: adicione um job/step ao `.github/workflows/ci.yml`. **Só faça isso depois que a Fase 12,
  Etapa 1, corrigir o `DATABASE_URL` do job `check`** — caso contrário você vai depurar uma suíte E2E
  nova enquanto o problema real é a variável de ambiente ausente, perdendo tempo. Se a Fase 12 ainda
  não rodou quando você chegar aqui, resolva a Etapa 1 da Fase 12 primeiro (mova-a para cá se preciso
  — está registrado como dependência explícita).
- Arquivos: `.github/workflows/ci.yml`.
- Resultado esperado: CI executando a suíte E2E em cada PR/push para `main`, com o job passando de
  verdade (verde no GitHub, não só localmente).

### Definition of Done — Fase 11

- [ ] Playwright configurado e rodando contra build de produção local.
- [ ] Fluxos críticos públicos cobertos (navegação, blog, contato — caminho feliz e de erro).
- [ ] Fluxos críticos de admin cobertos (login, publicar artigo, acesso negado sem sessão).
- [ ] Axe integrado, rodando contra todos os templates públicos e as telas principais do admin, zero
      violações (ou violações corrigidas).
- [ ] CI executando a suíte E2E com sucesso real (não só localmente).
- [ ] Nenhum dado de teste residual no banco depois de rodar a suíte.
- [ ] Todo o portão da seção 3 ainda verde.

### O que validar antes de passar para a Fase 12

Confirme que a suíte E2E passa **duas vezes seguidas** localmente (para pegar flakiness antes de
depender dela no pipeline de deploy) e que o CI (depois da correção da Fase 12, Etapa 1) mostra o job
verde no GitHub, não só "não falhou por engano".

---

## FASE 12 — Deploy

### Objetivo

Sair de "nenhum ambiente configurado" para "produção rodando, com backup testado e rollback
ensaiado", conforme os critérios de `docs/03` §33–37.

### Estado atual

`.github/workflows/ci.yml` existe mas **nunca passou** (0/10 execuções). Scripts de setup remoto
existem (`db:setup:remote`) e há um banco Neon já configurado localmente via `.env.neon` (não
versionado) — mas isso é **ambiente de desenvolvimento contra um banco remoto**, não um ambiente de
staging/produção de verdade. Nenhum provedor de storage foi contratado. Nenhum domínio real foi
definido (lacuna L-02 do Blueprint 1). Nenhum backup foi testado por restauração.

### O que falta

1. **Corrigir o CI** (bloqueia validar qualquer coisa remotamente — faça isso primeiro, antes de
   qualquer outra etapa desta fase).
2. Decisões abertas que precisam da DM ou de uma conta real (T-01 a T-03 de `docs/03` §43): provedor
   de deploy, provedor de Postgres, provedor de storage. **Você não deve escolher e contratar sozinho**
   — a arquitetura já recomenda Vercel + Postgres gerenciado + storage S3-compatível (§34), mas
   contratar é uma decisão que custa dinheiro real da DM. Pergunte ao usuário antes de criar contas ou
   fornecer cartão/pagamento em qualquer provedor.
3. Ambientes `staging` e `production` configurados conforme §33 (segredos distintos, banco nunca
   acessível de máquina de dev, `robots` só libera em produção — já implementado no código, só falta
   o ambiente existir).
4. Migrations no pipeline: etapa separada e explícita com o role `dm_owner`, antes do deploy do
   código novo (§32).
5. Backup/restore testado (§35): RPO/RTO propostos, `pg_dump` semanal para bucket de outra
   conta/provedor, runbook de restauração escrito e **executado pelo menos uma vez**, com o tempo real
   registrado.
6. Domínio e e-mail de envio (SPF/DKIM/DMARC) antes do primeiro e-mail real (T-11) — hoje o adaptador
   de e-mail é só um `createLogEmailPort()` (loga, não envia de verdade); trocar por um provedor real
   (ex.: Resend, já citado no blueprint) é parte desta fase, mas também depende de decisão da DM
   sobre domínio.
7. Cron de publicação agendado externamente (o endpoint `/api/cron/publish` já existe e está
   protegido; falta um agendador de verdade apontando para ele em produção).
8. Monitoramento mínimo: monitor externo batendo em `/api/health`, alerta se o cron parar.

### Dependências

**Etapa 1 (corrigir o CI) não depende de nada e deve ser a primeira coisa feita nesta fase — na
prática, pode ser feita a qualquer momento, mesmo antes da Fase 9, porque destrava a confiança em
todo o resto do pipeline.** As demais etapas desta fase dependem de decisões e contas reais da DM
(T-01/T-02/T-03/T-11) que só o usuário pode autorizar. Se o usuário não estiver disponível para essas
decisões, **pare aqui e pergunte**, registrando exatamente o que está bloqueado e por quê — não
prossiga contratando ou decidindo um provedor por conta própria.

### Arquivos e áreas envolvidas

- `.github/workflows/ci.yml` (correção do `DATABASE_URL`, depois expansão para migrations/E2E/deploy).
- `docs/03-engineering-architecture-blueprint.md` §34 (ADR de plataforma, hoje **[ABERTA]** — fechar a
  decisão depois que o usuário escolher).
- `src/server/email/` (trocar `createLogEmailPort()` por um adaptador real, mantendo a interface
  `EmailPort` já existente — não quebre o contrato, só adicione um novo adaptador e troque a
  composição).
- Novo runbook de backup/restore (ex.: `docs/07-backup-runbook.md`).
- Scripts de migração de pipeline (provavelmente um novo step no CI, não um script novo — reuse
  `npm run db:migrate` com `DATABASE_URL_ADMIN` do ambiente de destino).

### Sequência de execução

#### Etapa 1 — Corrigir o CI (`DATABASE_URL` ausente no job `check`)

- Objetivo: fazer o pipeline existente passar de verdade pela primeira vez.
- Tarefas: no job `check` de `.github/workflows/ci.yml`, o step `npm run check` roda `build`, que
  precisa de `DATABASE_URL` para prerenderizar páginas que leem o banco. O step `test:integration`, um
  pouco abaixo, já injeta `DATABASE_URL_ADMIN`/`DM_APP_DB_PASSWORD` — falta o equivalente para o
  `check`. Duas abordagens possíveis (escolha com base no que já existe, não invente uma terceira):
  (a) mover o serviço de Postgres do CI para ficar disponível **antes** do step `check`, e exportar
  `DATABASE_URL` apontando para ele (o serviço `postgres` do workflow já sobe antes de tudo, então
  isso é só adicionar a variável de ambiente ao step certo, com o usuário `dm_app` já provisionado
  pelo `db:setup`); (b) rodar `npm run db:setup` (ou equivalente) contra o Postgres de serviço antes
  do `check`, gerando as credenciais de `dm_app` de verdade, e só então rodar o build. Leia
  `scripts/db-setup.mts` (ou onde o setup de roles vive) antes de decidir — o objetivo é que o
  `check` rode contra um banco real com o mesmo shape do de desenvolvimento, não um mock.
- Arquivos: `.github/workflows/ci.yml`.
- Cuidado: **não desabilite o prerender das páginas afetadas como atalho** (ex.: não adicione
  `instant = false` ou troque por `force-dynamic` só para o build passar sem banco) — isso mascara o
  problema real em vez de corrigi-lo, e muda o comportamento de produção sem necessidade. A correção
  certa é dar ao CI um banco de verdade antes do build, não fazer o build fingir que não precisa dele.
- Resultado esperado: `gh run list` mostrando uma execução **verde** depois do commit desta correção.
  Não marque esta etapa como concluída sem confirmar isso via `gh run watch` ou `gh run view` no
  workflow real — não basta parecer certo por leitura do YAML.

#### Etapa 2 — Decisões de provedor (T-01, T-02, T-03)

- Objetivo: fechar as decisões abertas de plataforma, banco e storage.
- Tarefas: apresente ao usuário as opções já documentadas em `docs/03` §34 (recomendação: Vercel +
  Postgres gerenciado + storage S3-compatível) e as perguntas em aberto de §43 (T-01 a T-03). **Pare e
  pergunte** — não contrate nem configure credenciais de um provedor novo sem confirmação explícita.
- Arquivos: `docs/03` §34 (ADR-014 e a decisão de plataforma) depois de decidido.
- Resultado esperado: decisão registrada, ADR fechada em `docs/03` §40, provedor efetivamente
  contratado (pelo usuário ou com autorização explícita dele).

#### Etapa 3 — Ambientes `staging` e `production`

- Objetivo: dois ambientes reais, com segredos distintos, seguindo §33.
- Tarefas: configure as variáveis de ambiente na plataforma escolhida (não no repositório — o
  `.env.example` foi deliberadamente removido; **não recrie**). Confirme que `APP_ENV` está explícito
  em ambos, que `robots` bloqueia indexação em `staging` (o código já faz isso via `APP_ENV`, só
  precisa que a variável esteja certa em cada ambiente) e que `REQUIRE_2FA` não está setado como
  `false` em nenhum dos dois (o `env.ts` já recusa em produção; confirme que staging segue a mesma
  regra ou documente por que não, se for uma decisão consciente).
- Cuidado: banco de produção **nunca** acessível de máquina de desenvolvimento — isso é regra de
  processo, não de código; documente como a equipe deve operar isso (ex.: só a pipeline de CI/CD tem
  a credencial de produção).
- Resultado esperado: dois ambientes distintos respondendo, cada um com seu próprio banco/segredos,
  confirmado por deploy de teste em cada um.

#### Etapa 4 — Migrations no pipeline

- Objetivo: aplicar migrations como etapa separada e explícita antes do deploy do código novo (§32).
- Tarefas: adicione ao workflow de deploy (não ao `ci.yml` de PR — este é sobre validação de PR; o
  deploy é outro workflow, a criar) um step que roda `npm run db:migrate` com `DATABASE_URL_ADMIN` do
  ambiente de destino, **antes** de publicar o código novo, com falha da migration bloqueando o
  deploy.
- Arquivos: novo `.github/workflows/deploy.yml` (ou o mecanismo de deploy nativo do provedor escolhido
  na Etapa 2 — se for Vercel, confirme como ele orquestra isso, pode ser um hook de build em vez de um
  workflow GitHub separado).
- Cuidado: migrations devem ser **retrocompatíveis** (expandir → migrar → contrair), conforme já
  decidido em §34 — não quebre isso ao automatizar.
- Resultado esperado: deploy de teste (para staging) que aplica uma migration de verdade antes do
  código novo subir, sem downtime perceptível.

#### Etapa 5 — Backup e restore testados

- Objetivo: fechar "backups testados por restauração" da checklist de §41, com RPO/RTO reais.
- Tarefas: configure o backup automático do provedor de banco escolhido (PITR, se disponível) **e**
  um `pg_dump` lógico semanal para um bucket de outra conta/provedor (§35 é explícito sobre não
  confiar só no backup do mesmo provedor). Escreva o runbook de restauração e **execute-o de verdade**
  uma vez, contra uma instância nova (nunca contra produção), registrando o tempo real gasto.
- Arquivos: `docs/07-backup-runbook.md` (novo), possivelmente um script `scripts/backup-restore-drill.mts`
  se fizer sentido automatizar parte do drill.
- Resultado esperado: runbook escrito e **um restore real executado e cronometrado**, com o resultado
  registrado (não é suficiente "o provedor diz que faz backup" — o requisito é testar a restauração).

#### Etapa 6 — E-mail real, domínio, monitoramento, cron externo

- Objetivo: fechar os últimos itens operacionais antes do lançamento.
- Tarefas: (a) trocar `createLogEmailPort()` por um adaptador real (ex.: Resend) implementando a
  interface `EmailPort` já existente, condicionado ao domínio/SPF/DKIM/DMARC estarem prontos (decisão
  da DM, T-11); (b) configurar um monitor externo simples batendo em `/api/health` com alerta; (c)
  agendar uma chamada externa real para `/api/cron/publish` (Vercel Cron ou equivalente do provedor
  escolhido) com o cabeçalho `Authorization: Bearer <CRON_SECRET>`.
- Arquivos: `src/server/email/` (novo adaptador), configuração do provedor (fora do repositório, ou
  em `vercel.json`/equivalente se o provedor usar arquivo de configuração).
- Cuidado: **não envie um e-mail real de teste para um endereço de verdade sem confirmar com o
  usuário** — use um endereço de teste próprio primeiro.
- Resultado esperado: e-mail de teste chegando de verdade (não só logado), monitor de saúde ativo,
  cron rodando publicação agendada em produção de verdade.

### Definition of Done — Fase 12

- [ ] CI passando de verdade (verde no GitHub, confirmado via `gh run view`, não só localmente).
- [ ] Provedores de deploy, banco e storage decididos e contratados (com autorização do usuário) — ADRs fechadas em `docs/03`.
- [ ] Ambientes `staging` e `production` configurados, com segredos distintos e `robots`/`APP_ENV` corretos em cada um.
- [ ] Migrations aplicadas como etapa de pipeline, separada e antes do código novo, com falha bloqueando o deploy.
- [ ] Backup configurado (PITR do provedor + dump lógico externo) **e** um restore real executado e cronometrado, documentado no runbook.
- [ ] E-mail real configurado (se domínio/SPF/DKIM/DMARC já estiverem prontos — senão, documentar o bloqueio e manter o adaptador de log até resolver).
- [ ] Monitor de `/api/health` ativo com alerta.
- [ ] Cron de publicação agendado externamente e confirmado funcionando contra o ambiente real.
- [ ] Rollback ensaiado pelo menos uma vez (deploy de uma versão anterior de propósito, confirmando que volta sem quebrar).

### O que validar antes de considerar o projeto pronto para lançar

Isto é a última fase do roadmap técnico — depois dela, o que resta são os bloqueios de conteúdo e
jurídicos (lacunas L-02 a L-11 do Blueprint 1: domínio definitivo, textos reais, especialistas,
soluções, fotos, política de privacidade), que **não são trabalho de engenharia** e dependem só da DM.
Confirme que o checklist de segurança (§41) está sem ☐ crítico, que a suíte E2E (Fase 11) passa contra
o ambiente de staging real (não só local), e que o restore de backup foi testado — só então o projeto
está tecnicamente pronto para receber conteúdo real e lançar.

---

## 5. Ordem de execução recomendada entre as fases

```
Fase 9 (Segurança) → Fase 10 (Performance) → Fase 11 (Testes) → Fase 12 (Deploy)
```

- **Fase 9 → condição para iniciar Fase 10:** portão completo verde + verificação manual de CSP/console
  em pelo menos 4 páginas representativas (ver "O que validar" da Fase 9).
- **Fase 10 → condição para iniciar Fase 11:** nenhuma regressão funcional das otimizações; métricas
  registradas (não precisa estar 100% dentro do orçamento para começar a Fase 11, mas precisa estar
  **medido e registrado** — se algo ainda estiver fora do alvo, documente como pendência conhecida em
  vez de bloquear as fases seguintes indefinidamente).
- **Fase 11 → condição para iniciar Fase 12:** suíte E2E passando duas vezes seguidas localmente; se a
  Etapa 5 da Fase 11 (CI) ficou bloqueada esperando a Fase 12 Etapa 1, resolva a Fase 12 Etapa 1
  primeiro (é a única inversão de ordem permitida neste plano — está documentada explicitamente aqui
  para não ser tratada como erro).
- **Exceção registrada:** a Fase 12, Etapa 1 (corrigir o CI) **pode e deve ser adiantada** para antes
  da Fase 9 se for conveniente — ela não depende de nada e destrava a confiança no pipeline para todas
  as fases seguintes. As demais etapas da Fase 12 seguem depois da Fase 11.

## 6. Preservação do que já funciona

Não reescreva nem refatore as fases 1–8 sem necessidade documentada. Elas foram verificadas com
testes reais (414 unitários + 248 de integração) e navegador real. Se durante as fases 9–12 você
encontrar algo que pareça "poderia estar melhor" nessas fases, **não mexa** a menos que:

- seja um bloqueio real para a fase atual (ex.: a Fase 9 precisa mesmo tocar `src/proxy.ts` para
  HSTS — isso é esperado, não é "reescrever o que já funciona", é estender);
- o usuário peça explicitamente;
- seja uma correção de segurança crítica encontrada durante o teste de intrusão (Fase 9, Etapa 5) —
  nesse caso, corrija, mas documente por que era necessário.

Não duplique rate limiting, validação Zod, tratamento de erro ou qualquer outro mecanismo que já
existe — reuse (`rate-limit-repository.ts`, `AppError`/`ActionResult`, `assertCan`, etc.), do jeito
que a Fase 9 já orienta explicitamente a fazer com upload e IDOR.

## 7. Quando parar e perguntar ao usuário

- Qualquer decisão de provedor/infraestrutura que custe dinheiro real (T-01, T-02, T-03, T-11).
- Qualquer coisa destrutiva em banco remoto, force-push, envio de e-mail real para um endereço que
  não seja de teste.
- Se o teste de intrusão (Fase 9) encontrar uma falha crítica — pare e reporte antes de decidir como
  corrigir sozinho, principalmente se envolver dado de outro usuário/lead já gravado no banco.
- Se o portão da seção 3 não fechar 100% verde — não avance para a próxima etapa/fase com teste
  vermelho.
- Se uma migration proposta não parecer claramente retrocompatível.
