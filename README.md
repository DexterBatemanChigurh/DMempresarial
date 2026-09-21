# DM Empresarial

Plataforma digital de autoridade da DM Empresarial (consultoria empresarial, Frutal/MG):
institucional, soluções, especialistas, blog editorial e geração de leads.

> Estado: **Fase 1 (fundação) concluída.** Ainda não há páginas públicas, banco modelado nem CMS.
> Este README descreve apenas o que existe.

## Documentação de produto e design

- [Product + UX Blueprint](docs/01-product-ux-blueprint.md): arquitetura de informação, jornadas, regras de publicação, lacunas e decisões pendentes.
- [Design System Blueprint](docs/02-design-system-blueprint.md): direção visual, tipografia, cores (com contraste medido), componentes e motion.
- [Engineering Architecture Blueprint](docs/03-engineering-architecture-blueprint.md): arquitetura técnica, modelo de dados, segurança, cache, CMS, decisões e roadmap.
- [Project Audit e plano](docs/04-project-audit-and-plan.md): estado real do repositório, classificação (keep/refactor/replace/create), conflitos, riscos e ordem de implementação.

## Requisitos

- Node.js 24 (`.nvmrc`), npm 11
- Docker (Postgres local)

## Começando

```bash
npm install
cp .env.example .env.local     # preencha DM_DB_PASSWORD e DATABASE_URL_ADMIN
npm run db:up                  # Postgres 17 em 127.0.0.1:5433 (container dm_empresarial_db)
npm run db:check               # confirma a conexão
npm run dev
```

A porta **5433** é deliberada: a 5432 costuma estar ocupada por outros projetos locais.

## Comandos

| Comando                           | O que faz                                    |
| --------------------------------- | -------------------------------------------- |
| `npm run check`                   | lint + typecheck + testes + build (o portão) |
| `npm run lint` / `typecheck`      | ESLint 9 (config do Next) / TypeScript 6     |
| `npm test`                        | Vitest                                       |
| `npm run format` / `format:check` | Prettier                                     |
| `npm run db:up` / `db:down`       | Sobe/derruba o Postgres local                |

## Estrutura

```
src/app          rotas (Next.js App Router)
src/components   UI (não importa servidor nem banco — imposto por lint)
src/lib          código puro e isomórfico (erros, resultado)
src/modules      domínios (a partir da fase de banco); `domain/` é puro
src/server       infraestrutura de servidor (env validado, logger)
scripts          utilitários de linha de comando
```

Fronteiras de camada são verificadas pelo ESLint: componentes não acessam servidor/banco e o
domínio puro não conhece Next, React nem ORM.

## Decisões de versão

- **TypeScript 6.0.3:** a 7.x é a `latest`, mas `typescript-eslint` ainda exige `<6.1.0`.
- **ESLint 9.39.x:** o `eslint-plugin-react` embutido no `eslint-config-next` 16.3.5 quebra no
  ESLint 10 (`context.getFilename is not a function`). Reavaliar quando o Next atualizar.
- Dependências com versão exata (`.npmrc`: `save-exact`).

## Segurança

Segredos vivem só em `.env.local` (ignorado pelo git) e nas variáveis do provedor de hospedagem.
`.env.example` contém apenas placeholders.
