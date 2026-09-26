# DM Empresarial — Design System Blueprint

Versão 1 · 21/09/2026 · Etapa: Prompt 2 (direção visual). Sem código, sem componentes, sem bibliotecas instaladas. Depende de [01-product-ux-blueprint.md](./01-product-ux-blueprint.md).

**Legenda**

- **[CONFIRMADO]** vem do Prompt 2 ou do repositório.
- **[PROPOSTA]** decisão deste documento, a validar.
- **[LACUNA]** depende de informação/material que a DM ainda não forneceu.
- **[MEDIDO]** número calculado neste trabalho (contraste WCAG 2.x e existência das fontes no Next), não estimado.

**Ponto de partida herdado do código.** O comentário em `src/app/globals.css` já cita os papéis de cor **papel, tinta, verde-tinta, areia, terracota** e "escala tipográfica e de espaçamento". Este documento **mantém esses cinco nomes** e define os valores.

---

## 01. Direção criativa

### DECISÃO — Conceito: "papel e tinta"

**O que foi definido:** a DM parece um **relatório impresso bem editado que ganhou vida na tela**: fundo de papel quente, texto em tinta quase preta, títulos em serifa editorial, verde-tinta profundo como cor de autoridade, areia como superfície de apoio e terracota reservada para a ação de contato. Estrutura por **linhas finas e espaço**, não por caixas e sombras.

**Por quê:** consultoria empresarial no Brasil tende a azul-corporativo com sans-serif e cards. Papel + serifa + verde-tinta comunica _análise, método e maturidade_ (o que a DM vende) sem parecer tecnologia, e cria diferenciação imediata.

**Impacto na experiência:** leitura longa confortável, hierarquia clara mesmo sem imagens (importante: **hoje não há fotos**), e uma cor de ação que o visitante aprende a reconhecer.

**Alternativas consideradas:** (1) azul-marinho + sans neutra — descartada por ser o template do setor; (2) preto + acento vibrante — descartada por soar startup/SaaS; (3) monocromia editorial pura — descartada por faltar calor e uma cor que sinalize ação.

**Regra para implementação:** toda tela deve funcionar em **papel + tinta + linha fina** antes de receber cor. Cor é acréscimo com função.

## 02. Personalidade visual

| Eixo                            | Como aparece (regra concreta)                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Sofisticada sem ser elitista    | Serifa editorial em tamanho generoso; sem dourado, sem brilho, sem "luxo" artificial                   |
| Empresarial sem ser burocrática | Estrutura de relatório (linhas, rótulos de seção) com texto humano; sem clip-art corporativo           |
| Moderna sem seguir tendência    | Nada de glassmorphism, gradiente, blob, 3D; a modernidade vem de escala, assimetria e espaço           |
| Humana sem ser informal         | Pessoas reais em fotografia documental; microcopy direta ("Fale com a DM")                             |
| Editorial sem parecer revista   | Hierarquia de publicação e medida de leitura; sem capas de revista, sem manchetes em caixa alta        |
| Sóbria sem ser fria             | Paleta quente (papel/areia) contra verde profundo                                                      |
| Premium sem ser luxuosa         | Qualidade percebida por tipografia, alinhamento e acabamento; nenhum efeito para "provar" sofisticação |

## 03. Princípios de design

1. **Tipografia antes de efeito.** Se a interface pede efeito para parecer boa, a composição está errada.
2. **Linha, não caixa.** Divisores finos estruturam; contêineres com fundo só quando há razão.
3. **Cor tem função.** Terracota = ação de conversão. Verde-tinta = autoridade. Areia = superfície. Nunca decoração.
4. **Escala com contraste.** Grande e pequeno convivem; o meio-termo uniforme é evitado.
5. **Assimetria com propósito.** Divisões 5/7 e 4/8 para dar direção; simetria só quando o conteúdo é simétrico.
6. **Dado real ou nada.** Numeral grande só com número verdadeiro; foto só de pessoa real.
7. **Leitura primeiro.** Medida de coluna, altura de linha e contraste vencem qualquer ornamento.
8. **Movimento discreto.** Comunica estado, nunca chama atenção para si.

## 04. Grid

### DECISÃO — 12 colunas, com espaço negativo deliberado

**O que foi definido:**

| Faixa (largura da tela)       | Colunas | Gutter | Margem lateral                  | Comportamento                                                 |
| ----------------------------- | ------- | ------ | ------------------------------- | ------------------------------------------------------------- |
| Base (< 640 px)               | 4       | 16 px  | 20 px                           | Coluna única, hierarquia por ordem e escala                   |
| `sm` (≥ 640 px)               | 4       | 16 px  | 24 px                           | Mesma estrutura, mais respiro                                 |
| `md` (≥ 768 px, tablet)       | 8       | 24 px  | 32 px                           | Duas colunas onde há ganho de leitura                         |
| `lg` (≥ 1024 px)              | 12      | 24 px  | 40 px                           | Composição assimétrica completa                               |
| `xl` (≥ 1280 px)              | 12      | 32 px  | automática (container centrado) | Container em largura máxima                                   |
| `2xl` (≥ 1536 px, widescreen) | 12      | 32 px  | automática                      | Container **não cresce**; faixas de fundo sangram até a borda |

**Por quê:** 12 colunas permitem 5/7, 4/8, 3/9 e 6/6 sem inventar grid por seção. Em telas muito largas, esticar o conteúdo destruiria a medida de leitura.

**Impacto:** todas as seções compartilham as mesmas linhas de coluna, o que dá a sensação de "diagramação" que sustenta o eixo editorial.

**Alternativas consideradas:** grid de 16 colunas (mais flexível, mais fácil de desalinhar); layout fluido sem grid (rejeitado: cada seção inventaria o seu).

**Regra para implementação:** só existem cinco padrões de divisão: `12`, `7+5`, `5+7`, `8+4`, `4+8`. Nenhuma seção define grid próprio.

## 05. Containers

| Variante  | Largura máxima | Uso                                 |
| --------- | -------------- | ----------------------------------- |
| `default` | 1200 px        | Conteúdo geral                      |
| `wide`    | 1360 px        | Hero, imagens de destaque, faixas   |
| `reading` | 680 px         | Texto corrido de artigo e biografia |
| `narrow`  | 560 px         | Formulário e mensagens de estado    |

Padding horizontal = margem lateral da tabela anterior. Alinhamento à esquerda; centralizar apenas títulos curtos de até duas linhas em páginas de estado (404, confirmação). **Regra:** texto corrido nunca ultrapassa `reading`.

## 06. Spacing

### DECISÃO — escala base 4 px, dez degraus

| Token | Valor  | Uso principal                                           |
| ----- | ------ | ------------------------------------------------------- |
| `2xs` | 4 px   | Ajuste fino entre ícone e texto                         |
| `xs`  | 8 px   | Entre rótulo e campo; itens de metadata                 |
| `sm`  | 12 px  | Dentro de botões e campos                               |
| `md`  | 16 px  | Entre parágrafos curtos; gutter mobile                  |
| `lg`  | 24 px  | Entre título e texto; gutter desktop                    |
| `xl`  | 32 px  | Entre blocos dentro de uma seção                        |
| `2xl` | 48 px  | Entre grupos de conteúdo                                |
| `3xl` | 64 px  | Padding de seção no mobile                              |
| `4xl` | 96 px  | Padding de seção no desktop                             |
| `5xl` | 144 px | Respiração de impacto (após hero, antes de fechamentos) |

**Por quê:** base 4 gera ritmo previsível; os degraus altos existem porque o "espaço negativo deliberado" é parte da identidade.

**Regra:** o espaço entre seções vai de `3xl` (mobile) a `4xl`/`5xl` (desktop), interpolado com a largura da tela. **Nenhum valor fora da escala.** Espaço interno pequeno nunca é maior que o espaço entre elementos.

## 07. Tipografia

### DECISÃO — duas famílias com papéis distintos

**O que foi definido:**

| Papel                                                     | Família             | Uso                                                                   |
| --------------------------------------------------------- | ------------------- | --------------------------------------------------------------------- |
| **Voz editorial** (Display, Headline, texto longo)        | **Newsreader**      | Títulos, citações, corpo de artigo e de biografia                     |
| **Voz de interface** (UI, Body, Label, Caption, Metadata) | **Instrument Sans** | Navegação, botões, campos, rótulos, metadados, textos curtos de apoio |

**[MEDIDO]** Ambas existem na base de fontes do Next 16.3.5 instalado, com suporte a subconjunto latino (cobre acentos do português). Newsreader: eixos `opsz` 6–72 e `wght` 200–800. Instrument Sans: `wght` 400–700.

**Por quê:** Newsreader foi desenhada para leitura em tela e tem **eixo óptico** (`opsz`): os cortes grandes são refinados e os pequenos, robustos, o que serve tanto ao título gigante quanto ao artigo. Instrument Sans é neutra o bastante para interface, com personalidade suficiente para não parecer padrão de template.

**Impacto:** o visitante _sente_ a diferença entre "ler" (serifa) e "operar" (sans) sem que ninguém explique. Isso é identidade tipográfica, não decoração.

**Alternativas consideradas:**

| Alternativa    | Motivo da recusa                                                              |
| -------------- | ----------------------------------------------------------------------------- |
| Inter          | Presente em incontáveis templates e SaaS                                      |
| Fraunces       | Muito expressiva ("wonky"/suave); envelhece rápido como tendência             |
| Source Serif 4 | Excelente, porém mais neutra; boa segunda opção se Newsreader falhar em teste |
| IBM Plex Sans  | Conotação técnica/tecnológica                                                 |
| Hanken Grotesk | Boa, mas genérica frente à Instrument Sans                                    |

**Regra para implementação:** carregar as duas por self-hosting do framework (sem requisição a terceiros), com troca segura (`swap`), apenas Newsreader (normal + itálico) e Instrument Sans (normal): **3 arquivos variáveis**. Orçamento de fontes: ≲ 150 KB no total. **Medido na implementação (21/09/2026):** com o eixo `opsz`, a Newsreader (normal + itálico, subconjunto latino) pesa 272 KB; **sem `opsz`, 120 KB** (+ 29 KB da Instrument Sans = **149 KB**, dentro do orçamento). **Decisão: sem `opsz`.** O que se perde é o corte óptico mais refinado nos títulos muito grandes; a hierarquia, a leitura e o caráter da fonte se mantêm. Reavaliar só se a revisão visual com a DM exigir. Itálico só para ênfase e citação. Texto corrido longo (artigo, biografia) em Newsreader; textos curtos de apoio em Instrument Sans.

## 08. Escala tipográfica

Tamanhos **fluidos** (mínimo → máximo conforme a largura). Valores em px equivalentes.

| Nível               | Família         | Mobile → Desktop | Altura de linha | Peso | Tracking  | Uso                                                   |
| ------------------- | --------------- | ---------------- | --------------- | ---- | --------- | ----------------------------------------------------- |
| Display XL          | Newsreader      | 48 → 112         | 0,95            | 400  | −0,03 em  | Hero da Home; uma vez por página no máximo            |
| Display L           | Newsreader      | 40 → 80          | 1,0             | 400  | −0,025 em | Hero de solução, perfil de especialista               |
| Display M           | Newsreader      | 36 → 60          | 1,05            | 400  | −0,02 em  | Destaque editorial, chamada de fechamento             |
| H1                  | Newsreader      | 36 → 56          | 1,1             | 500  | −0,015 em | Título de página e de artigo                          |
| H2                  | Newsreader      | 28 → 40          | 1,15            | 500  | −0,01 em  | Seções                                                |
| H3                  | Newsreader      | 22 → 28          | 1,25            | 500  | 0         | Cards, subseções                                      |
| H4                  | Instrument Sans | 18 → 20          | 1,35            | 600  | 0         | Agrupamentos curtos, itens de lista técnica           |
| Body Large          | Instrument Sans | 20 → 22          | 1,5             | 400  | 0         | Introdução de página, lead                            |
| Body                | Instrument Sans | 17 → 18          | 1,6             | 400  | 0         | Texto padrão                                          |
| Body Small          | Instrument Sans | 15 → 16          | 1,5             | 400  | 0         | Apoio, notas                                          |
| **Texto de artigo** | Newsreader      | 19 → 21          | 1,65            | 400  | 0         | Corpo de artigo e biografia (`reading`, 680 px)       |
| Label               | Instrument Sans | 13 → 14          | 1,3             | 600  | +0,04 em  | Rótulos de seção e categoria (caixa alta **só aqui**) |
| Caption             | Instrument Sans | 13 → 14          | 1,4             | 400  | 0         | Legenda de imagem                                     |
| Metadata            | Instrument Sans | 13 → 14          | 1,4             | 500  | +0,02 em  | Data, tempo de leitura, autor                         |

Regras: mínimo de 16 px em texto corrido no mobile (exceto Caption/Label/Metadata a partir de 13 px); títulos com quebra balanceada e parágrafos com quebra sem órfãs; caixa alta apenas em Label; nenhum título em caixa alta.

**Tratamentos de título (Prompt 2, §13):**

| Tipo                | Tratamento                                                                            |
| ------------------- | ------------------------------------------------------------------------------------- |
| Editorial (blog)    | Newsreader regular, caixa de frase, uma palavra-chave em itálico quando ajudar a tese |
| Institucional       | Display grande, com filete fino e Label de seção acima                                |
| Comercial (solução) | Frase que começa pelo problema; peso 500; CTA próximo, nunca dentro do título         |
| Artigo              | H1 com corte óptico alto, subtítulo em Body Large na cor secundária                   |
| Seção               | Label + H2, separados por filete; sem repetir a mesma fórmula em todas as seções      |

## 09. Cores

### DECISÃO — paleta contida de cinco nomes

**O que foi definido** (valores **[PROPOSTA]**, contrastes **[MEDIDO]** contra os fundos indicados):

| Token (nome de marca) | Hex       | Papel                                                                        | Proporção aprox.        |
| --------------------- | --------- | ---------------------------------------------------------------------------- | ----------------------- |
| **Papel**             | `#F6F2EA` | Fundo principal                                                              | ~55 %                   |
| **Papel elevado**     | `#FCFAF6` | Campos de formulário, superfícies elevadas                                   | (na proporção do Papel) |
| **Areia**             | `#E9E0CF` | Superfície de apoio (blocos, faixas claras)                                  | ~15 %                   |
| **Tinta**             | `#18201C` | Texto principal; linhas fortes                                               | (texto)                 |
| **Tinta secundária**  | `#46514B` | Texto secundário                                                             | (texto)                 |
| **Tinta suave**       | `#66706A` | Metadata e legendas                                                          | (texto)                 |
| **Verde-tinta**       | `#1F3B33` | Autoridade: faixas escuras, rodapé, links, foco                              | ~20 %                   |
| **Terracota**         | `#A8482A` | **Somente ação de conversão** (CTA "Fale com a DM") e estados ativos de ação | ≤ 5 %                   |
| **Terracota escura**  | `#8F3B20` | Hover/active do CTA                                                          | —                       |
| **Linha fina**        | `#D8CFBD` | Divisores decorativos                                                        | —                       |
| **Borda de campo**    | `#857E6E` | Contorno de inputs (precisa de 3:1)                                          | —                       |
| **Sucesso**           | `#2C6A45` | Confirmação                                                                  | —                       |
| **Aviso**             | `#7F5300` | Atenção                                                                      | —                       |
| **Erro**              | `#A01E3C` | Erro (carmim, distinto da terracota)                                         | —                       |

**Por quê:** o par papel + verde-tinta dá autoridade e calor; terracota é a única cor "quente" viva e por isso funciona como **sinal**. Erro é carmim (não vermelho-terroso) para não se confundir com terracota.

**Impacto:** a cada visita o usuário aprende: _terracota = falar com a DM_. Isso é conversão por consistência, não por urgência artificial.

**Alternativas consideradas:** azul institucional (setor inteiro usa); preto com laranja (SaaS); verde vibrante (soa financeiro/varejo).

**Regra para implementação:** (1) terracota **só** em botão de conversão e no seu estado; nunca em texto decorativo, ícone ou divisor. (2) Verde-tinta nas faixas escuras, links e anel de foco. (3) Areia para agrupar, nunca como "caixa" de card padrão. (4) Não introduzir cor nova: se surgir necessidade, revisar o token, não somar.

**Versões de fundo:**

| Contexto              | Fundo       | Texto principal | Texto secundário | Ação (CTA)             | Link / foco       |
| --------------------- | ----------- | --------------- | ---------------- | ---------------------- | ----------------- |
| Claro (padrão)        | Papel       | Tinta           | Tinta secundária | Terracota, texto Papel | Verde-tinta       |
| Faixa de apoio        | Areia       | Tinta           | Tinta secundária | Terracota              | Verde-tinta       |
| Escuro (faixa/rodapé) | Verde-tinta | Papel           | Areia            | Terracota, texto Papel | Papel, sublinhado |

**Estados interativos:** hover do CTA = Terracota escura; hover de link = sublinhado mais espesso; foco = anel de 2 px em Verde-tinta (em fundo escuro, Papel) com 2 px de afastamento; ativo = cor do hover; desabilitado = Areia com texto Tinta secundária, sem sombra.

### REVISÃO (26/09/2026) — azul da marca como cor de ação

**Decisão do cliente:** a cor de ação, link e foco passa a ser o **Azul da marca** (`#5C6C9D`), que substitui a Terracota nesses papéis. A tipografia segue a da seção 07 (Newsreader + Instrument Sans). A Terracota continua no arquivo de tokens, sem uso semântico.

| Token             | Hex       | Papel                                                      |
| ----------------- | --------- | ---------------------------------------------------------- |
| **Azul da marca** | `#5C6C9D` | CTA ("Fale com a DM"), link e foco no fundo Papel          |
| **Azul escuro**   | `#4A5780` | Hover do CTA (todas as faixas); link e foco na faixa Areia |
| **Azul claro**    | `#8AA0D4` | Link e foco na faixa escura. **Nunca** como fundo de botão |

**[MEDIDO]:** Papel sobre Azul 4,60:1 (AA); Papel sobre Azul escuro 6,34:1; Azul escuro sobre Areia 5,40:1; Azul claro sobre Verde-tinta 4,65:1. **Proibidos:** Azul sobre Areia (3,92:1) como texto; Papel sobre Azul claro (2,33:1). Os pares ficam protegidos em `tests/design-tokens.test.ts`.

## 10. Contraste

**[MEDIDO]** — razão de contraste WCAG 2.x calculada sobre os valores acima.

| Par                                                 | Razão              | Resultado                       |
| --------------------------------------------------- | ------------------ | ------------------------------- |
| Tinta sobre Papel (texto)                           | 14,90              | AAA                             |
| Tinta sobre Areia                                   | 12,70              | AAA                             |
| Tinta secundária sobre Papel                        | 7,41               | AAA                             |
| Tinta secundária sobre Areia                        | 6,31               | AA                              |
| Tinta suave sobre Papel                             | 4,60               | AA (margem estreita)            |
| Verde-tinta sobre Papel (link)                      | 10,86              | AAA                             |
| Texto Papel sobre Verde-tinta (faixa escura, botão) | 10,86              | AAA                             |
| Areia sobre Verde-tinta (texto secundário na faixa) | 9,26               | AAA                             |
| Texto Papel sobre Terracota (CTA)                   | 5,19               | AA                              |
| Terracota sobre Papel                               | 5,19               | AA                              |
| Terracota escura / Papel (hover)                    | 6,68               | AA                              |
| Sucesso / Aviso / Erro sobre Papel                  | 5,78 / 5,99 / 6,85 | AA                              |
| Borda de campo sobre Papel                          | 3,61               | ≥ 3:1 (componente de interface) |

**Combinações proibidas (falham):**

- **Tinta suave sobre Areia** = 3,92 → em Areia, metadata usa **Tinta secundária**.
- **Terracota sobre Verde-tinta** = 2,09 → terracota **nunca** como texto, linha ou ícone em fundo escuro. O botão CTA em faixa escura mantém o rótulo Papel sobre Terracota (5,19); o contorno do botão não é o que o identifica.

**Regras:** meta AA para todo texto e AAA para o corpo do artigo; Tinta suave apenas a partir de 13 px e em metadata; nunca transmitir informação só por cor (erro = ícone + texto); todos os valores devem ser **revalidados com ferramenta** na implementação e depois de qualquer ajuste de matiz.

## 11. Fotografia

### DECISÃO — documental, real e sem banco de imagens

**O que foi definido:** luz natural, contexto real de trabalho (escritório, atendimento, comércio e ruas de Frutal/região), pessoas em ação, enquadramentos com ar. Tratamento de cor: neutro-quente, levemente dessaturado, para conviver com Papel e Verde-tinta. Sem filtros nem duotone.

**Por quê:** foto é o maior risco de o site parecer template. Sem foto própria, tudo o mais cai no genérico.

**Impacto:** a imagem passa a ser prova de proximidade e presença real.

**Alternativas consideradas:** banco de imagens (rejeitado, clichê); ilustração (rejeitada: desloca a marca do "humano e real"); imagens geradas por IA (**rejeitada de forma absoluta** para pessoas, clientes e especialistas: viola a regra "nunca inventar").

**Regra para implementação:** **[LACUNA L-10]** hoje não há acervo. Até existir sessão fotográfica, **não usar imagem no lugar de pessoas**: usar composição tipográfica. Imagens só entram quando reais. Alt text obrigatório e descritivo.

**Fotografia regional:** contexto, não turismo. Evitar cartão-postal (praça, monumento); preferir gente trabalhando, comércio em funcionamento, fachadas comuns, luz do dia. Serve à proximidade; nunca à propaganda da cidade.

### Retratos de especialistas

**Proporção 4:5**, meio corpo, mesma distância focal e mesma altura de olhar em todos, luz natural lateral, fundo no tom Papel/Areia **ou** o ambiente real de trabalho (escolher **um** padrão e repetir), expressão natural. Enquadramento seguro: olhos no terço superior; margem de cabeça consistente. Sem retoque pesado, sem fundo cinza de estúdio. **Enquanto não houver retrato real:** monograma (iniciais em Newsreader sobre Areia), nunca foto de banco ou gerada.

## 12. Iconografia

Estilo **linear**, traço de 1,5 px, grade de 24 px, cantos suavemente arredondados, sem preenchimento, cor herdada do texto. **Um único conjunto.** Escopo restrito a ação e navegação (seta, externo, menu, fechar, busca, relógio de leitura, WhatsApp/telefone/e-mail quando houver). **Sem ícone decorativo em cards de solução** e sem ícones grandes. A escolha do conjunto fica para a implementação.

## 13. Botões

| Tipo              | Aparência                                           | Quando usar                                      |
| ----------------- | --------------------------------------------------- | ------------------------------------------------ |
| **Primary (CTA)** | Terracota, texto Papel                              | Uma ação de conversão por tela ("Fale com a DM") |
| **Secondary**     | Contorno 1,5 px em Tinta, texto Tinta               | Ação alternativa ("Conheça nossas soluções")     |
| **Tertiary**      | Texto em Verde-tinta com seta e sublinhado ao hover | Continuar leitura, navegar                       |
| **Text (link)**   | Verde-tinta, sublinhado 1 px, deslocamento 3 px     | Link em texto corrido                            |
| **Icon**          | Área de toque 44 × 44 px, ícone 24 px               | Fechar, menu, ação isolada                       |

Medidas: altura padrão **48 px** (mínimo de toque 44), grande **56 px** (hero), compacta **40 px** (só desktop, nunca CTA). Padding horizontal 24 px, rótulo Instrument Sans 600 a 16 px, raio **4 px** (ver seção 26, Raio, bordas e sombras).

| Estado   | Regra                                                                                         |
| -------- | --------------------------------------------------------------------------------------------- |
| Default  | Conforme tabela acima                                                                         |
| Hover    | Primary → Terracota escura; Secondary → preenchimento Areia; transição de 150 ms              |
| Focus    | Anel de 2 px Verde-tinta com 2 px de afastamento (Papel em fundo escuro)                      |
| Active   | Cor do hover, sem deslocamento nem sombra                                                     |
| Disabled | Areia + Tinta secundária, cursor padrão, `aria-disabled`                                      |
| Loading  | Largura fixa, rótulo trocado por "Enviando…", indicador simples, `aria-busy`, sem duplo envio |

**O CTA é reconhecível pela cor e pelo rótulo fixo "Fale com a DM".**

## 14. Cards

### DECISÃO — cinco padrões, nenhum em caixa

**O que foi definido:** cada tipo de conteúdo tem seu padrão; todos se estruturam por **filetes e espaço**, não por bordas e sombras.

| Padrão            | Anatomia                                                                                                     | Variantes                                                                                   | Existe porque                                    |
| ----------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| **Article Card**  | Capa 16:9 (opcional), Label da categoria, título H3, subtítulo curto, Metadata (autor · data · leitura)      | Destaque (grande, 7 col.), Secundário (imagem menor), Linha (só texto, separada por filete) | O blog precisa de hierarquia entre artigos       |
| **Solution Card** | Rótulo do tipo (Consultoria/Serviço), nome em H3, uma frase que começa pelo problema, link "Como analisamos" | Destaque (largo) e Padrão                                                                   | Soluções se entendem por problema, não por ícone |
| **Expert Card**   | Retrato 4:5, nome em H3, cargo, especialidades em linha de texto, link                                       | Padrão; compacto no mobile                                                                  | Pessoas são a autoridade                         |
| **Case Card**     | Contexto, o que foi feito, **resultado real** e fonte                                                        | —                                                                                           | **Não renderiza até existir dado real**          |
| **Content Card**  | Tipo (Artigo, Evento, Material), título, Metadata                                                            | Compacto                                                                                    | "Conteúdos relacionados" e expansões futuras     |

**Regra para implementação:** no máximo **3 itens idênticos seguidos** sem quebra de hierarquia; um card nunca combina ícone + título + texto + botão; ícone não é elemento de card.

## 15. Formulários

| Elemento              | Especificação                                                                                                                           |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Rótulo                | Sempre visível, **acima** do campo, Instrument Sans 600, 14–15 px; obrigatório indicado por texto ("obrigatório"), não só por asterisco |
| Input/Select/Textarea | Altura 48 px (textarea a partir de 144 px), fundo Papel elevado, borda 1 px Borda de campo, raio 4 px                                   |
| Select                | Nativo estilizado; sem lista customizada na v1                                                                                          |
| Checkbox/Radio        | Caixa de 24 px com área de toque de 44 px; consentimento com link para a Política de Privacidade                                        |
| Ajuda                 | Texto de apoio abaixo, Tinta secundária                                                                                                 |
| **Default**           | Borda de campo                                                                                                                          |
| **Hover**             | Borda Tinta                                                                                                                             |
| **Focus**             | Borda e anel Verde-tinta 2 px                                                                                                           |
| **Error**             | Borda Erro 2 px + ícone + mensagem abaixo, associada ao campo e anunciada a leitores de tela; resumo no topo em formulário longo        |
| **Success**           | Mensagem de confirmação do formulário inteiro; sem "check" verde em cada campo                                                          |
| **Disabled**          | Areia, texto Tinta secundária                                                                                                           |
| **Loading**           | Botão de envio em estado de carregamento; campos preservados                                                                            |

Regra: campos opcionais **não** ficam escondidos, mas visualmente secundários (o Blueprint de produto define 3 obrigatórios). Erros dizem o que houve e como resolver.

## 16. Header

| Estado                      | Comportamento                                                                                                                                                                   |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Topo (desktop)**          | Altura 80 px, fundo Papel, sem sombra e sem linha. Wordmark à esquerda; Sobre · Soluções · Blog; CTA à direita                                                                  |
| **Após rolagem (> ~80 px)** | Altura 64 px, filete inferior de Linha fina; permanece visível (o CTA é persistente); transição de 200 ms                                                                       |
| **Mobile**                  | Altura 64 px; wordmark + botão de menu de 44 px; o CTA fica dentro do painel, fixo na base                                                                                      |
| **Menu mobile**             | Painel de tela cheia, links em Newsreader grande, botão de fechar 44 px, foco preso, `Esc` fecha, fundo da página bloqueado; 200 ms de fade (instantâneo em movimento reduzido) |
| **Páginas internas**        | Mesmo header em todas; sem variações por página. Breadcrumb aparece **abaixo** dele, nunca dentro                                                                               |

**Logotipo [LACUNA L-02]:** enquanto não houver marca, usar o **wordmark "DM Empresarial" em Newsreader**, sem símbolo inventado.

## 17. Footer

Faixa escura (Verde-tinta), com Papel/Areia no texto. Estrutura de 12 colunas: identidade (wordmark + endereço confirmado), navegação (Sobre, Soluções, Blog, Contato), contato (só dados reais), redes (só as reais), links legais, e uma linha final "© ano DM Empresarial" (mais CNPJ, quando fornecido). Newsletter, quando ativa, em bloco compacto sem popup. **Forte, não exagerado:** sem mapa, sem cards, sem repetição de CTA além de um único convite.

## 18. Blog

**Identidade:** publicação, não CMS. Hero de texto puro com a headline confirmada; **artigo em destaque assimétrico** (7/5), secundários menores, e uma lista em linhas para o restante.

| Elemento       | Especificação                                                                                                    |
| -------------- | ---------------------------------------------------------------------------------------------------------------- |
| Categorias     | Lista horizontal de texto com sublinhado na ativa (nada de pílulas); rolagem horizontal no mobile, com indicação |
| Busca          | Só depois do volume mínimo (Blueprint D6); campo simples ao lado das categorias                                  |
| Filtros        | Categoria agora; autor e solução depois                                                                          |
| Paginação      | Numerada com "Anterior/Próxima" e "Página X de Y" (preferível a "carregar mais" por SEO e por acessibilidade)    |
| Estados vazios | Mensagem direta e saída útil (ver seção 29)                                                                      |

## 19. Artigo

| Elemento            | Especificação                                                                                             |
| ------------------- | --------------------------------------------------------------------------------------------------------- |
| Coluna              | 680 px (`reading`), aproximadamente 62–68 caracteres por linha                                            |
| Corpo               | Newsreader 19 → 21 px, altura de linha 1,65                                                               |
| Intertítulos        | H2 28 → 36 e H3 22 → 28 (teto menor que o das páginas, para não competir com o H1); H4 em Instrument Sans |
| Citação             | Filete lateral de 3 px em Verde-tinta, Newsreader itálico 24 px; sem aspas gigantes                       |
| Listas              | Marcador simples; sem ícones                                                                              |
| Imagens             | Podem ocupar 1000 px ("wide") ou sangrar no mobile; legenda em Caption, Tinta secundária                  |
| Links               | Verde-tinta sublinhado 1 px; hover mais espesso                                                           |
| Tabelas             | Contêiner com rolagem horizontal; linha de cabeçalho com filete forte; sem zebra                          |
| Bloco destacado     | "Aplicação na empresa": fundo Areia, raio 0, filete lateral Verde-tinta (**não** terracota)               |
| Cabeçalho do artigo | Label (categoria) → H1 → subtítulo → Metadata (autor · data · leitura) → capa                             |
| Autor               | Retrato pequeno, nome, cargo, link para o perfil                                                          |

Nada interrompe a leitura: sem banner, sem popup, sem CTA no meio. CTA e newsletter só ao final.

## 20. Soluções

**Sensação:** problema → análise → método → solução. Traduzida em:

- **Trilho de índice** fixo à esquerda em `lg+` (Label de cada bloco, com o atual destacado): dá o ar de relatório e facilita navegação; some no mobile.
- **Faixas alternadas** Papel/Areia para marcar mudança de etapa (sem cards).
- **Processo em etapas numeradas** — único lugar em que numeral grande é permitido, pois é uma **sequência real**.
- **Diagnóstico** como bloco de perguntas em Newsreader itálico, marcado por filetes.
- CTA ao final, com convite específico da solução; **sem** faixa de urgência, contador, selo ou depoimento fictício.

**Não pode parecer** landing de anúncio: sem herói com mock-up, sem lista de "benefícios" com ícones.

## 21. Especialistas

**Diretório:** retratos 4:5 grandes em grade assimétrica — colunas com deslocamento vertical alternado de 48 px (efeito de "diagramação", sem parecer lista de funcionários) — nome em H3, cargo e especialidades em texto.

**Perfil:** herói em 5/7 — retrato grande (colunas 1–5) e, na direita, nome em Display L, cargo, e o resumo confirmado. Depois: biografia (`reading`), experiência e formação (só se preenchidas), **conteúdos publicados** em lista de linhas, **soluções relacionadas**, CTA "Fale com a DM sobre [área]". O especialista aparece como **autoridade** (grande, nomeado, com produção), não como item de RH.

## 22. Contato

Composição em duas colunas assimétricas (5/7): à esquerda H1 "Fale com a DM", frase curta, endereço confirmado e canais reais; à direita o formulário em Papel elevado com filete (sem sombra). O formulário é **simples**: 3 campos obrigatórios + opcionais em ordem de importância; consentimento por último. Confirmação substitui o formulário no mesmo lugar, com foco movido para a mensagem. Sem mapa incorporado; link "Ver no mapa".

## 23. Motion

### DECISÃO — movimento como acabamento, não como espetáculo

**O que foi definido:**

| Token          | Valor                        | Uso                                      |
| -------------- | ---------------------------- | ---------------------------------------- |
| Duração rápida | 120–150 ms                   | Hover, foco, cor                         |
| Duração padrão | 200 ms                       | Header, menu, troca de estado            |
| Duração lenta  | 400–600 ms                   | Revelação de título e de imagem (raro)   |
| Curva          | `cubic-bezier(0.2, 0, 0, 1)` | Padrão, entrada suave e frenagem natural |

Animações **prioritárias:**

1. **Revelação tipográfica** do título principal ao carregar a página, linha a linha (600 ms, defasagem de 60 ms), **uma vez por página**.
2. **Revelação de imagem** só para a imagem acima da dobra (400 ms).
3. **Hover:** sublinhado que engrossa, cor do botão, seta que avança 4 px. Nada além.
4. **Navegação:** header que encolhe; painel mobile com fade.
5. **Transição de página:** nenhuma na v1. Só reavaliar se melhorar continuidade.
6. **Rolagem:** apenas o destaque do bloco atual no trilho de índice das soluções.

**Por quê:** o Prompt pede que o movimento comunique qualidade sem chamar atenção; poucas animações, bem colocadas, são percebidas; muitas viram ruído.

**Alternativas consideradas:** scroll-reveal em todas as seções (rejeitado: fadiga e queda de desempenho); parallax (rejeitado).

**Regra para implementação:** animar somente opacidade e transformação; nenhuma animação em loop; nada que atrase a leitura ou o LCP. **Movimento reduzido:** todas as transformações e revelações são desligadas (o estado final aparece direto) e transições de cor passam a ser instantâneas; a experiência continua completa.

## 24. Responsividade

Larguras a testar: **320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920**.

| Largura     | O que muda de verdade (não é só empilhar)                                                                                                                                                                                                                                                                                                                  |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 320–414     | 1 coluna, margem 20 px. Hero: texto primeiro, imagem (quando existir) recortada para 4:5. Diretório de especialistas em **lista horizontal** (retrato pequeno à esquerda). Categorias do blog em rolagem horizontal. Soluções: a destaque primeiro, depois as demais em lista. Sem trilho de índice. Menu em painel. Nada de rolagem horizontal da página. |
| 768         | 8 colunas. Artigo em coluna única, imagens em "wide". Diretório em 2 colunas. Soluções em 2 colunas com destaque acima.                                                                                                                                                                                                                                    |
| 1024        | 12 colunas; composições 5/7 e 8/4; trilho de índice aparece; header completo.                                                                                                                                                                                                                                                                              |
| 1280 / 1440 | Container em 1200 (default) e 1360 (wide); mesmos padrões.                                                                                                                                                                                                                                                                                                 |
| 1920        | Container **não cresce**; faixas de fundo sangram; o espaço lateral é papel, não conteúdo esticado.                                                                                                                                                                                                                                                        |

O tamanho de texto fluido (seção 08) evita saltos bruscos entre pontos de quebra. Os botões de conversão têm sempre **mínimo de 44 px de altura** e nunca ficam abaixo da dobra sem alternativa (o CTA do header/painel garante o acesso).

## 25. Acessibilidade

Meta: **WCAG 2.2 AA**, com AAA no corpo do artigo.

- **Contraste** conforme a seção 10; nunca só cor.
- **Foco** sempre visível (anel 2 px); ordem de foco igual à ordem visual; **link "Ir para o conteúdo"** como primeiro foco.
- **Alvos de toque** ≥ 44 × 44 px (acima do mínimo de 24 px do AA).
- **Semântica:** um H1 por página, hierarquia sem saltos, marcos de página (cabeçalho, navegação, principal, rodapé).
- **Teclado:** menu mobile e diálogos com foco preso e saída por `Esc`; nada depende de hover.
- **Formulários:** rótulos visíveis e associados; erros anunciados; autocompletar quando aplicável.
- **Imagens:** alt descritivo em imagem editorial; alt vazio em decorativa; retratos com o nome da pessoa.
- **Idioma** pt-BR declarado; **zoom 200 %** e espaçamento de texto ampliado sem perda de conteúdo.
- **Movimento reduzido** respeitado (seção 23).
- **Verificação:** ferramenta automática (WCAG) + roteiro manual de teclado + teste com leitor de tela em cada gabarito antes de considerar uma página pronta.

## 26. Design tokens (conceituais)

**Duas camadas:** _primitivos_ (nomes de marca) e _semânticos_ (papéis de uso). Componentes só consomem semânticos.

| Grupo           | Primitivos                                                                                                                                                    | Semânticos (exemplos)                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Cor**         | papel, papel elevado, areia, tinta, tinta secundária, tinta suave, verde-tinta, terracota, terracota escura, linha fina, borda de campo, sucesso, aviso, erro | fundo, superfície, superfície de apoio, texto, texto secundário, texto suave, ação, ação (hover), link, foco, borda, borda de campo, feedback (sucesso/aviso/erro) |
| **Tipografia**  | famílias (Newsreader, Instrument Sans); escala da seção 08                                                                                                    | display, título, texto, texto de artigo, rótulo, legenda, metadata                                                                                                 |
| **Espaçamento** | 2xs … 5xl (seção 06)                                                                                                                                          | espaço de seção, espaço de bloco, espaço de item, gutter                                                                                                           |
| **Raio**        | 0, 4 px, círculo                                                                                                                                              | imagem, card, botão, campo, avatar                                                                                                                                 |
| **Borda**       | 1 px fina; 1 px forte (Tinta); 1,5 px contorno; 2 px foco/erro                                                                                                | divisor, filete de seção, contorno de botão, anel de foco                                                                                                          |
| **Sombra**      | uma só: elevação mínima para menus sobrepostos                                                                                                                | sobreposição                                                                                                                                                       |
| **Movimento**   | durações e curva (seção 23)                                                                                                                                   | reação, transição, revelação                                                                                                                                       |
| **Breakpoints** | 640, 768, 1024, 1280, 1536                                                                                                                                    | —                                                                                                                                                                  |
| **Container**   | 560, 680, 1200, 1360                                                                                                                                          | estreito, leitura, padrão, largo                                                                                                                                   |

**Convenção de nomes [PROPOSTA]:** primitivos em português (vocabulário de marca, como no `globals.css` atual), semânticos em inglês (para casar com os identificadores do código). **Confirmar com o Prompt 3** se ele fixa outra convenção.

### Raio, bordas e sombras (decisão)

**DECISÃO — cantos quase retos, filete em vez de caixa, profundidade pelo espaço**

| Elemento                 | Raio     | Motivo                                            |
| ------------------------ | -------- | ------------------------------------------------- |
| Imagens, retratos, capas | **0**    | Aparência de publicação; recortes limpos          |
| Cards e contêineres      | **0**    | Nem sequer têm caixa; são estruturados por filete |
| Botões, campos           | **4 px** | Suaviza o toque sem parecer app                   |
| Avatar / monograma       | círculo  | Único uso de forma totalmente arredondada         |

**Bordas e divisores:** filete de 1 px em Linha fina estrutura listas e seções; filete forte de 1 px em Tinta abre seções com Label; 1,5 px em botões secundários; 2 px só em foco e erro.

**Sombras:** **uma** — elevação mínima para elementos sobrepostos (painel do menu). Nenhuma em cards, botões, header ou imagens. A profundidade vem de espaço, escala, contraste e imagem.

**Alternativas consideradas:** raio de 12–16 px generalizado (rejeitado: estética de app/SaaS); zero em tudo (rejeitado: botões e campos ficam ríspidos).

## 27. Componentes

Só entram os que têm função no Blueprint de produto.

| Componente                                              | Função                                                | Na v1?           |
| ------------------------------------------------------- | ----------------------------------------------------- | ---------------- |
| Container, Section                                      | Grid, ritmo e faixas                                  | Sim              |
| Heading, SectionLabel                                   | Hierarquia e filete de seção                          | Sim              |
| RichText                                                | Texto de artigo e biografia com estilos editoriais    | Sim              |
| Button, Link                                            | CTA e navegação                                       | Sim              |
| Header, MobileMenu                                      | Navegação persistente                                 | Sim              |
| Footer                                                  | Navegação final e legal                               | Sim              |
| Breadcrumb                                              | Orientação em páginas de 2+ níveis                    | Sim              |
| PageHero (variantes)                                    | Aberturas: Home, solução, especialista, blog, contato | Sim              |
| ArticleCard                                             | Destaque, secundário, linha                           | Sim              |
| SolutionCard                                            | Destaque e padrão                                     | Sim              |
| ExpertCard                                              | Diretório                                             | Sim              |
| ContentCard                                             | Relacionados                                          | Sim              |
| ProcessSteps                                            | Etapas reais de uma solução                           | Sim              |
| AuthorBio, Figure                                       | Autoria e imagem com legenda                          | Sim              |
| Field (Input, Textarea, Select, Checkbox) e FormMessage | Formulários                                           | Sim              |
| CategoryNav, Pagination                                 | Navegação do blog                                     | Sim              |
| CTASection                                              | Convite contextual (genérico ou da solução)           | Sim              |
| EmptyState                                              | Estados vazios                                        | Sim              |
| SkipLink                                                | Acessibilidade                                        | Sim              |
| Search                                                  | Busca do blog                                         | Depois (D6)      |
| NewsletterForm                                          | Assinatura                                            | Depois (L-13)    |
| CaseCard                                                | Prova                                                 | Só com dado real |

**Removidos de propósito:** _Modal_ (o único diálogo é o menu mobile), _Toast_ (o retorno é no próprio lugar), _Badge_ e _Tag_ como pílula (o rótulo é texto). Se surgir necessidade real, entra depois.

## 28. Estados

| Componente       | Default | Hover | Focus | Active | Disabled | Loading | Error | Success |
| ---------------- | :-----: | :---: | :---: | :----: | :------: | :-----: | :---: | :-----: |
| Button           |    ●    |   ●   |   ●   |   ●    |    ●     |    ●    |   —   |    —    |
| Link             |    ●    |   ●   |   ●   |   ●    |    —     |    —    |   —   |    —    |
| Field            |    ●    |   ●   |   ●   |   —    |    ●     |    —    |   ●   |    —    |
| Checkbox / Radio |    ●    |   ●   |   ●   |   ●    |    ●     |    —    |   ●   |    —    |
| Formulário       |    ●    |   —   |   —   |   —    |    —     |    ●    |   ●   |    ●    |
| Cards (todos)    |    ●    |   ●   |   ●   |   —    |    —     |    —    |   —   |    —    |
| Menu / Navegação |    ●    |   ●   |   ●   |   ●    |    —     |    —    |   —   |    —    |
| Lista com dados  |    ●    |   —   |   —   |   —    |    —     |    ●    |   ●   |    —    |

Cards: o hover destaca só o título (sublinhado) e, no máximo, escurece a imagem em 4 %; nada de elevação.

## 29. Microcopy

**Princípios:** frase curta, verbo de ação, primeira pessoa do plural quando a DM fala, sem vocabulário proibido (Blueprint, seção 19), sem promessa de resultado, sem prazo que a DM não confirmou.

| Situação              | Texto                                                                             |
| --------------------- | --------------------------------------------------------------------------------- |
| CTA principal         | Fale com a DM                                                                     |
| CTA secundário        | Conheça nossas soluções                                                           |
| Ler artigo            | Ler artigo                                                                        |
| Perfil                | Conheça o especialista                                                            |
| Envio                 | Fale com a DM (em carregamento: "Enviando…")                                      |
| Confirmação           | Recebemos sua mensagem. Nossa equipe vai retornar. (prazo só se confirmado, L-12) |
| Erro de e-mail        | Confira o e-mail: parece faltar o @.                                              |
| Campo obrigatório     | Preencha este campo para continuar.                                               |
| Falha de envio        | Não conseguimos enviar agora. Tente de novo em instantes.                         |
| Categoria sem artigos | Ainda não há artigos nesta categoria. Veja todos os artigos.                      |
| Busca sem resultado   | Não encontramos artigos para "termo". Tente outra palavra ou veja as categorias.  |
| Página inexistente    | Não encontramos esta página. Volte ao início ou veja as soluções.                 |

## 30. Regras de composição

1. **Uma ideia por tela** de rolagem; a seção seguinte muda o ritmo (impacto → respiro → informação → impacto → profundidade).
2. **Uma cor de ação por vista.** Se há mais de um botão terracota visível, há erro.
3. **No máximo dois tamanhos de título por seção.**
4. **Alinhamento à esquerda** por padrão; texto centralizado apenas em títulos curtos de páginas de estado.
5. **Espaço entre seções ≥ 96 px** no desktop; nunca preencher vazio "porque sobrou".
6. **Filete no lugar de caixa:** agrupar com linha antes de agrupar com fundo.
7. **Assimetria com âncora:** um elemento grande e um pequeno; o pequeno alinhado ao grid.
8. **Numeral grande só se for dado real ou etapa real.**
9. **Nenhuma seção repete a fórmula** título centralizado + subtítulo + três cards.
10. **Texto sempre sobre fundo de contraste garantido;** nada de texto sobre foto sem faixa de proteção.

## 31. Regras de imagem

| Uso                     | Proporção                     | Mínimo de origem | Regra de recorte                                         |
| ----------------------- | ----------------------------- | ---------------- | -------------------------------------------------------- |
| Hero                    | 3:2 (mobile recortado em 4:5) | 2400 × 1600      | Ponto focal no terço central; texto nunca sobre rostos   |
| Capa de artigo          | 16:9                          | 1600 × 900       | Sem texto embutido na imagem                             |
| Miniatura de artigo     | 4:3                           | 800 × 600        | Mesmo ponto focal da capa                                |
| Retrato de especialista | 4:5                           | 1200 × 1500      | Padrão único da seção 11 (Retratos de especialistas)     |
| Case                    | 3:2                           | 1800 × 1200      | Apenas material autorizado                               |
| Open Graph              | 1,91:1                        | 1200 × 630       | Zona segura de 60 px; título legível em tamanho reduzido |
| Social quadrado         | 1:1                           | 1080 × 1080      | Idem                                                     |

Regras: **ponto focal definido por imagem** e respeitado em todos os recortes; nunca esticar ou deformar; formatos modernos com alternativa; carregamento adiado, **exceto** a imagem principal acima da dobra, que tem prioridade; cor de espera em Areia; alt obrigatório; peso alvo por imagem de conteúdo na ordem de dezenas de KB (a medir).

## 32. Regras de animação

Consolidação das regras de movimento (o detalhe e os valores estão na seção 23):

- **Permitido como padrão:** revelação do título principal (uma vez por página), revelação da imagem acima da dobra, hover discreto, header que encolhe, painel mobile com fade, destaque do bloco atual no trilho de índice.
- **Proibido como padrão:** fade-in em tudo, deslizamento de cards, parallax, texto "voando", zoom constante, cursor customizado, partículas, glitch, qualquer animação em loop.
- **Técnica:** apenas opacidade e transformação; nenhuma animação bloqueia leitura, interação ou o carregamento da imagem principal.
- **Movimento reduzido:** revelações e transformações desligadas, estado final imediato, transições de cor instantâneas; a experiência continua completa.
- **Teste de entrada:** toda animação nova responde a "por que isso existe?" com uma função (comunicar estado, orientar, hierarquizar). Sem resposta, sai.

## 33. Critérios de qualidade e testes

| Dimensão        | Passa quando                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------- |
| **Marca**       | Sem o logotipo, ainda se reconhece: papel + serifa + verde-tinta + terracota só no CTA             |
| **Usabilidade** | Qualquer página chega ao formulário em ≤ 2 cliques; leitura confortável a 320 px e a 1920 px       |
| **Autoridade**  | Há pessoas reais nomeadas, método explicado e fonte para todo dado; nada inventado                 |
| **Editorial**   | Artigo tem hierarquia, medida de leitura e sem interrupções; blog tem destaque, categorias e lista |
| **Conversão**   | Em cada tela existe um próximo passo claro e um único elemento terracota                           |

**Teste "site de IA"** — _sem o logotipo, poderia ser qualquer consultoria?_ Resultado honesto: **a tipografia e a paleta já diferenciam, mas a identidade só se sustenta com fotografia e conteúdo reais.** Com banco de imagens ou texto genérico, cai no genérico. Por isso o Blueprint impõe "dado real ou nada" e a Lacuna L-10.

**Teste "template"** — _trocando texto e imagens, continua igual a centenas de templates?_ Não, desde que se cumpram as regras de composição (assimetria 5/7, filetes, trilho de índice, Display em escala) e não se caia na fórmula "título + três cards".

**Teste "sobriedade"** — _o design tenta provar que é premium?_ Não há efeito para isso: a qualidade depende de alinhamento, escala e acabamento. Se um efeito for proposto, deve responder "por que isso existe?" com uma função (comunicar, orientar, hierarquizar), caso contrário sai.

## 34. O que evitar

Neon, cyberpunk, glassmorphism, gradiente genérico, blobs, 3D gratuito, sombras pesadas, arredondamento excessivo, cards iguais repetidos, ícones gigantes, dashboards, estética SaaS/startup/"gerada por IA", partículas, parallax, títulos em caixa alta, microtexto decorativo — e, além do Prompt:

- terracota fora da ação de conversão;
- terracota ou verde-tinta em texto pequeno sobre a cor errada (ver seção 10);
- pílulas de tag, "chips" e selos;
- imagem de banco, aperto de mão, executivo olhando gráfico, escritório luxuoso;
- **pessoas, clientes ou depoimentos gerados por IA ou inventados**;
- numerais de destaque sem dado real ("+300 %", "98 %");
- CTA em todas as seções, contadores, urgência artificial;
- qualquer animação em loop.

## 35. Direção visual final

| Pergunta                           | Resposta                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Como a DM parece?                  | Um relatório bem editado: papel quente, tinta, serifa Newsreader, verde-tinta profundo, filetes, espaço; terracota só na ação |
| Como se movimenta?                 | Pouco e com propósito: revelação do título, header que encolhe, hover discreto; nada em loop; respeita movimento reduzido     |
| Como organiza informação?          | Grid de 12 colunas com cinco divisões, faixas Papel/Areia, filete de seção, trilho de índice nas soluções                     |
| Como apresenta pessoas?            | Retratos 4:5 reais e consistentes, nome em destaque, produção publicada; monograma até haver foto                             |
| Como apresenta conhecimento?       | Publicação: destaque, categorias, coluna de leitura de 680 px, serifa de corpo, bloco "Aplicação na empresa"                  |
| Como apresenta soluções?           | Pelo problema, não pelo ícone: Solution Card tipográfico, página em sequência problema → análise → método → solução           |
| Como conduz o usuário?             | Um CTA terracota "Fale com a DM" por tela, sempre no header, e convite contextual ao fim de artigos e soluções                |
| Como se diferencia de um template? | Paleta e tipografia próprias, composição assimétrica, linha em vez de caixa, e regra rígida de dado e foto reais              |

**Pendências para sair do papel:** L-02 (marca), L-10 (fotografia) e validação dos valores de cor/fonte em tela real com a DM. **Qualquer ajuste de matiz exige recalcular a tabela de contraste da seção 10.**

---

## Estado da implementação (21/09/2026)

Implementado e verificado (fase 2 do plano): tokens de cor, tipografia fluida, espaçamento, raio, sombra, containers, breakpoints e movimento em `src/app/globals.css`; fontes Newsreader e Instrument Sans (sem `opsz`, 149 KB); primitivos em `src/components/ui`; página de referência em `/design-system` (indisponível em produção). Os pares de contraste da seção 10 são **testados contra os valores reais do CSS** (`tests/design-tokens.test.ts`), inclusive o que cada faixa de tom resolve, e o teste falha se uma cor sair dos tokens.

Decisões da implementação: (1) as cores padrão do Tailwind foram desligadas, existe só a paleta da marca; (2) o Tailwind mantém os utilitários numéricos de espaçamento (`p-4`, `h-12`); a regra é usar a escala nomeada para espaçamento de layout e os numéricos só para dimensões de controle (revisão de código, sem lint); (3) `Figure`, Header, Footer e MobileMenu ficam para a fase de páginas públicas, quando houver imagem real, marca e conteúdo.
