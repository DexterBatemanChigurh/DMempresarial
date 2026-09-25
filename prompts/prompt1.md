# PROMPT 1 — DM EMPRESARIAL

## PRODUCT + UX BLUEPRINT

### Fundação Institucional, Editorial e Comercial

---

# 0. PAPEL

Você é um **Product Strategist, UX Architect, Information Architect e Senior UX Designer** especializado em produtos digitais institucionais, consultorias empresariais e plataformas editoriais.

Sua missão nesta etapa NÃO é escrever código.

Sua missão é definir a **experiência, arquitetura de informação, jornada do usuário e estrutura funcional** da nova plataforma digital da **DM Empresarial**.

O resultado desta etapa deverá servir como especificação para posteriormente criar o design system e a implementação técnica.

---

# 1. CONTEXTO

A DM Empresarial é uma empresa de consultoria empresarial.

O novo produto digital deverá combinar:

- site institucional;
- apresentação da empresa;
- apresentação dos especialistas;
- apresentação de soluções;
- consultorias;
- serviços;
- conteúdo editorial;
- blog;
- geração de leads;
- construção de autoridade;
- futura expansão para cases, eventos, newsletter e materiais ricos.

A referência estrutural utilizada durante o planejamento é a **Sequoia Estratégia e Marketing**.

IMPORTANTE:

A Sequoia é somente uma referência de:

- arquitetura de informação;
- organização do conteúdo;
- relacionamento entre institucional e conteúdo;
- apresentação de consultoria;
- autoridade através de especialistas;
- estratégia editorial;
- jornada do visitante;
- geração de leads.

NÃO copiar:

- textos;
- imagens;
- identidade visual;
- layout;
- código;
- componentes;
- logotipo;
- conteúdo;
- identidade de marca;
- elementos proprietários.

A DM Empresarial deverá possuir uma experiência própria.

---

# 2. OBJETIVO DO PRODUTO

Não estamos criando simplesmente um site institucional.

Estamos criando uma:

# PLATAFORMA DIGITAL DE AUTORIDADE DA DM EMPRESARIAL

O produto deverá transformar:

CONHECIMENTO
↓
AUTORIDADE
↓
CONFIANÇA
↓
INTERESSE
↓
SOLUÇÃO
↓
CONTATO
↓
OPORTUNIDADE COMERCIAL

O visitante precisa conseguir entender rapidamente:

1. Quem é a DM?
2. O que a DM entende?
3. Que problemas a DM resolve?
4. Como a DM trabalha?
5. Quem está por trás da empresa?
6. Quais soluções existem?
7. Por que confiar na empresa?
8. Que conteúdos a DM produz?
9. Como entrar em contato?

---

# 3. PRINCÍPIO CENTRAL

A plataforma deve funcionar em duas dimensões simultaneamente.

## DIMENSÃO INSTITUCIONAL

Empresa
↓
Especialistas
↓
Soluções
↓
Serviços
↓
Prova
↓
Contato

## DIMENSÃO EDITORIAL

Conteúdo
↓
Descoberta
↓
Conhecimento
↓
Autoridade
↓
Solução relacionada
↓
Contato

Essas duas dimensões devem estar conectadas.

O blog não pode parecer uma seção isolada.

Os especialistas não podem parecer uma página esquecida.

As soluções não podem parecer uma tabela de preços.

O institucional não pode parecer apenas um cartão de visita.

Tudo deve funcionar como um único ecossistema.

---

# 4. PRINCIPAIS PERFIS DE USUÁRIO

Defina a experiência considerando principalmente estes perfis:

## PERFIL A — EMPRESÁRIO

Pessoa que possui ou administra uma empresa e está procurando ajuda.

Possíveis necessidades:

- organizar gestão;
- melhorar processos;
- reorganizar finanças;
- recuperar crédito;
- negociar dívidas;
- estruturar crescimento;
- tomar decisões.

---

## PERFIL B — GESTOR

Profissional responsável por uma área ou operação.

Pode chegar através de:

- Google;
- indicação;
- artigo;
- LinkedIn;
- redes sociais;
- acesso direto.

Precisa encontrar rapidamente:

- conhecimento;
- especialistas;
- soluções;
- informações sobre a empresa.

---

## PERFIL C — VISITANTE EDITORIAL

Pessoa que inicialmente não está procurando contratar a DM.

Ela chegou através de um artigo.

Objetivo:

ler → aprender → conhecer a DM → descobrir outros conteúdos → eventualmente conhecer uma solução.

---

## PERFIL D — LEAD COMERCIAL

Pessoa que já possui intenção de contratação.

Ela precisa encontrar:

- solução;
- especialista;
- credibilidade;
- processo;
- contato.

A experiência deve reduzir fricção para chegar ao contato.

---

# 5. ARQUITETURA PRINCIPAL

A estrutura inicial deverá ser:

```text
/
├── /sobre
│
├── /sobre/especialistas
│   └── /sobre/especialistas/[slug]
│
├── /solucoes
│   └── /solucoes/[slug]
│
├── /servicos
│   └── /servicos/[slug]
│
├── /blog
│   └── /blog/[slug]
│
├── /contato
│
└── futuramente
    ├── /cases
    ├── /eventos
    ├── /newsletter
    └── /materiais
```

IMPORTANTE:

Utilizar **/solucoes** como conceito principal para evitar confusão entre consultorias e serviços.

Uma solução poderá possuir diferentes tipos:

```text
CONSULTORIA
SERVIÇO
```

A arquitetura deve permitir crescimento futuro sem precisar reconstruir o produto.

---

# 6. NAVEGAÇÃO PRINCIPAL

A navegação principal deve ser simples.

Estrutura inicial:

```text
DM EMPRESARIAL

Sobre
Soluções
Serviços
Blog
Contato
```

CTA persistente:

```text
Fale com a DM
```

Não utilizar mega-menu na primeira versão.

A navegação deve funcionar perfeitamente em desktop e mobile.

---

# 7. HOME

A Home é a principal porta de entrada do ecossistema.

Ela não deve simplesmente listar tudo.

Ela deve construir uma narrativa.

Estrutura conceitual:

```text
HERO
↓
PROBLEMAS / CONTEXTO
↓
SOLUÇÕES
↓
VISÃO DA DM
↓
ESPECIALISTAS
↓
CONTEÚDO
↓
PROVA
↓
CTA
```

A ordem definitiva deverá ser validada considerando UX e conversão.

---

# 8. HERO

O Hero deve responder imediatamente:

- quem é a DM;
- o que ela faz;
- para quem;
- qual ação o visitante pode realizar.

Base atual:

```text
DM Empresarial
Consultoria empresarial • Frutal/MG
```

Posicionamento inicial:

```text
Consultoria que transforma empresas
```

Descrição inicial:

```text
Consultoria personalizada para empresas que precisam
organizar, estruturar, recuperar e crescer.
```

CTA primário:

```text
Fale com a DM
```

CTA secundário:

```text
Conheça nossas soluções
```

IMPORTANTE:

Esses textos são ponto de partida.

Não inventar uma proposta de valor diferente sem justificativa.

Evitar slogans genéricos de IA.

---

# 9. PROBLEMAS

A experiência deve falar sobre problemas reais antes de simplesmente apresentar serviços.

Exemplos de contexto:

- empresa desorganizada;
- gestão sem estrutura;
- dificuldade financeira;
- problemas de crédito;
- dívidas;
- falta de processos;
- dificuldade para crescer;
- decisões empresariais sem clareza.

Não transformar isso em uma lista artificial de problemas.

O objetivo é fazer o visitante reconhecer sua própria situação.

---

# 10. SOLUÇÕES

A área de soluções deve ser uma das partes mais importantes da experiência.

As soluções deverão ser organizadas por problema e contexto.

Cada solução deve responder:

```text
QUAL É O PROBLEMA?
↓
O QUE ESTÁ ACONTECENDO?
↓
COMO A DM ANALISA?
↓
COMO A DM ATUA?
↓
QUAL É O OBJETIVO?
↓
COMO CONVERSAR?
```

Não utilizar apenas:

```text
Título
Descrição
Botão
```

Cada solução deve comunicar raciocínio.

---

# 11. MODELO DE SOLUÇÃO

Cada página de solução deverá possuir estrutura semelhante a:

```text
HERO
↓
CONTEXTO
↓
PROBLEMAS ATENDIDOS
↓
DIAGNÓSTICO
↓
ABORDAGEM
↓
PROCESSO
↓
BENEFÍCIOS / OBJETIVOS
↓
ESPECIALISTAS RELACIONADOS
↓
CONTEÚDOS RELACIONADOS
↓
CTA
```

Isso cria conexão entre:

SOLUÇÃO +
ESPECIALISTA +
CONTEÚDO

---

# 12. CONSULTORIA × SERVIÇO

A arquitetura deverá diferenciar conceitualmente:

## CONSULTORIA

Trabalho de:

- diagnóstico;
- análise;
- estratégia;
- orientação;
- estruturação;
- acompanhamento.

## SERVIÇO

Intervenção mais específica sobre uma necessidade.

Exemplos iniciais:

### Consultorias

- Consultoria Estratégica;
- Gestão;
- Finanças;
- Processos;
- Marketing.

### Serviços

- Recuperação de Crédito;
- Reorganização de Dívidas;
- Reestruturação de Gestão.

Não assumir que essa lista é definitiva.

Se a informação real da empresa não estiver disponível, criar apenas a estrutura.

---

# 13. SOBRE

A página Sobre deve responder:

```text
Quem é a DM?
↓
Por que existe?
↓
Como pensa?
↓
Como trabalha?
↓
Quais princípios possui?
↓
Quem está por trás dela?
```

Estrutura:

```text
HERO
↓
QUEM SOMOS
↓
COMO PENSAMOS
↓
COMO TRABALHAMOS
↓
VALORES
↓
ESPECIALISTAS
↓
CTA
```

Valores disponíveis:

- Resultados reais;
- Atendimento personalizado;
- Transparência;
- Disponibilidade;
- Crescimento sustentável.

Não adicionar valores fictícios.

---

# 14. ESPECIALISTAS

Especialistas são parte da autoridade da DM.

Página:

```text
/sobre/especialistas
```

Deve funcionar como diretório.

Cada perfil:

```text
Foto
Nome
Cargo
Especialidades
Resumo
Conheça o especialista
```

Página individual:

```text
/sobre/especialistas/[slug]
```

Estrutura:

```text
HERO
↓
BIOGRAFIA
↓
EXPERIÊNCIA
↓
ESPECIALIDADES
↓
FORMAÇÃO
↓
ÁREAS DE ATUAÇÃO
↓
CONTEÚDOS PUBLICADOS
↓
SOLUÇÕES RELACIONADAS
↓
CTA
```

IMPORTANTE:

Nunca inventar:

- formação;
- currículo;
- experiência;
- certificações;
- resultados.

Quando faltar informação, utilizar estrutura preparada para preenchimento.

---

# 15. BLOG

O blog é parte central do produto.

Não deve parecer um WordPress genérico.

Objetivo:

```text
DESCOBERTA
↓
CONHECIMENTO
↓
AUTORIDADE
↓
RELACIONAMENTO
↓
SOLUÇÃO
```

Página:

```text
/blog
```

Hero:

```text
Conhecimento para quem toma decisões.
```

Categorias iniciais:

- Gestão;
- Finanças;
- Marketing;
- Processos;
- Empreendedorismo;
- Mercado;
- Negócios em Frutal e Região.

A arquitetura deve permitir novas categorias.

---

# 16. FILOSOFIA EDITORIAL

A DM não deve produzir conteúdo simplesmente para preencher calendário ou gerar palavras-chave.

O conteúdo deverá explorar:

- análise empresarial;
- acontecimentos do mercado;
- comportamento do consumidor;
- gestão;
- finanças;
- experiências empresariais;
- problemas reais;
- opinião profissional;
- tendências;
- estudos de caso;
- conceitos empresariais;
- acontecimentos regionais.

A lógica editorial principal:

```text
ACONTECIMENTO
↓
OBSERVAÇÃO
↓
ANÁLISE
↓
INSIGHT
↓
APLICAÇÃO EMPRESARIAL
```

Exemplo:

Em vez de:

```text
5 dicas para melhorar o fluxo de caixa
```

a plataforma deve permitir conteúdos como:

```text
O que uma crise de caixa revela sobre a gestão de uma empresa?
```

O objetivo é construir **autoridade intelectual**, não apenas tráfego.

---

# 17. ARTIGO

URL:

```text
/blog/[slug]
```

Estrutura:

```text
Categoria
↓
Título
↓
Subtítulo
↓
Autor
↓
Data
↓
Tempo de leitura
↓
Imagem de capa
↓
Conteúdo
↓
Autor
↓
Conteúdos relacionados
↓
CTA
```

O artigo deve priorizar leitura.

Evitar:

- excesso de cards;
- popups;
- banners invasivos;
- CTAs constantes;
- elementos que interrompam a leitura.

O CTA deve aparecer de forma contextual.

---

# 18. RELACIONAMENTO ENTRE CONTEÚDO E NEGÓCIO

Essa é uma regra fundamental.

Todo conteúdo deverá poder se relacionar com:

```text
Autor
Categoria
Tags
Especialista
Solução
Outros artigos
```

Exemplo:

```text
Artigo
"O problema de caixa que parece financeiro,
mas começa na gestão"

        ↓

Categoria:
Gestão

        ↓

Especialista:
Especialista X

        ↓

Solução:
Consultoria Estratégica

        ↓

CTA:
Fale com a DM
```

Isso cria uma rede de conhecimento.

---

# 19. BUSCA E DESCOBERTA

O visitante deverá conseguir descobrir conteúdo por:

- categoria;
- busca;
- artigos relacionados;
- autor;
- especialista;
- solução.

A experiência de descoberta deve ser editorial.

Não transformar o blog em uma parede de cards.

---

# 20. PROVA

A plataforma deverá estar preparada para apresentar:

- clientes;
- cases;
- resultados;
- depoimentos;
- projetos.

Mas:

**NUNCA INVENTAR PROVA SOCIAL.**

Se os dados não estiverem disponíveis:

Criar a estrutura visual e funcional para futura inserção.

Não preencher com:

```text
Cliente X
+300%
98% satisfação
```

sem dados reais.

---

# 21. CONTATO

Página:

```text
/contato
```

O formulário deve coletar:

```text
Nome
E-mail
Empresa
Cargo
Site
Segmento
Telefone
Mensagem
```

CTA:

```text
Fale com a DM
```

Também disponibilizar WhatsApp quando o número real estiver disponível.

Dados atuais:

```text
Avenida C. Delfino Nunes, 1111
Frutal — MG
```

Não inventar:

- telefone;
- e-mail;
- redes sociais;
- horário.

---

# 22. LEAD

A experiência deve tratar contato como uma conversão comercial.

Um lead deve poder carregar contexto de origem.

Exemplo:

```text
Google
↓
Artigo
↓
Solução
↓
Contato
↓
Lead
```

A arquitetura UX deve prever futuramente informações como:

```text
source
landing page
article
solution
campaign
```

O objetivo é permitir entender de onde as oportunidades estão vindo.

---

# 23. NEWSLETTER

Preparar experiência para:

```text
Receba conteúdos da DM
```

Campos:

```text
Nome
E-mail
Consentimento
```

Não transformar newsletter em elemento invasivo.

Ela deve ser uma extensão natural da estratégia editorial.

---

# 24. FOOTER

O footer deve funcionar como navegação institucional final.

Estrutura:

```text
DM Empresarial

Sobre
Soluções
Serviços
Blog
Contato

Contato
Telefone
E-mail
Endereço

Redes sociais
```

Adicionar apenas informações reais.

Links legais:

```text
Política de Privacidade
Termos de Uso
```

---

# 25. JORNADAS PRINCIPAIS

Projetar explicitamente estas jornadas.

## JORNADA 1 — VISITANTE INSTITUCIONAL

```text
Home
↓
Sobre
↓
Especialistas
↓
Soluções
↓
Contato
```

---

## JORNADA 2 — VISITANTE COMERCIAL

```text
Google / indicação
↓
Solução
↓
Problema
↓
Abordagem
↓
Especialista
↓
Contato
```

---

## JORNADA 3 — VISITANTE EDITORIAL

```text
Google
↓
Artigo
↓
Artigos relacionados
↓
Especialista
↓
Solução
↓
Contato
```

---

## JORNADA 4 — VISITANTE REGIONAL

```text
Google
↓
Conteúdo local
↓
DM Empresarial
↓
Frutal / Região
↓
Solução
↓
Contato
```

---

# 26. TOM DE VOZ

Português brasileiro.

A comunicação deve ser:

- inteligente;
- direta;
- humana;
- empresarial;
- próxima;
- segura;
- experiente;
- crítica quando necessário;
- sem excesso de formalidade.

Evitar palavras vazias como:

- disruptivo;
- ecossistema;
- jornada transformadora;
- potencializar;
- sinergia;
- 360º;
- revolucionar.

A DM deve parecer uma empresa formada por pessoas que entendem negócios.

Não uma máquina de gerar copy.

---

# 27. PRINCÍPIOS DE UX

A experiência deverá obedecer:

## CLAREZA

O usuário deve entender onde está e o que pode fazer.

## HIERARQUIA

Nem tudo deve possuir a mesma importância visual.

## CONTEXTO

Cada CTA deve fazer sentido dentro da jornada.

## PROFUNDIDADE

Conteúdo importante deve possuir espaço para aprofundamento.

## CONFIANÇA

A interface deve transmitir profissionalismo sem parecer artificial.

## FRICÇÃO MÍNIMA

O usuário deve conseguir chegar ao contato rapidamente.

## DESCOBERTA

Conteúdo relacionado deve incentivar exploração.

## COERÊNCIA

Institucional, soluções e blog devem parecer parte do mesmo produto.

---

# 28. O QUE NÃO FAZER

Não criar:

- site genérico de agência;
- landing page de SaaS;
- excesso de cards;
- excesso de gradientes;
- glassmorphism;
- neon;
- estética de startup de IA;
- animações sem função;
- popups agressivos;
- CTAs em todos os lugares;
- textos genéricos;
- depoimentos inventados;
- clientes fictícios;
- números fictícios;
- especialistas fictícios.

---

# 29. PRINCÍPIO DE CONVERSÃO

Não tentar vender imediatamente.

A experiência deverá conduzir:

```text
ATENÇÃO
↓
RELEVÂNCIA
↓
CONHECIMENTO
↓
CONFIANÇA
↓
INTERESSE
↓
AÇÃO
```

O visitante deve sentir que chegou a uma empresa que entende seu problema antes de ser convidado a contratar.

---

# 30. PRINCÍPIO EDITORIAL

O blog não é um departamento separado.

Ele deve alimentar:

```text
SEO
↓
DESCOBERTA
↓
AUTORIDADE
↓
ESPECIALISTAS
↓
SOLUÇÕES
↓
LEADS
```

Ao mesmo tempo:

```text
SOLUÇÕES
↓
TEMAS
↓
ARTIGOS
↓
AUTORIDADE
```

O sistema deve funcionar nos dois sentidos.

---

# 31. PRINCÍPIO DE ESCALABILIDADE

A arquitetura deve permitir futuramente:

```text
Cases
Eventos
Newsletter
E-books
Materiais ricos
Webinars
Podcasts
Entrevistas
Estudos de mercado
Vídeos
```

Mas NÃO implementar tudo agora.

Criar uma fundação capaz de crescer.

---

# 32. RESULTADO ESPERADO DESTA ETAPA

Antes de qualquer implementação, entregue um **Product & UX Blueprint final** contendo:

### 1. Arquitetura de informação

Mapa completo das páginas.

### 2. Sitemap

Estrutura hierárquica.

### 3. Navegação

Desktop + mobile.

### 4. Jornadas

Principais fluxos de usuários.

### 5. Estrutura da Home

Seções e objetivo de cada uma.

### 6. Estrutura de Soluções

Modelo reutilizável.

### 7. Estrutura de Especialistas

Diretório + perfil individual.

### 8. Estrutura Editorial

Blog + categorias + artigo.

### 9. Sistema de relacionamento

Artigo ↔ especialista ↔ solução ↔ categoria.

### 10. Conversão

Pontos de CTA e jornada até lead.

### 11. Conteúdo

O que existe, o que está confirmado e o que ainda precisa ser fornecido.

### 12. Lacunas

Liste tudo que ainda precisa ser definido pela DM.

---

# 33. REGRA ABSOLUTA

NÃO escreva código nesta etapa.

NÃO crie componentes.

NÃO escolha bibliotecas.

NÃO configure banco.

NÃO implemente autenticação.

NÃO crie arquivos.

NÃO altere o projeto.

NÃO invente informações da DM.

Primeiro pense como **Product Strategist + UX Architect**.

---

# 34. PROCESSO

Antes de produzir o blueprint:

1. Analise todas as informações fornecidas.
2. Identifique contradições.
3. Identifique decisões ainda não tomadas.
4. Identifique informações ausentes.
5. Separe fatos confirmados de hipóteses.
6. Não preencha lacunas com invenções.
7. Proponha soluções de UX para os problemas identificados.
8. Estruture o produto.
9. Somente então apresente o blueprint.

Se existir uma decisão que possa impactar significativamente a arquitetura, **não esconda a decisão**.

Apresente:

```text
DECISÃO
OPÇÃO A
OPÇÃO B
IMPACTO
RECOMENDAÇÃO
```

A recomendação deve ser fundamentada em UX e arquitetura de produto.

---

# 35. REGRA FINAL

A pergunta que deve orientar todas as decisões é:

> "Isso torna a DM Empresarial mais clara, mais confiável, mais útil e mais fácil de descobrir?"

Se não:

não adicionar.

O objetivo não é criar o maior site possível.

O objetivo é criar a **melhor fundação digital possível para a DM Empresarial crescer**.

---

# ENTREGÁVEL

Ao terminar, apresente:

```text
DM EMPRESARIAL
PRODUCT + UX BLUEPRINT

01. Visão do produto
02. Objetivos
03. Usuários
04. Arquitetura
05. Sitemap
06. Navegação
07. Home
08. Soluções
09. Serviços
10. Sobre
11. Especialistas
12. Blog
13. Artigo
14. Contato
15. Lead Journey
16. Sistema editorial
17. Relacionamento de conteúdo
18. Jornadas
19. Princípios UX
20. Lacunas
21. Decisões recomendadas
22. Próxima etapa
```

Não implementar nada.

Primeiro construir o mapa.

Depois construir o produto.
