# PROMPT 3 — DM EMPRESARIAL

## ARQUITETURA DE ENGENHARIA + SISTEMA TÉCNICO

---

## 0. CONTEXTO

Você está entrando na terceira etapa de construção da plataforma digital da **DM Empresarial**.

As duas etapas anteriores definiram:

- **Prompt 1 — Product + UX Blueprint**
- **Prompt 2 — Design System + Direção Visual**

Agora sua responsabilidade é transformar essas decisões em uma **arquitetura técnica robusta, escalável, segura, performática e preparada para evolução**.

Você NÃO deve começar implementando a aplicação inteira.

Primeiro, deve projetar a arquitetura.

O objetivo desta etapa é produzir o **Engineering Architecture Blueprint** da DM Empresarial.

---

# 1. SEU PAPEL

Atue simultaneamente como:

- Staff Software Engineer
- Software Architect
- Full-Stack Architect
- Database Architect
- Security Engineer
- Application Security Engineer
- SEO Technical Architect
- CMS Architect
- DevOps Engineer
- Performance Engineer

Pense como alguém responsável por construir um produto que precisará continuar saudável depois de anos de evolução.

Não pense apenas:

> "Como fazer funcionar?"

Pense:

> "Como fazer funcionar corretamente, com segurança, previsibilidade, manutenção simples e espaço para crescer?"

---

# 2. REGRA FUNDAMENTAL

Antes de propor qualquer arquitetura:

1. Analise o Product + UX Blueprint do Prompt 1.
2. Analise o Design System Blueprint do Prompt 2.
3. Identifique dependências entre produto, conteúdo, interface e backend.
4. Identifique conflitos ou decisões ainda não resolvidas.
5. Só então defina a arquitetura.

Não invente requisitos de negócio que não foram definidos.

Quando algo estiver indefinido:

- sinalize;
- proponha alternativas;
- recomende uma decisão técnica;
- explique o impacto.

Não transforme suposições em fatos.

---

# 3. PRINCÍPIO ARQUITETURAL

A DM Empresarial deve ser tratada como uma:

> **plataforma digital de autoridade empresarial com CMS editorial, apresentação de soluções, especialistas, geração de leads e infraestrutura preparada para expansão.**

Não construa apenas:

> "um site institucional".

A arquitetura deve suportar:

- institucional;
- soluções;
- consultorias;
- serviços;
- especialistas;
- blog;
- artigos;
- categorias;
- tags;
- SEO;
- mídia;
- leads;
- newsletter;
- páginas institucionais;
- cases futuros;
- eventos futuros;
- materiais futuros;
- analytics futuros;
- evolução comercial futura.

Porém:

**não implemente funcionalidades futuras sem necessidade atual.**

A arquitetura deve ser preparada para elas sem transformar o MVP em um monólito desnecessariamente complexo.

---

# 4. PRINCÍPIO DE SIMPLICIDADE

Não adote microserviços apenas porque parecem sofisticados.

Para a primeira versão, priorize:

- monólito modular;
- separação clara de responsabilidades;
- backend integrado à aplicação quando apropriado;
- banco relacional;
- APIs internas bem definidas;
- autenticação centralizada;
- autorização server-side;
- validação consistente;
- observabilidade;
- baixo acoplamento.

A pergunta não é:

> "Qual arquitetura parece mais enterprise?"

A pergunta é:

> "Qual arquitetura entrega robustez sem complexidade desnecessária?"

---

# 5. STACK BASE

Avalie como ponto de partida:

### Frontend / Application

- Next.js
- App Router
- React
- TypeScript

### UI

- Tailwind CSS
- componentes próprios baseados no Design System
- shadcn/ui apenas quando fizer sentido

### Backend

Preferencialmente:

- server-side architecture do próprio Next.js;
- Route Handlers;
- Server Actions quando apropriado;
- serviços internos separados por domínio.

Não crie backend separado sem justificativa arquitetural.

---

# 6. BANCO DE DADOS

Avalie PostgreSQL como banco principal.

ORM sugerido:

- Drizzle ORM

A arquitetura deve ser relacional e preparada para:

- integridade referencial;
- índices;
- constraints;
- transações;
- auditoria;
- crescimento de conteúdo.

Não utilize JSON como substituto de modelagem relacional quando os dados forem estruturalmente relacionáveis.

JSON pode ser utilizado quando realmente representar conteúdo flexível.

---

# 7. MODELAGEM DO DOMÍNIO

Defina detalhadamente o modelo de dados.

Pelo menos avalie as seguintes entidades:

### Conteúdo

- posts
- categories
- tags
- post_categories
- post_tags
- authors
- media
- post_seo

### Negócio

- solutions
- solution_types
- specialists
- specialist_solutions
- testimonials/proofs, somente se existirem dados reais

### Institucional

- pages
- page_sections ou estrutura equivalente

### Conversão

- leads
- lead_events, se justificável
- newsletter_subscribers

### Sistema

- users
- roles
- permissions, se necessário
- sessions
- audit_logs

Não assuma que todas precisam existir.

Explique:

- por que existem;
- relacionamento;
- cardinalidade;
- campos essenciais;
- constraints;
- índices;
- regras de exclusão;
- regras de publicação.

---

# 8. SOLUTIONS COMO ENTIDADE CENTRAL

A arquitetura deve refletir a decisão do produto de evitar a duplicação entre:

- `/consultorias`
- `/servicos`

Considere:

```text
Solution
├── type: CONSULTORIA | SERVICO
├── title
├── slug
├── shortDescription
├── description
├── problem
├── approach
├── implementation
├── result
├── featured
├── status
├── seo
└── metadata
```

Porém, não aceite esse modelo automaticamente.

Analise se:

- consultoria e serviço realmente compartilham o mesmo domínio;
- quais campos são comuns;
- quais campos são específicos;
- se deve existir herança lógica;
- se `type` é suficiente;
- se devem existir estruturas específicas por tipo.

A decisão deve ser documentada.

---

# 9. BLOG

O blog deve ser tratado como uma parte estratégica da plataforma.

Arquiteture:

- posts;
- categorias;
- tags;
- autores;
- mídia;
- SEO;
- status editorial;
- publicação;
- agendamento;
- atualização;
- relacionamento entre conteúdos.

Um post não deve ficar limitado a uma única categoria se isso prejudicar a estratégia editorial.

Avalie relação:

```text
posts
  ↓
post_categories
  ↓
categories
```

e:

```text
posts
  ↓
post_tags
  ↓
tags
```

---

# 10. STATUS EDITORIAL

Avalie o seguinte ciclo:

```text
DRAFT
↓
REVIEW
↓
SCHEDULED
↓
PUBLISHED
↓
ARCHIVED
```

Defina:

- significado de cada estado;
- quem pode mudar cada estado;
- transições permitidas;
- regras de publicação;
- comportamento de conteúdo agendado;
- comportamento de conteúdo arquivado;
- URLs;
- SEO;
- cache;
- sitemap.

Não permita que conteúdo em `DRAFT` seja publicado acidentalmente.

---

# 11. CMS

Projete o CMS como um sistema editorial real.

O administrador deve conseguir trabalhar com:

- posts;
- categorias;
- tags;
- autores;
- especialistas;
- soluções;
- páginas;
- mídia;
- SEO.

O CMS deve separar claramente:

### Conteúdo

o que é escrito.

### Apresentação

como o conteúdo aparece.

### SEO

como o conteúdo é interpretado pelos mecanismos de busca.

### Publicação

quando e se o conteúdo está público.

Evite armazenar HTML arbitrário sem necessidade.

Quando houver editor rich text, avalie:

- Tiptap;
- sanitização;
- whitelist de elementos;
- prevenção de XSS;
- imagens;
- links;
- headings;
- listas;
- citações;
- embeds.

---

# 12. PÁGINAS INSTITUCIONAIS

Não trate todas as páginas institucionais como componentes hardcoded.

Avalie uma estrutura:

```text
pages
```

com possibilidade de:

- slug;
- title;
- status;
- conteúdo;
- SEO;
- publicação.

Porém, não transforme toda a aplicação em um page builder genérico.

A arquitetura deve equilibrar:

**flexibilidade editorial**

com

**controle de design e qualidade.**

---

# 13. ESPECIALISTAS

Arquiteture especialistas como entidades próprias.

Cada especialista pode possuir:

- nome;
- slug;
- cargo;
- foto;
- bio;
- especialidades;
- soluções relacionadas;
- artigos;
- status;
- SEO.

Não invente:

- formação;
- certificações;
- cargos;
- clientes;
- resultados;
- números;
- experiências.

O CMS deve permitir que dados reais sejam inseridos posteriormente.

---

# 14. LEADS

Projete uma estrutura de leads desde o início.

Avalie:

```text
leads
```

com informações como:

- id;
- nome;
- email;
- telefone;
- empresa;
- cargo;
- interesse;
- mensagem;
- origem;
- página de origem;
- campanha;
- UTM;
- created_at;
- updated_at;
- status.

Não colete dados desnecessários.

A arquitetura deve seguir:

> mínimo dado necessário para a finalidade.

---

# 15. LEAD ATTRIBUTION

Prepare a estrutura para descobrir:

> "De onde veio esse lead?"

Considere:

- source;
- medium;
- campaign;
- content;
- term;
- landing page;
- referrer;
- first touch;
- last touch.

Não implemente tracking invasivo sem necessidade.

---

# 16. NEWSLETTER

Avalie:

```text
newsletter_subscribers
```

com:

- email;
- status;
- consent timestamp;
- source;
- unsubscribe timestamp;
- created_at.

Não armazene senha.

Não trate newsletter como simplesmente:

```text
email VARCHAR
```

sem considerar consentimento e estado da inscrição.

---

# 17. AUTENTICAÇÃO

Defina claramente:

### Área pública

Sem autenticação.

### Área administrativa

Autenticada.

Nunca confie em:

- esconder botão;
- rota obscura;
- parâmetro secreto;
- slug secreto;
- middleware isoladamente.

Autorização deve ser validada server-side.

---

# 18. AUTORIZAÇÃO

Defina RBAC ou uma estratégia equivalente.

Avalie papéis como:

```text
ADMIN
EDITOR
AUTHOR
```

Mas não crie dezenas de permissões sem necessidade.

Defina:

- quem cria;
- quem edita;
- quem publica;
- quem arquiva;
- quem administra usuários;
- quem acessa leads;
- quem altera configurações;
- quem vê logs.

---

# 19. IDOR / BOLA

Considere como ameaça explícita:

```text
Insecure Direct Object Reference
Broken Object Level Authorization
```

Nunca permita:

```text
/api/posts/123
```

simplesmente porque o usuário está autenticado.

A aplicação deve verificar:

> este usuário pode acessar este objeto?

A regra deve existir no servidor.

---

# 20. VALIDAÇÃO

Use validação consistente.

Avalie:

- Zod;
- schemas compartilhados;
- validação de entrada;
- validação de saída;
- normalização;
- limites de tamanho;
- tipos;
- enums;
- constraints no banco.

Nunca confie exclusivamente na validação do frontend.

---

# 21. SEGURANÇA DE FORMULÁRIOS

Formulários públicos devem considerar:

- rate limiting;
- spam protection;
- honeypot;
- validação;
- sanitização;
- CSRF quando aplicável;
- limites de payload;
- prevenção de abuso.

Não implemente CAPTCHA automaticamente se uma solução menos intrusiva resolver.

---

# 22. UPLOADS

O CMS terá mídia.

Projete upload seguro.

Avalie:

- tipos MIME permitidos;
- extensão;
- tamanho;
- dimensões;
- nome seguro;
- storage externo;
- URLs;
- acesso público/privado;
- processamento;
- remoção;
- orphan files.

Nunca confie somente na extensão:

```text
.jpg
.png
.webp
```

---

# 23. STORAGE

Avalie storage dedicado para:

- imagens;
- arquivos;
- mídia editorial.

O banco deve armazenar metadados e referências.

Evite armazenar arquivos binários diretamente no PostgreSQL sem uma justificativa forte.

---

# 24. SEO TÉCNICO

A arquitetura deve suportar:

- metadata;
- title;
- description;
- canonical;
- Open Graph;
- Twitter/X cards;
- sitemap;
- robots.txt;
- structured data;
- breadcrumbs;
- URLs amigáveis;
- redirects;
- páginas 404;
- conteúdo indexável.

Avalie Schema.org para:

- Organization;
- LocalBusiness, quando apropriado;
- Article;
- BreadcrumbList;
- Person;
- WebSite.

Não gere structured data com informações inventadas.

---

# 25. SEO LOCAL

A DM Empresarial possui atuação em:

> Frutal — MG

A arquitetura deve permitir SEO local sem transformar o site em uma página artificial cheia de keywords.

Considere:

- localização;
- endereço;
- páginas relevantes;
- conteúdo regional;
- dados estruturados;
- consistência de informações;
- busca local.

Não invente:

- telefone;
- avaliações;
- número de clientes;
- unidades;
- cobertura geográfica;
- horários.

---

# 26. URLS

Defina estratégia de URL.

Exemplo:

```text
/
 /sobre
 /sobre/especialistas
 /sobre/especialistas/[slug]

 /solucoes
 /solucoes/[slug]

 /blog
 /blog/[slug]

 /contato
```

Avalie:

- canonicalização;
- trailing slash;
- redirects;
- slug collision;
- alteração de slug;
- histórico de URLs;
- 301;
- conteúdo removido.

---

# 27. CACHE E REVALIDAÇÃO

Defina uma estratégia para:

- páginas institucionais;
- blog;
- artigos;
- soluções;
- especialistas;
- conteúdo publicado;
- conteúdo administrativo.

Explique quando utilizar:

- static generation;
- dynamic rendering;
- revalidation;
- cache;
- invalidation.

Não torne todo o site dinamicamente renderizado apenas porque existe CMS.

---

# 28. PERFORMANCE

A aplicação deve considerar:

- Core Web Vitals;
- LCP;
- CLS;
- INP;
- imagens responsivas;
- lazy loading;
- preload;
- fontes;
- bundle size;
- JavaScript mínimo;
- server components;
- streaming quando necessário.

O design premium não pode depender de:

- vídeos gigantes;
- imagens sem otimização;
- animações pesadas;
- bibliotecas desnecessárias.

---

# 29. ACESSIBILIDADE

A arquitetura deve permitir:

- HTML semântico;
- landmarks;
- heading hierarchy;
- keyboard navigation;
- focus states;
- ARIA quando necessário;
- contraste;
- alt text;
- reduced motion;
- formulários acessíveis.

Acessibilidade não deve ser uma etapa posterior.

---

# 30. OBSERVABILIDADE

Defina estratégia para:

- logs;
- erros;
- falhas de API;
- eventos importantes;
- auditoria;
- métricas;
- monitoramento.

Separe:

### Application logs

problemas técnicos.

### Audit logs

ações administrativas relevantes.

Nunca registre:

- senhas;
- tokens;
- dados sensíveis desnecessários.

---

# 31. AUDIT LOG

Avalie uma estrutura:

```text
audit_logs
```

para registrar ações administrativas como:

- login;
- criação;
- edição;
- publicação;
- arquivamento;
- exclusão;
- alteração de configurações;
- alteração de permissões.

Registre:

- ator;
- ação;
- entidade;
- entity_id;
- timestamp;
- metadata mínima necessária.

---

# 32. TRATAMENTO DE ERROS

Defina:

- erros de domínio;
- erros de validação;
- erros de autenticação;
- erros de autorização;
- erros de recurso inexistente;
- erros inesperados.

A API não deve vazar:

- stack trace;
- SQL;
- secrets;
- estrutura interna;
- tokens;
- informações sensíveis.

---

# 33. API

Mesmo dentro de um monólito, defina fronteiras claras.

Exemplo:

```text
src/
  app/
  components/
  features/
  lib/
  server/
  db/
```

Avalie uma organização por domínio:

```text
server/
  auth/
  posts/
  solutions/
  specialists/
  leads/
  newsletter/
  media/
  seo/
```

Evite uma pasta:

```text
utils/
```

gigante onde toda regra de negócio acaba.

---

# 34. DOMAIN LOGIC

A regra:

> UI não deve ser dona da regra de negócio.

Exemplo:

Não coloque lógica crítica de publicação apenas em:

```text
button.tsx
```

A regra de publicação deve existir no domínio/server.

O frontend pode solicitar:

> publicar post

mas o servidor decide:

> esse usuário pode publicar?
> o conteúdo está válido?
> o estado atual permite essa transição?

---

# 35. TRANSAÇÕES

Defina quando operações precisam ser transacionais.

Exemplo:

Publicar artigo pode envolver:

- atualizar status;
- registrar publicação;
- atualizar SEO;
- gerar/revalidar cache;
- registrar audit log.

Avalie quais operações precisam ocorrer atomicamente.

---

# 36. CONCORRÊNCIA

Considere:

- dois administradores editando o mesmo conteúdo;
- atualização simultânea;
- publicação simultânea;
- alteração de slug;
- exclusão enquanto outro usuário edita.

Avalie:

- optimistic locking;
- versioning;
- updated_at;
- conflitos de edição.

Não implemente colaboração em tempo real se não houver necessidade.

---

# 37. DELETE

Evite exclusões destrutivas quando elas puderem causar:

- perda editorial;
- quebra de links;
- perda de histórico;
- perda de relacionamento.

Avalie:

- soft delete;
- archive;
- hard delete administrativo.

Documente o comportamento de cada entidade.

---

# 38. MIGRATIONS

O banco deve ser versionado por migrations.

Nunca dependa de:

> "entrar no banco e criar a tabela manualmente."

Defina:

- migrations;
- seed;
- ambiente local;
- staging;
- produção;
- rollback strategy.

---

# 39. SEED

Crie uma estratégia para dados iniciais.

Mas atenção:

**não invente conteúdo real da DM Empresarial.**

Seeds podem utilizar:

- dados claramente fictícios;
- placeholders;
- fixtures;
- conteúdo de desenvolvimento explicitamente marcado.

Nunca faça seed de:

- clientes falsos;
- depoimentos falsos;
- especialistas falsos;
- resultados falsos;
- certificações falsas.

---

# 40. AMBIENTES

Defina:

```text
development
staging
production
```

e explique:

- variáveis de ambiente;
- banco;
- storage;
- email;
- autenticação;
- domínio;
- logs.

Segredos nunca devem estar no repositório.

---

# 41. ENVIRONMENT VARIABLES

Defina categorias como:

```text
DATABASE_URL
AUTH_SECRET
STORAGE_*
EMAIL_*
ANALYTICS_*
```

Mas não invente valores.

Crie:

```text
.env.example
```

somente com placeholders.

---

# 42. EMAIL

A arquitetura pode considerar:

- Resend

para:

- notificações de leads;
- confirmação de newsletter;
- emails administrativos.

Não coloque credenciais no frontend.

---

# 43. RATE LIMITING

Defina quais endpoints precisam de proteção.

Especialmente:

- login;
- contato;
- newsletter;
- recuperação de acesso;
- APIs públicas;
- uploads;
- ações administrativas.

Explique:

- limite;
- janela;
- chave de identificação;
- comportamento quando excedido.

Não aplique rate limit absurdo que prejudique usuários legítimos.

---

# 44. CONTENT SECURITY POLICY

Avalie CSP.

Considere:

- scripts;
- styles;
- imagens;
- fontes;
- frames;
- analytics;
- storage.

Evite simplesmente:

```text
unsafe-eval
unsafe-inline
```

sem necessidade.

Se alguma exceção for inevitável, documente.

---

# 45. HEADERS DE SEGURANÇA

Avalie:

- Content-Security-Policy
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy
- Strict-Transport-Security
- frame protections

Explique quais devem ser utilizados e por quê.

---

# 46. PRIVACIDADE

A arquitetura deve respeitar princípios de privacidade e LGPD.

Não transforme isso em burocracia.

Considere:

- finalidade;
- minimização;
- consentimento quando aplicável;
- retenção;
- exclusão;
- acesso;
- segurança;
- transparência.

Não invente políticas jurídicas.

A arquitetura deve permitir que políticas reais sejam adicionadas posteriormente.

---

# 47. ANALYTICS

Prepare o sistema para analytics.

Não acople a aplicação inteira a uma ferramenta específica.

Crie uma camada de abstração quando fizer sentido.

Eventos futuros podem incluir:

```text
page_view
solution_view
article_view
lead_started
lead_submitted
newsletter_subscribed
cta_clicked
```

Não faça tracking excessivo.

---

# 48. DESIGN SYSTEM → ENGINEERING

O Prompt 2 define o visual.

Agora traduza isso tecnicamente em:

- tokens;
- CSS variables;
- typography system;
- spacing;
- colors;
- radii;
- shadows;
- breakpoints;
- motion;
- component states.

Não invente novos estilos fora do Design System.

---

# 49. COMPONENT ARCHITECTURE

Defina claramente:

### Primitives

Exemplo:

- Button
- Input
- Select
- Textarea
- Heading
- Container

### Components

Exemplo:

- Header
- Footer
- ArticleCard
- SolutionCard
- SpecialistCard
- LeadForm

### Sections

Exemplo:

- Hero
- ServicesSection
- EditorialSection
- SpecialistsSection
- CTASection

### Templates

Exemplo:

- BlogTemplate
- ArticleTemplate
- SolutionTemplate
- SpecialistTemplate

Evite componentes gigantescos.

---

# 50. RESPONSIVE ARCHITECTURE

Defina comportamento em:

- mobile;
- tablet;
- desktop;
- telas grandes.

Não trate mobile como:

> desktop diminuído.

O layout deve ter regras próprias.

---

# 51. IMAGENS

Defina:

- formatos;
- compressão;
- responsive images;
- dimensions;
- aspect ratios;
- object positioning;
- alt text.

Evite layout shift.

---

# 52. FONTES

Defina estratégia de carregamento.

Considere:

- self-hosting;
- `next/font`;
- fallback;
- subset;
- preload;
- display.

O Design System deve determinar a tipografia.

---

# 53. ANIMAÇÕES

A arquitetura deve suportar animações leves.

Mas:

> animação é comunicação, não decoração.

Priorize:

- entrada;
- transição;
- feedback;
- navegação;
- hierarquia.

Respeite:

```text
prefers-reduced-motion
```

---

# 54. TESTES

Defina estratégia de testes.

### Unit

Para:

- regras;
- funções;
- validações;
- transformações.

### Integration

Para:

- banco;
- serviços;
- APIs;
- autenticação;
- autorização.

### E2E

Para fluxos críticos:

- login;
- criação de post;
- publicação;
- formulário de lead;
- newsletter;
- navegação pública.

Não busque 100% de cobertura artificialmente.

Priorize risco.

---

# 55. SEGURANÇA DOS TESTES

Inclua cenários de:

- usuário não autenticado;
- usuário autenticado sem permissão;
- IDOR;
- payload inválido;
- XSS;
- upload malicioso;
- rate limit;
- acesso direto a rota administrativa;
- conteúdo não publicado;
- slug inexistente.

---

# 56. CI/CD

Defina pipeline conceitual:

```text
Pull Request
↓
Lint
↓
Typecheck
↓
Tests
↓
Build
↓
Security checks
↓
Deploy
```

Não permita deploy de código quebrado.

---

# 57. GIT

Defina convenções para:

- branches;
- commits;
- pull requests;
- migrations;
- releases.

Evite burocracia desnecessária.

---

# 58. ESTRUTURA DO PROJETO

Proponha uma estrutura inicial.

Exemplo conceitual:

```text
src/
├── app/
│   ├── (public)/
│   ├── admin/
│   ├── api/
│   ├── sitemap.ts
│   ├── robots.ts
│   └── layout.tsx
│
├── components/
│   ├── ui/
│   ├── layout/
│   ├── content/
│   └── forms/
│
├── features/
│   ├── posts/
│   ├── solutions/
│   ├── specialists/
│   ├── leads/
│   ├── newsletter/
│   └── media/
│
├── server/
│   ├── auth/
│   ├── db/
│   ├── services/
│   ├── repositories/
│   └── permissions/
│
├── lib/
│
└── styles/
```

Não copie essa estrutura cegamente.

Analise e adapte.

---

# 59. SEPARAÇÃO DE RESPONSABILIDADES

Defina claramente:

```text
UI
↓
Application
↓
Domain
↓
Infrastructure
```

Evite:

```text
React Component
↓
SQL direto
```

e:

```text
Database
↓
UI
```

sem camada intermediária.

---

# 60. REPOSITORIES

Avalie se repositories são necessários.

Não crie abstrações inúteis apenas para parecer enterprise.

Se uma camada existir, ela deve resolver um problema real.

---

# 61. SERVICES

Services devem concentrar operações de negócio quando necessário.

Exemplo:

```text
publishPost()
createLead()
updateSolution()
publishPage()
subscribeNewsletter()
```

Eles devem ser independentes da interface visual.

---

# 62. PERMISSÕES

Crie uma matriz:

| Ação               | ADMIN | EDITOR | AUTHOR |
| ------------------ | ----- | ------ | ------ |
| Criar post         | ?     | ?      | ?      |
| Editar post        | ?     | ?      | ?      |
| Publicar           | ?     | ?      | ?      |
| Arquivar           | ?     | ?      | ?      |
| Gerenciar leads    | ?     | ?      | ?      |
| Gerenciar usuários | ?     | ?      | ?      |

Preencha com justificativa.

---

# 63. THREAT MODEL

Faça uma análise básica de ameaças.

Considere:

- credential stuffing;
- brute force;
- XSS;
- CSRF;
- SQL injection;
- SSRF;
- IDOR/BOLA;
- upload abuse;
- spam;
- scraping;
- privilege escalation;
- session theft;
- data leakage.

Para cada risco:

```text
Ameaça
Impacto
Probabilidade
Mitigação
```

Não atribua pontuações arbitrárias sem metodologia.

---

# 64. DADOS PÚBLICOS VS PRIVADOS

Defina explicitamente quais dados podem ser públicos.

### Públicos

Exemplo:

- posts publicados;
- soluções publicadas;
- especialistas publicados;
- páginas publicadas.

### Privados

Exemplo:

- leads;
- emails;
- audit logs;
- usuários;
- tokens;
- drafts.

Essa separação deve existir tanto na aplicação quanto no banco/autorização.

---

# 65. ADMIN

A área administrativa deve ser tratada como produto separado dentro da mesma plataforma.

Deve possuir:

- dashboard;
- navegação;
- estados;
- feedback;
- confirmação;
- erros;
- loading;
- permissões;
- busca;
- filtros.

Não basta:

> "uma tela com CRUD".

---

# 66. CMS UX

O CMS deve favorecer produtividade editorial.

Avalie:

- autosave;
- preview;
- draft;
- publish;
- schedule;
- SEO preview;
- slug;
- featured image;
- categories;
- tags;
- author;
- revision history.

Não implemente tudo automaticamente.

Classifique:

### MVP

### Segunda fase

### Futuro

---

# 67. PREVIEW

Defina como o editor poderá visualizar:

- draft;
- artigo;
- solução;
- página.

O preview não deve tornar conteúdo privado indexável.

---

# 68. SEO + CMS

O editor deve poder controlar:

- SEO title;
- meta description;
- canonical;
- OG image;
- slug.

Mas o sistema deve possuir defaults inteligentes.

Não obrigue o editor a preencher tudo manualmente quando puder gerar fallback seguro.

---

# 69. SLUG MANAGEMENT

Quando um slug mudar:

```text
/old-slug
```

deve poder redirecionar para:

```text
/new-slug
```

Avalie tabela de redirects.

---

# 70. CONTENT RELATIONSHIPS

O sistema deve conectar:

```text
Artigo
↓
Categoria
↓
Tags
↓
Especialista
↓
Solução
```

quando houver relacionamento real.

Isso melhora:

- navegação;
- descoberta;
- SEO;
- autoridade;
- conversão.

Não crie relações artificiais.

---

# 71. SEARCH

Avalie busca no blog.

Para MVP:

- PostgreSQL full-text search pode ser suficiente.

Não introduza Elasticsearch/OpenSearch sem necessidade real.

Defina:

- campos pesquisáveis;
- ranking;
- filtros;
- paginação;
- comportamento sem resultados.

---

# 72. PAGINATION

Defina estratégia.

Para conteúdo:

- offset ou cursor.

Explique qual utilizar e por quê.

Não introduza cursor pagination em todos os lugares automaticamente.

---

# 73. SECURITY BY DEFAULT

Toda nova funcionalidade deve partir de:

```text
deny by default
```

e liberar somente o necessário.

---

# 74. PRINCÍPIO ZERO TRUST

Não confie em:

- frontend;
- cookies isoladamente;
- IDs enviados pelo cliente;
- campos hidden;
- headers controlados pelo cliente.

Valide no servidor.

---

# 75. SEGREDOS

Nunca:

- hardcode;
- commit;
- expor;
- retornar pela API.

Exemplos:

- database credentials;
- auth secrets;
- storage keys;
- email keys;
- API keys.

---

# 76. PERFORMANCE VS SEGURANÇA

Não sacrifique segurança para ganhar milissegundos irrelevantes.

Também não crie mecanismos de segurança tão pesados que prejudiquem toda a experiência.

Priorize:

1. segurança crítica;
2. corretude;
3. estabilidade;
4. performance;
5. otimização avançada.

---

# 77. ESCALABILIDADE

Defina como a plataforma pode crescer de:

```text
100 visitantes/dia
```

para:

```text
10.000+
```

sem precisar reconstruir tudo.

Mas não projete infraestrutura para milhões de usuários se o produto ainda não possui essa necessidade.

---

# 78. CUSTO

Avalie custo operacional.

Priorize:

- serviços simples;
- infraestrutura gerenciada;
- baixo custo inicial;
- facilidade de manutenção.

A arquitetura deve ser economicamente coerente com uma empresa em crescimento.

---

# 79. DEPLOY

Avalie:

- Vercel;
- PostgreSQL gerenciado;
- storage;
- email provider;
- domínio;
- DNS.

Não assuma que Vercel é obrigatoriamente a escolha final.

Compare alternativas quando houver impacto real.

---

# 80. BACKUPS

Defina:

- frequência;
- retenção;
- restauração;
- backup do banco;
- backup de mídia;
- teste de restore.

Backup que nunca foi restaurado não deve ser considerado confiável.

---

# 81. DISASTER RECOVERY

Defina minimamente:

- perda do banco;
- perda de storage;
- indisponibilidade do provedor;
- vazamento de credenciais;
- rollback de deploy.

Não transforme isso em infraestrutura enterprise prematura.

---

# 82. DOCUMENTAÇÃO

A arquitetura deve gerar documentação para:

```text
README
ARCHITECTURE
SECURITY
DATABASE
DEPLOYMENT
ENVIRONMENT
CMS
```

Documentação deve explicar decisões, não apenas repetir código.

---

# 83. ADRs

Para decisões arquiteturais importantes, utilize Architecture Decision Records.

Exemplo:

```text
ADR-001
Next.js monolith modular
```

```text
ADR-002
PostgreSQL
```

```text
ADR-003
Solutions unification
```

```text
ADR-004
CMS architecture
```

Cada ADR deve explicar:

- contexto;
- decisão;
- alternativas;
- consequência.

---

# 84. O QUE NÃO FAZER

Não:

- criar microserviços sem necessidade;
- criar dezenas de abstrações;
- usar Firebase só por velocidade;
- usar MongoDB apenas porque é simples;
- criar backend separado sem motivo;
- colocar SQL em componentes;
- confiar em validação client-side;
- colocar secrets no frontend;
- criar autenticação caseira;
- inventar dados;
- copiar Sequoia;
- transformar o site em SaaS;
- construir um page builder genérico;
- adicionar IA apenas porque "é tendência".

---

# 85. SEQUOIA

A Sequoia continua sendo apenas:

> referência estrutural e editorial.

Não copiar:

- código;
- identidade;
- layout específico;
- textos;
- imagens;
- componentes;
- marca;
- conteúdo proprietário.

A DM deve possuir:

- arquitetura própria;
- identidade própria;
- conteúdo próprio;
- banco próprio;
- CMS próprio;
- SEO próprio;
- experiência própria.

---

# 86. NÃO CODIFIQUE AINDA

Nesta etapa você NÃO deve:

- criar componentes;
- escrever páginas;
- criar migrations;
- criar banco;
- instalar dependências;
- modificar arquivos;
- executar comandos destrutivos;
- alterar o projeto.

Primeiro produza o Blueprint.

---

# 87. AUDITORIA DO PROJETO EXISTENTE

Se um projeto já existir, antes de qualquer implementação futura, a equipe deverá posteriormente:

1. mapear estrutura atual;
2. identificar stack;
3. identificar dependências;
4. identificar rotas;
5. identificar banco;
6. identificar autenticação;
7. identificar componentes;
8. identificar funcionalidades;
9. identificar riscos;
10. identificar código que deve ser preservado.

Não destrua o projeto existente simplesmente para aplicar a nova arquitetura.

---

# 88. CONFLITOS

Se encontrar conflito entre:

- Prompt 1;
- Prompt 2;
- arquitetura técnica;

não esconda o conflito.

Documente:

```text
CONFLITO
IMPACTO
OPÇÕES
RECOMENDAÇÃO
DECISÃO NECESSÁRIA
```

---

# 89. MATRIZ DE PRIORIDADE

Classifique cada decisão como:

### CRÍTICA

Sem ela o sistema não deve ser implementado.

### IMPORTANTE

Afeta significativamente arquitetura ou segurança.

### RECOMENDADA

Melhora qualidade, mas não bloqueia MVP.

### FUTURA

Não precisa ser implementada agora.

---

# 90. ENTREGÁVEL FINAL

Ao terminar, entregue um documento chamado:

# DM EMPRESARIAL — ENGINEERING ARCHITECTURE BLUEPRINT

Estruture exatamente nas seguintes partes:

## 1. Executive Summary

## 2. Architectural Principles

## 3. Recommended Stack

## 4. System Architecture

## 5. Application Architecture

## 6. Domain Model

## 7. Database Model

## 8. Entity Relationship Overview

## 9. CMS Architecture

## 10. Authentication

## 11. Authorization

## 12. Permission Matrix

## 13. Security Architecture

## 14. Threat Model

## 15. API Architecture

## 16. Server Architecture

## 17. Frontend Architecture

## 18. Component Architecture

## 19. Content Architecture

## 20. SEO Architecture

## 21. Media Architecture

## 22. Lead Architecture

## 23. Newsletter Architecture

## 24. Analytics Architecture

## 25. Caching Strategy

## 26. Performance Strategy

## 27. Accessibility Strategy

## 28. Error Handling

## 29. Logging & Observability

## 30. Audit Logs

## 31. Testing Strategy

## 32. CI/CD

## 33. Environment Strategy

## 34. Deployment Architecture

## 35. Backup & Recovery

## 36. Scalability

## 37. Cost Considerations

## 38. Project Structure

## 39. Migration Strategy

## 40. ADR List

## 41. Security Checklist

## 42. Technical Risks

## 43. Open Decisions

## 44. MVP vs Future

## 45. Implementation Roadmap

---

# 91. FORMATO DE CADA DECISÃO

Para decisões arquiteturais importantes, use:

```text
DECISÃO
O que será utilizado.

MOTIVO
Por que isso foi escolhido.

ALTERNATIVAS
O que foi considerado.

TRADE-OFF
O que ganhamos e perdemos.

IMPACTO
Como isso afeta produto, engenharia, segurança, custo e manutenção.

REGRA
Como futuros desenvolvedores devem seguir essa decisão.
```

---

# 92. REGRA DE QUALIDADE

Uma arquitetura boa não é aquela com mais tecnologia.

É aquela que:

- reduz complexidade;
- reduz risco;
- protege dados;
- facilita manutenção;
- permite evolução;
- mantém performance;
- respeita o produto;
- respeita o design;
- não cria infraestrutura desnecessária.

---

# 93. PRINCÍPIO FINAL

A DM Empresarial não deve parecer:

> um template de agência.

Não deve ser:

> um SaaS disfarçado de site institucional.

E também não deve ser:

> um projeto tecnicamente complexo apenas para parecer profissional.

Ela deve ser:

> **uma plataforma digital de autoridade empresarial, construída sobre uma arquitetura simples, segura, modular e preparada para crescer.**

A arquitetura deve desaparecer atrás da experiência.

O usuário não deve perceber:

- banco;
- API;
- cache;
- ORM;
- autenticação;
- infraestrutura.

Ele deve perceber:

> clareza, confiança, autoridade, conteúdo e uma experiência digital extremamente bem construída.

**Primeiro pense.
Depois modele.
Depois documente.
Só depois implemente.**
