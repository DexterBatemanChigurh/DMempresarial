# DM Empresarial — Product + UX Blueprint

Versão 1 · 21/09/2026 · Etapa: Prompt 1 (produto e experiência). Sem código, sem bibliotecas, sem invenção de dados da DM.

**Legenda usada em todo o documento**

- **[CONFIRMADO]** veio do Prompt 1 ou do repositório.
- **[PROPOSTA]** decisão de produto/UX deste documento, a validar com a DM.
- **[LACUNA]** informação que só a DM pode fornecer. Nunca preenchida com invenção.

---

## 00. Análise prévia (o que foi lido antes de propor qualquer coisa)

### Fatos confirmados

| Item                                                                                                           | Origem      |
| -------------------------------------------------------------------------------------------------------------- | ----------- |
| Nome: DM Empresarial. Consultoria empresarial. Frutal/MG.                                                      | Prompt 1    |
| Endereço: Avenida C. Delfino Nunes, 1111, Frutal — MG.                                                         | Prompt 1    |
| Valores: Resultados reais, Atendimento personalizado, Transparência, Disponibilidade, Crescimento sustentável. | Prompt 1    |
| Hero (ponto de partida): "Consultoria que transforma empresas" + descrição + 2 CTAs.                           | Prompt 1    |
| Categorias iniciais do blog (7) e exemplos de soluções (não definitivos).                                      | Prompt 1    |
| Campos do formulário, estrutura de URLs, navegação inicial.                                                    | Prompt 1    |
| Fundação técnica pronta (Next.js, banco local, logger, erros). Nenhuma página pública.                         | Repositório |

### Contradições e tensões encontradas

| #   | Tensão                                                                                                                                                                                                                                            | Tratamento                            |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| C1  | O Prompt pede `/solucoes` "como conceito principal para evitar confusão", mas mantém `/servicos/[slug]` como árvore separada e "Serviços" no menu. Duas URLs para a mesma entidade (solução) geram duplicidade e a confusão que se queria evitar. | Decisão D1                            |
| C2  | Consultoria e Serviço se sobrepõem nos exemplos: "Consultoria de Gestão" × "Reestruturação de Gestão"; "Consultoria de Finanças" × "Reorganização de Dívidas".                                                                                    | Critério de classificação na seção 09 |
| C3  | Menu com "Contato" e CTA persistente "Fale com a DM" levam ao mesmo lugar.                                                                                                                                                                        | Decisão D2                            |
| C4  | Formulário com 8 campos × princípio de "fricção mínima" (Prompt 1, §27) e "formulário visualmente simples" (Prompt 2, §28).                                                                                                                       | Decisão D3                            |
| C5  | O Prompt pede "mapa completo" de especialistas, blog e prova, mas proíbe inventar conteúdo. No lançamento essas áreas podem estar vazias.                                                                                                         | Decisão D4                            |
| C6  | O hero sugerido ("transforma empresas") é genérico, e o próprio Prompt manda "evitar slogans genéricos".                                                                                                                                          | Mantido como provisório; ver seção 07 |
| C7  | A descrição do hero promete "recuperar". Recuperação de crédito e renegociação de dívidas são temas sensíveis: promessa de resultado pode ser inadequada.                                                                                         | Regra de linguagem nas seções 09 e 19 |
| C8  | O valor "Resultados reais" convida a números, mas não há dado algum.                                                                                                                                                                              | Regra: zero número sem fonte          |
| C9  | Rastrear origem do lead (source, campaign) convive com LGPD e política de privacidade.                                                                                                                                                            | Lacuna jurídica L-11                  |
| C10 | Busca no blog pressupõe volume de conteúdo que não existe no início.                                                                                                                                                                              | Decisão D6                            |
| C11 | O Prompt não diz se o "Autor" do artigo é sempre um especialista.                                                                                                                                                                                 | Decisão D5                            |
| C12 | A filosofia editorial (acontecimento → análise → aplicação) exige produção contínua e qualificada. Não há informação sobre quem escreve, com que frequência, nem aprovação.                                                                       | Lacunas L-14 a L-16                   |

---

## 01. Visão do produto

Uma **plataforma de autoridade**, não um cartão de visita digital: o visitante entra por um artigo, uma indicação ou uma busca, entende como a DM pensa, conhece quem está por trás e chega ao contato sem sentir que foi "empurrado".

Duas dimensões, um só sistema:

```text
INSTITUCIONAL  Empresa → Especialistas → Soluções → Prova → Contato
EDITORIAL      Conteúdo → Autoridade → Solução relacionada → Contato
```

O ponto de encontro é a **rede de relacionamentos** (seção 17): todo artigo aponta para um especialista e, quando fizer sentido, para uma solução; toda solução mostra os especialistas e os artigos que a sustentam.

**Teste que orienta todas as decisões** (Prompt 1, §35): _isto torna a DM mais clara, mais confiável, mais útil e mais fácil de descobrir?_ Se não, não entra.

## 02. Objetivos

| Objetivo de negócio                                     | Como o produto responde                                | Sinal de sucesso (a medir)                         |
| ------------------------------------------------------- | ------------------------------------------------------ | -------------------------------------------------- |
| Construir autoridade                                    | Blog analítico + especialistas com conteúdo publicado  | Leitura completa de artigos; retorno de visitantes |
| Gerar oportunidades comerciais                          | Caminho curto até o contato, com contexto de origem    | Leads/mês e origem (artigo, solução, direto)       |
| Ser encontrada por quem tem o problema                  | Soluções descritas por problema; conteúdo local        | Entradas orgânicas em páginas de solução/blog      |
| Transmitir confiança sem inventar prova                 | Estrutura de prova pronta, preenchida só com dado real | Páginas de prova publicadas apenas com fonte       |
| Crescer sem reconstruir (cases, eventos, newsletter...) | Entidades e URLs já pensadas para expansão (seção 05)  | Nova seção sem alterar o modelo existente          |

**[LACUNA L-01]** Metas numéricas (leads/mês, prazo) não foram informadas. Sem elas, os "sinais de sucesso" acima são só direção.

## 03. Usuários

| Perfil                      | Chega por                    | Precisa encontrar                                 | Risco de perda                                     |
| --------------------------- | ---------------------------- | ------------------------------------------------- | -------------------------------------------------- |
| **A — Empresário**          | Indicação, busca, redes      | Alguém que entenda o problema dele; credibilidade | Página genérica que não reconhece a situação       |
| **B — Gestor**              | Google, LinkedIn, artigo     | Conhecimento aplicável, especialista, solução     | Não achar o especialista certo ou o tema           |
| **C — Visitante editorial** | Artigo                       | Boa leitura, depois contexto sobre a DM           | CTA invasivo que quebra a leitura                  |
| **D — Lead comercial**      | Busca por solução, indicação | Solução, especialista, processo, contato          | Fricção até o contato; falta de sinal de seriedade |

Regra: **A e D decidem em poucos cliques; C decide pela qualidade da leitura.** O mesmo layout não serve aos dois, por isso o artigo tem CTA discreto e a solução tem CTA claro.

## 04. Arquitetura de informação

Entidades do produto (vocabulário único, usado em todo o documento):

| Entidade         | O que é                                                        | Existe no lançamento?                           |
| ---------------- | -------------------------------------------------------------- | ----------------------------------------------- |
| **Solução**      | Problema + abordagem da DM. Tem `tipo`: consultoria ou serviço | Sim (conteúdo depende da DM)                    |
| **Especialista** | Pessoa da DM (e, se houver, autor convidado sinalizado)        | Sim (conteúdo depende da DM)                    |
| **Artigo**       | Conteúdo editorial                                             | Sim, se houver ao menos os primeiros            |
| **Categoria**    | Tema editorial (indexável)                                     | Sim                                             |
| **Tag**          | Marcação livre, não indexável no início                        | Opcional                                        |
| **Lead**         | Contato comercial com contexto de origem                       | Sim                                             |
| **Inscrição**    | Newsletter                                                     | Estrutura pronta, ativação depois               |
| **Case / Prova** | Cliente, resultado, depoimento                                 | Estrutura pronta, **vazia até haver dado real** |
| Evento, Material | Futuros                                                        | Não                                             |

## 05. Sitemap

```text
/                                   Home
/sobre                              Sobre
/sobre/especialistas                Diretório de especialistas
/sobre/especialistas/[slug]         Perfil do especialista
/solucoes                           Índice de soluções (grupos: Consultorias | Serviços)
/solucoes/[slug]                    Página de solução  ← única URL canônica da entidade
/blog                               Blog
/blog/categoria/[slug]              Categoria (indexável)
/blog/[slug]                        Artigo
/contato                            Contato
/contato/obrigado                   Confirmação (medição de conversão)
/politica-de-privacidade            Legal
/termos-de-uso                      Legal
(404)                               Página não encontrada, com saídas úteis

Reservadas, não construídas agora:
/cases  /eventos  /newsletter  /materiais
```

Notas:

- **[PROPOSTA]** `/servicos` não é uma árvore própria: ver D1. Se o cliente exigir a URL, ela existe como **visão filtrada** de `/solucoes`, nunca como segunda página da mesma solução.
- **[PROPOSTA]** Categoria em caminho (`/blog/categoria/gestao`) e não em parâmetro: é uma página com identidade e pode ser indexada. Tags começam como filtro sem página própria, para não criar páginas finas.
- **[PROPOSTA]** Autor não tem URL própria: o "arquivo do autor" é o perfil do especialista (seção "Conteúdos publicados").

## 06. Navegação

**Desktop [PROPOSTA]**

```text
[DM Empresarial]        Sobre   Soluções   Blog                [ Fale com a DM ]
```

**Mobile [PROPOSTA]**

```text
[DM Empresarial]                                        [☰]
   ↓ abre painel de tela cheia
   Sobre · Soluções · Blog · Contato
   (CTA "Fale com a DM" fixo no rodapé do painel)
```

Regras:

- Sem mega-menu (Prompt 1, §6). "Soluções" abre a página de índice; não há dropdown na v1.
- O CTA é o único elemento de destaque do cabeçalho e leva a `/contato`.
- **Qualquer página chega ao formulário em no máximo 2 cliques** (critério de aceite).
- O item ativo é sempre indicado (não só por cor). Breadcrumb apenas em páginas com 2+ níveis (perfil de especialista, categoria, artigo).
- Teclado e leitor de tela: menu mobile é um diálogo com foco preso, `Esc` fecha, botão com estado expandido/fechado.

**Rodapé** (Prompt 1, §24): navegação (Sobre, Soluções, Blog, Contato), contato, redes sociais, links legais. Só entra o que for real: hoje o único dado de contato confirmado é o endereço. Telefone, e-mail e redes ficam **omitidos até serem fornecidos** (L-05).

## 07. Home

Ordem validada segundo UX e conversão:

```text
1 HERO → 2 RECONHECIMENTO → 3 SOLUÇÕES → 4 COMO A DM PENSA → 5 ESPECIALISTAS → 6 CONTEÚDO → 7 PROVA* → 8 CTA
                                                                                               *só com dado real
```

| #   | Seção           | Objetivo                                            | Conteúdo                                                                                                                                                    | Depende de                                            |
| --- | --------------- | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| 1   | Hero            | Responder: quem, o quê, para quem, qual ação        | "DM Empresarial · Consultoria empresarial · Frutal/MG"; headline; descrição; CTA primário "Fale com a DM"; secundário "Conheça nossas soluções"             | Textos do Prompt 1 [CONFIRMADO como ponto de partida] |
| 2   | Reconhecimento  | Fazer o visitante reconhecer a própria situação     | Situações reais (empresa desorganizada, caixa apertado, dívidas, falta de processo, dificuldade de crescer), escritas como cenas, não como lista de "dores" | Validação da DM (L-07)                                |
| 3   | Soluções        | Ligar cada situação à abordagem da DM               | Soluções agrupadas por problema, com hierarquia (uma em destaque)                                                                                           | Soluções reais (L-06)                                 |
| 4   | Como a DM pensa | Mostrar raciocínio e valores antes de pedir contato | Os 5 valores confirmados + "como trabalhamos" em poucas linhas                                                                                              | Textos da DM (L-04)                                   |
| 5   | Especialistas   | Dar rosto e autoridade                              | Pessoas reais, com link para o perfil                                                                                                                       | Especialistas e fotos (L-08)                          |
| 6   | Conteúdo        | Provar que a DM produz conhecimento                 | Artigo em destaque + secundários + categorias                                                                                                               | Artigos publicados (L-14)                             |
| 7   | Prova           | Reduzir risco percebido                             | Cases, resultados e depoimentos **autorizados**                                                                                                             | Dados reais (L-09)                                    |
| 8   | CTA             | Fechar com um convite específico                    | Convite + caminho para `/contato`                                                                                                                           | —                                                     |

**Ausência de dado = a seção não aparece.** Não há "em breve", "Cliente X" nem número ilustrativo. Se a Prova não existir, a Home vai de Conteúdo direto para o CTA final.

**Headline provisória (C6).** "Consultoria que transforma empresas" fica como ponto de partida, conforme o Prompt. Recomendação: a DM validar uma frase que descreva o que ela realmente faz para quem, antes do lançamento. Não foi proposta outra proposta de valor: falta informação para justificá-la.

## 08. Soluções (modelo reutilizável)

Cada página de solução responde a uma sequência de perguntas, não a um "título + descrição + botão":

| Bloco                      | Pergunta que responde                 | Formato                                    | Se faltar conteúdo |
| -------------------------- | ------------------------------------- | ------------------------------------------ | ------------------ |
| Hero                       | Qual é o problema, em uma frase?      | Título + resumo + CTA                      | Página não publica |
| Contexto                   | O que está acontecendo com a empresa? | Texto curto, situação reconhecível         | Página não publica |
| Problemas atendidos        | Em quais situações isso se aplica?    | Lista curta de situações                   | Bloco oculto       |
| Diagnóstico                | Como a DM analisa?                    | Texto + perguntas que a DM faz             | Bloco oculto       |
| Abordagem                  | Como a DM atua?                       | Texto                                      | Página não publica |
| Processo                   | Quais são as etapas?                  | Etapas numeradas (sequência real)          | Bloco oculto       |
| Objetivos / benefícios     | Onde se quer chegar?                  | Objetivos, **nunca garantia de resultado** | Bloco oculto       |
| Especialistas relacionados | Quem conduz isso?                     | Perfis vinculados                          | Bloco oculto       |
| Conteúdos relacionados     | Onde aprofundar?                      | Artigos vinculados                         | Bloco oculto       |
| CTA                        | Como conversar?                       | Convite contextual à solução               | Sempre presente    |

**Regra de publicação:** uma solução só é publicada se tiver Hero, Contexto e Abordagem reais. Os demais blocos aparecem quando preenchidos.

**Índice `/solucoes`:** organizado por **problema/contexto**, com dois grupos identificados (Consultorias e Serviços). Não é tabela de preços e não exibe preço.

## 09. Serviços (e a diferença para Consultoria)

Critério de classificação **[PROPOSTA]**, para resolver a sobreposição C2:

| Pergunta                                                     | Sim →       | Não →       |
| ------------------------------------------------------------ | ----------- | ----------- |
| Tem escopo fechado e uma entrega definida?                   | Serviço     | Consultoria |
| Começa por diagnóstico aberto e acompanha ao longo do tempo? | Consultoria | Serviço     |

Exemplos do Prompt (não definitivos, **[LACUNA L-06]**): Consultorias — Estratégica, Gestão, Finanças, Processos, Marketing. Serviços — Recuperação de Crédito, Reorganização de Dívidas, Reestruturação de Gestão.

Regras de linguagem para temas sensíveis (crédito e dívida): descrever o **que a DM faz e como analisa**, não prometer aprovação, redução de dívida ou prazo. Qualquer termo regulado deve passar por revisão jurídica (L-11).

## 10. Sobre

```text
HERO → QUEM SOMOS → COMO PENSAMOS → COMO TRABALHAMOS → VALORES → ESPECIALISTAS → CTA
```

| Bloco            | Responde                    | Conteúdo hoje                                                                                                 |
| ---------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Quem somos       | Quem é a DM?                | Só o que é confirmado: consultoria empresarial em Frutal/MG. **[LACUNA L-04]** história, fundação, fundadores |
| Como pensamos    | Por que existe? Como pensa? | **[LACUNA L-04]** texto da DM                                                                                 |
| Como trabalhamos | Como atua?                  | **[LACUNA L-04]** e alinhado às etapas reais                                                                  |
| Valores          | Quais princípios?           | 5 valores [CONFIRMADO]. Cada um pode ganhar uma frase de "como se vê na prática", escrita pela DM             |
| Especialistas    | Quem está por trás?         | Vem do diretório                                                                                              |

Regra: nenhum valor além dos cinco; nenhum indicador numérico (anos de mercado, clientes atendidos) sem dado real.

## 11. Especialistas

**Diretório (`/sobre/especialistas`)** — por pessoa: foto, nome, cargo, especialidades, resumo, link "Conheça o especialista".

**Perfil (`/sobre/especialistas/[slug]`)**

```text
HERO → BIOGRAFIA → EXPERIÊNCIA → ESPECIALIDADES → FORMAÇÃO → ÁREAS DE ATUAÇÃO → CONTEÚDOS PUBLICADOS → SOLUÇÕES RELACIONADAS → CTA
```

**Regra de publicação de perfil (mínimo):** nome, cargo, foto real e resumo confirmado pela própria pessoa. Blocos de Experiência, Formação e Especialidades **só aparecem se preenchidos**; nada de currículo inferido, certificação presumida ou resultado atribuído.

Conteúdos publicados e Soluções relacionadas são automáticos, vindos dos vínculos (seção 17). Se a pessoa não tem artigos, o bloco some.

**[LACUNA L-08]** Quem são os especialistas, cargos, fotos, biografias e autorização de uso de imagem.

## 12. Blog

**Página `/blog`** — headline [CONFIRMADO]: "Conhecimento para quem toma decisões."

```text
Hero de texto → Artigo em destaque → Artigos secundários → Categorias → Listagem editorial → Paginação
```

- Descoberta editorial, não parede de cards: hierarquia entre artigo principal, secundários e lista.
- Categorias iniciais [CONFIRMADO]: Gestão, Finanças, Marketing, Processos, Empreendedorismo, Mercado, Negócios em Frutal e Região. Categorias novas devem ser possíveis sem mexer em código.
- Busca: ver D6.
- Estados vazios previstos: blog sem artigos, categoria sem artigos, busca sem resultado (com saída para todas as categorias).

**Formatos editoriais [PROPOSTA]** (ajudam quem escreve a seguir a lógica acontecimento → aplicação, sem fórmulas de "5 dicas"): Análise (a partir de um fato), Leitura de mercado, Conceito aplicado, Caso, Opinião, Regional.

## 13. Artigo

```text
Categoria → Título → Subtítulo → Autor → Data → Tempo de leitura → Capa → Conteúdo → Bloco do autor → Relacionados → CTA
```

Regras:

- Leitura primeiro: sem popups, sem banners, sem CTAs no meio do texto.
- **CTA contextual** só ao final: se o artigo tem solução relacionada, o convite fala dessa solução; se não, cai no convite genérico "Fale com a DM".
- Bloco opcional "Aplicação na empresa" (fecha o raciocínio acontecimento → aplicação).
- Relacionados por prioridade: escolha editorial → mesma solução → mesma categoria → mesma tag.
- Publicar exige: título, categoria, autor, data, corpo. Capa, subtítulo, solução relacionada são opcionais.

## 14. Contato

`/contato` é a conversão principal.

| Campo         | Obrigatório? | Nota                                                                   |
| ------------- | ------------ | ---------------------------------------------------------------------- |
| Nome          | Sim          |                                                                        |
| E-mail        | Sim          |                                                                        |
| Mensagem      | Sim          |                                                                        |
| Telefone      | Não          | Para retorno por WhatsApp/ligação                                      |
| Empresa       | Não          |                                                                        |
| Cargo         | Não          |                                                                        |
| Segmento      | Não          | Lista de opções, não campo livre                                       |
| Site          | Não          |                                                                        |
| Consentimento | Sim          | Aceite de tratamento de dados, com link para a Política de Privacidade |

(Todos os 8 campos do Prompt são coletados; apenas 3 são obrigatórios. Ver D3.)

Layout de informação: à esquerda, convite e dados reais (endereço [CONFIRMADO]; telefone/e-mail/WhatsApp quando existirem); à direita, o formulário. Sem mapa incorporado (evita carregar terceiros); apenas link "Ver no mapa".

Confirmação: mensagem no próprio lugar + rota `/contato/obrigado` para medir conversão. **Não prometer prazo de resposta** sem a DM confirmar o compromisso (L-12).

**[LACUNA L-05]** telefone, WhatsApp, e-mail, redes sociais, horário. Nada disso é inventado.

## 15. Lead journey

```text
Origem (Google/indicação/social/direto)
  → Página de entrada (landing)
  → Artigo ou Solução consumida
  → /contato
  → Lead registrado COM contexto
  → Confirmação → Atendimento pela DM
```

Contexto que o lead carrega **[PROPOSTA]**, alinhado ao Prompt 1, §22:

| Campo             | Significado                                         |
| ----------------- | --------------------------------------------------- |
| `source`/`medium` | De onde veio (parâmetros de campanha ou referência) |
| `campaign`        | Campanha, quando houver                             |
| `landing_page`    | Primeira página da visita                           |
| `article`         | Artigo lido antes do contato, se houver             |
| `solution`        | Solução consultada antes do contato, se houver      |

Regras: coleta apenas de origem, sem perfilamento do visitante; declarada na Política de Privacidade; a decisão jurídica sobre consentimento/cookies vem antes de implementar (L-11). O botão "Fale com a DM" numa página de solução ou artigo já leva a origem para o formulário.

## 16. Sistema editorial

- **Lógica:** acontecimento → observação → análise → insight → aplicação empresarial.
- **Ciclo bidirecional:** artigo abastece a autoridade e leva a uma solução; a solução define temas que pedem novos artigos.
- **Papéis (a definir pela DM, L-14 a L-16):** quem propõe pauta, quem escreve, quem revisa/aprova, quem publica, frequência realista.
- **Padrão de qualidade mínimo [PROPOSTA]:** todo artigo tem autor identificado, categoria e uma tese explícita; conteúdo local (Frutal/região) tem fonte citada; dado de mercado tem referência.
- **Proibido:** conteúdo apenas para preencher calendário; números sem fonte; casos de cliente sem autorização.

## 17. Relacionamento de conteúdo

```text
Artigo ──N:1── Categoria
Artigo ──N:M── Tag
Artigo ──N:1── Especialista (autor)
Artigo ──N:M── Solução     (uma pode ser "principal", que define o CTA)
Solução ──N:M── Especialista
Especialista ──N:M── Categoria (áreas de atuação)
Lead ──0..1── Artigo / Solução de origem
```

O que cada vínculo produz na tela:

| Onde estou   | O que a rede mostra                                                  |
| ------------ | -------------------------------------------------------------------- |
| Artigo       | Autor, solução relacionada (CTA), artigos da mesma solução/categoria |
| Solução      | Especialistas vinculados, artigos vinculados                         |
| Especialista | Artigos que assinou, soluções em que atua, categorias                |
| Categoria    | Artigos, especialistas com atuação nessa categoria                   |

Regra de robustez: nenhum bloco relacionado aparece vazio. Sem vínculo, o bloco não é renderizado.

## 18. Jornadas

| #   | Jornada                 | Passos                                                                    | Ponto crítico                                       | Decisão de UX                                                                  |
| --- | ----------------------- | ------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | Visitante institucional | Home → Sobre → Especialistas → Soluções → Contato                         | Cansar antes de chegar ao contato                   | CTA persistente; Sobre já aponta para especialistas e soluções                 |
| 2   | Visitante comercial     | Busca/indicação → Solução → Problema → Abordagem → Especialista → Contato | Não reconhecer o próprio problema no topo da página | Hero da solução começa pelo problema, não pelo serviço                         |
| 3   | Visitante editorial     | Busca → Artigo → Relacionados → Especialista → Solução → Contato          | Quebrar a leitura com venda                         | Nenhum CTA no meio do texto; convite só ao fim, contextual                     |
| 4   | Visitante regional      | Busca local → Conteúdo local → DM → Frutal/região → Solução → Contato     | Não parecer uma empresa local real                  | Endereço confirmado visível; categoria "Negócios em Frutal e Região" com fonte |

## 19. Princípios de UX

Clareza · Hierarquia · Contexto · Profundidade · Confiança · Fricção mínima · Descoberta · Coerência (Prompt 1, §27). Traduzidos em **critérios verificáveis**:

- Toda página responde "onde estou e o que posso fazer" sem rolar.
- Um CTA primário por tela; o do artigo aparece só ao final.
- Até 2 cliques de qualquer página ao formulário.
- Nenhuma página publicada com dado inventado ou bloco vazio.
- Todo conteúdo tem próximo passo relacionado (artigo, especialista ou solução).
- Vocabulário: proibido "disruptivo", "ecossistema", "jornada transformadora", "potencializar", "sinergia", "360º", "revolucionar".

## 20. Lacunas (o que a DM precisa fornecer)

| ID   | Área           | O que falta                                                                                                                                  | Bloqueia                            |
| ---- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| L-01 | Estratégia     | Metas de leads e prazo; prioridade entre institucional e editorial no lançamento                                                             | Métricas                            |
| L-02 | Identidade     | Existe logotipo/identidade atual? Domínio definitivo? Razão social e CNPJ                                                                    | Design e rodapé legal               |
| L-03 | Posicionamento | Frase que descreve o que a DM faz e para quem (valida ou troca o hero)                                                                       | Hero                                |
| L-04 | Institucional  | História, por que existe, como pensa, como trabalha                                                                                          | Sobre                               |
| L-05 | Contato        | Telefone, WhatsApp, e-mail, redes, horário; quem recebe os leads                                                                             | Contato, rodapé                     |
| L-06 | Soluções       | Lista real, escopo de cada uma, público, etapas, entregas; consultoria × serviço                                                             | Soluções, Home                      |
| L-07 | Problemas      | Situações reais de clientes (anonimizadas) para o bloco de Reconhecimento                                                                    | Home                                |
| L-08 | Pessoas        | Especialistas, cargos, biografias, formação, fotos, autorização de imagem                                                                    | Especialistas, autoria              |
| L-09 | Prova          | Clientes citáveis, cases, resultados e depoimentos com autorização por escrito                                                               | Prova                               |
| L-10 | Fotografia     | Existe acervo? Há acesso para sessão fotográfica em Frutal (equipe, atendimento, cidade)?                                                    | Imagem de marca                     |
| L-11 | Jurídico       | Política de Privacidade, Termos, controlador/encarregado (LGPD), abordagem de cookies/medição, restrições de linguagem para crédito e dívida | Contato, rastreio, textos sensíveis |
| L-12 | Operação       | Prazo real de resposta; fluxo de atendimento; ferramenta para receber leads; ferramenta de newsletter                                        | Confirmação, newsletter             |
| L-13 | Newsletter     | Haverá envio? Frequência? Quem produz?                                                                                                       | Ativação                            |
| L-14 | Editorial      | Quem escreve, quem revisa, frequência, primeiros 5–10 artigos                                                                                | Blog no lançamento                  |
| L-15 | Editorial      | Confirmar as 7 categorias                                                                                                                    | Blog                                |
| L-16 | Editorial      | Política de fontes e de opinião sobre fatos regionais                                                                                        | Qualidade editorial                 |

## 21. Decisões recomendadas

**Status em 21/09/2026:** **D1, D3, D4 e D5 aprovadas.** D2, D6 e D7 seguem como recomendação. Sobre a D3, a pergunta "a DM usa mesmo `site` e `segmento`?" continua aberta; enquanto não houver resposta, todos os 8 campos existem e apenas 3 são obrigatórios.

### D1 — Uma entidade "Solução" ou duas árvores (`/solucoes` e `/servicos`)?

- **Opção A:** `/solucoes/[slug]` é a única URL de detalhe; `tipo` (consultoria/serviço) é um atributo. `/servicos` vira visão filtrada, se necessária.
- **Opção B:** manter `/solucoes` e `/servicos` como árvores independentes, como no Prompt.
- **Impacto:** B cria duas URLs possíveis para a mesma coisa, obriga o visitante a decidir entre "solução" e "serviço" antes de entender o problema, e duplica manutenção. A preserva a intenção do Prompt (evitar confusão).
- **Recomendação: A.** Menu passa a ter "Soluções" e não "Serviços". Custo de mudar agora: nenhum (nada foi construído). Custo depois: redirecionamentos. **Precisa de aprovação, pois altera a navegação dada.**

### D2 — "Contato" no menu junto do CTA "Fale com a DM"?

- **Opção A:** ambos no menu.
- **Opção B:** só o CTA no desktop; "Contato" no menu mobile, rodapé e página.
- **Impacto:** A dilui o único destaque; B mantém um destino óbvio. Risco de B: quem procura literalmente "Contato".
- **Recomendação: B**, com o CTA rotulado exatamente "Fale com a DM" e "Contato" sempre presente no rodapé e no menu mobile.

### D3 — Quantos campos são obrigatórios no formulário?

- **Opção A:** todos os 8 obrigatórios (coleta máxima).
- **Opção B:** 3 obrigatórios (nome, e-mail, mensagem) + consentimento; os demais opcionais.
- **Impacto:** A reduz conversão sem melhorar a qualificação de forma proporcional; B mantém os dados úteis quando a pessoa quer dá-los.
- **Recomendação: B.** Todos os 8 campos existem; só 3 travam o envio.

### D4 — O que publicar no lançamento sem conteúdo real?

- **Opção A:** publicar todas as páginas do mapa com estados "em breve".
- **Opção B:** publicar apenas o que tem conteúdo real mínimo; o resto existe, mas fica fora do menu, do sitemap e da indexação.
- **Impacto:** A entrega a sensação de site incompleto e cria páginas vazias indexáveis; B mostra menos, mas com confiança.
- **Recomendação: B**, com as regras de publicação mínima das seções 08, 11 e 13.

### D5 — O autor de um artigo é sempre um especialista?

- **Opção A:** sim, uma única entidade Pessoa.
- **Opção B:** autor e especialista são entidades separadas.
- **Impacto:** A gera o "arquivo do autor" gratuitamente e reforça a rede de autoridade; B permite convidados sem perfil, mas duplica cadastro.
- **Recomendação: A**, com marcação "autor convidado" para quem não é da DM (perfil reduzido, sem URL).

### D6 — Quando ligar a busca do blog?

- **Opção A:** busca desde o lançamento.
- **Opção B:** navegação por categoria e relacionados primeiro; busca ao passar de um volume mínimo de artigos (sugestão: cerca de 20).
- **Impacto:** com poucos artigos, a busca vira uma caixa que devolve quase nada.
- **Recomendação: B.**

### D7 — Home sem Prova: quando entra a seção?

- **Recomendação:** só quando houver pelo menos um item com dado real e autorização (L-09). Nunca com números provisórios.

## 22. Próxima etapa

1. **Design System (Prompt 2)** — documento irmão em [02-design-system-blueprint.md](./02-design-system-blueprint.md).
2. **Antes do design ser implementado:** a DM decidir D1–D6 e responder, no mínimo, L-02, L-03, L-05, L-06 e L-08. Sem isso, as páginas públicas podem ser construídas, mas com blocos condicionais vazios.
3. **Mapeamento para o repositório:** a fundação técnica já existe (fase 1). As entidades da seção 04 e as relações da seção 17 são a base para a etapa de banco/modelagem; as regras de publicação (seções 08, 11, 13) são requisitos do CMS.
