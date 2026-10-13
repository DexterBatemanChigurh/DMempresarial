/**
 * Conteúdo institucional da DM, escrito direto no código (decisão do usuário em 28/09: sem
 * edição pelo painel para Soluções, Especialistas e Páginas). Para editar um texto, mude aqui.
 *
 * `PLACEHOLDER` marca o que ainda falta escrever. Procure por ele para ver o que falta.
 * Parágrafos são listas de strings: cada item vira um <p>.
 */
export const PLACEHOLDER = "Texto em preparação.";

// ---------------------------------------------------------------------------------- Home

export const HOME = {
  /** O título do topo tem duas partes: a segunda sai em destaque (cor de ação). */
  headlineStart: "Quando o caixa aperta,",
  headlineHighlight: "a decisão certa tem prazo",
  description:
    "Somos a consultoria que entra na empresa em dificuldade, reorganiza a operação e senta com o banco junto com você. Em Frutal e região, há 14 anos.",
  /** Linha pequena abaixo dos botões do topo. */
  note: "Primeira conversa sem compromisso. Atendemos todos os dias.",
  /** Faixa de números: só o que a DM confirmou (atualizados pela DM em 02/10/2026). */
  stats: [
    { value: "+500", label: "empresas atendidas" },
    { value: "14 anos", label: "no mercado" },
    { value: "+R$ 2 bilhões", label: "administrados para nossos clientes" },
  ],
  /** Foto do topo: caminho de uma imagem em /public (ex.: "/home/equipe.jpg"); null = espaço vazio. */
  heroImage: null as { src: string; alt: string } | null,
};

// ---------------------------------------------------------------------------------- Sobre

export const ABOUT = {
  /** Abertura de /sobre: identidade da DM, sem serviços. Só fatos já documentados no site. */
  hero: {
    eyebrow: "DM Empresarial · Frutal, MG",
    /** O título tem duas partes: a segunda sai em destaque (cor de ação). */
    titleStart: "Consultoria empresarial feita de perto, por",
    titleHighlight: "gente de verdade",
    text: "Entramos no negócio, entendemos o que está acontecendo antes de propor qualquer coisa e acompanhamos cada decisão com método.",
    founderLabel: "Fundador",
    founderName: "Dino Marques de Oliveira",
    link: "Continuar lendo",
  },
  /** Seção "Quem somos" de /sobre: identidade e forma de presença. Só fatos já documentados
   * (whoWeAre, Home e Contato). `whoWeAre` segue intacto porque a Home e /solucoes o usam. */
  identity: {
    label: "Quem somos",
    title: "Uma consultoria de Frutal que entra na realidade de cada empresa.",
    lead: "A DM Empresarial desenvolve pessoas e empresas por meio de uma consultoria personalizada, orientada a resultados concretos.",
    body: [
      "O trabalho começa dentro do negócio: a DM entra na empresa para identificar os pontos críticos e reorganizar a estratégia, antes de propor qualquer caminho.",
      "Quando a pressão é financeira, a presença da DM chega à mesa de negociação. Ela negocia diretamente com os bancos para reorganizar dívidas e devolver fôlego ao negócio.",
    ],
    note: "A primeira conversa é para entender a situação e dizer com honestidade se a DM pode ajudar.",
  },
  whoWeAre: [
    "A DM Empresarial desenvolve pessoas e empresas por meio de uma consultoria personalizada e orientada a resultados concretos. Entramos no negócio para identificar os pontos críticos, reorganizar a estratégia e destravar o crescimento.",
    "Também atuamos na recuperação de crédito, negociando diretamente com bancos para reorganizar dívidas e devolver fôlego financeiro ao negócio. Quem conduz o trabalho é Dino Marques de Oliveira, fundador da consultoria.",
  ],
  /** Seção "Como pensamos" de /sobre: a lógica de raciocínio da DM, sem etapas de serviço.
   * Cada par vem de texto já publicado (diagnóstico antes de proposta, caixa real, plano com
   * prazo e responsável, "sem relatório de cem páginas que ninguém lê"). */
  thinking: {
    label: "Como pensamos",
    title: "Decidir só depois de enxergar a empresa como ela é.",
    text: "A DM não parte de uma solução pronta para encaixar no negócio. Primeiro procura entender o que está acontecendo e o que está travando a empresa; só então decide o que precisa ser feito.",
    pairs: [
      {
        from: "Uma solução pronta, pensada antes de conhecer a empresa.",
        to: "O que está acontecendo de fato, dentro do negócio.",
      },
      {
        from: "O sintoma que aparece primeiro.",
        to: "O que está travando a empresa por trás dele.",
      },
      {
        from: "O caixa que se gostaria de ter.",
        to: "O caixa real, no qual o plano precisa caber.",
      },
      {
        from: "Um relatório extenso que ninguém lê.",
        to: "Uma decisão transformada em plano, com prazo e responsável.",
      },
    ],
    fromLabel: "Não parte de",
    toLabel: "Parte de",
  },
  /** Seção "Como trabalhamos" de /sobre: como é trabalhar com a DM (relação e rotina), sem as
   * etapas do processo de /solucoes. Cada trecho vem de texto já publicado: proposta preparada
   * antes da mesa com o banco, plano com prazo e responsável, "sem relatório que ninguém lê",
   * atendimento todos os dias, avaliação da evolução e discrição sobre a situação do cliente. */
  working: {
    label: "Como trabalhamos",
    title: "Perto da empresa, sem perder a objetividade.",
    intro:
      "Não é um manual de procedimentos. É o que a empresa encontra no dia a dia ao trabalhar com a DM.",
    items: [
      {
        lead: "A DM trabalha por dentro do negócio.",
        text: "Conhece a realidade da empresa antes de propor qualquer coisa. Quando o assunto é crédito, prepara a proposta antes de você sentar à mesa com o banco e senta junto com você.",
      },
      {
        lead: "Você sabe o que foi combinado.",
        text: "O que precisa ser feito tem prazo e responsável definidos, e fica claro em cada etapa. Sem relatório extenso que ninguém lê.",
      },
      {
        lead: "A conversa não termina com o plano.",
        text: "A DM atende todos os dias, acompanha a evolução do que foi definido e avalia com a empresa os próximos passos.",
      },
      {
        lead: "A situação da empresa fica com quem precisa saber.",
        text: "O que a empresa atravessa é tratado com discrição, sem exposição.",
      },
    ],
  },
  /** Encerramento de /sobre: consequência da apresentação, sem oferta. O botão leva a /contato,
   * que é um formulário de mensagem; o texto segue o que aquela página já diz acontecer depois. */
  cta: {
    eyebrow: "Para continuar",
    title: "Se fez sentido até aqui, a conversa pode começar.",
    text: "Conte como está a sua empresa. A DM analisa o que for apresentado e um responsável pode retornar para entender melhor a situação.",
    label: "Escrever para a DM",
  },
  /** Seção "Quem está por trás" de /sobre. Fontes: o texto de "Quem somos" deste projeto
   * (fundador; quem conduz o trabalho) e o site publicado dmempresarial.com.br (autor do livro).
   * Não há foto nem biografia no projeto: nada além disso deve ser escrito aqui. */
  founder: {
    label: "Quem está por trás",
    name: "Dino Marques de Oliveira",
    role: "Fundador da DM Empresarial",
    text: [
      "Dino Marques de Oliveira fundou a DM Empresarial e conduz o trabalho junto às empresas. A forma de pensar e de trabalhar descrita nesta página passa por ele.",
    ],
    bookLabel: "Autor do livro",
    bookTitle: "Manual de Gestão em Tempos de Crise e Austeridade",
  },
  /** "O que nos orienta" em /sobre: a postura da DM diante do cliente. Os nomes (os cinco
   * princípios já publicados) giram em volta do círculo da Home e não mudam; `practice` diz o
   * que o cliente pode esperar de cada um, sem repetir as cenas de "Como trabalhamos". */
  valuesIntro: {
    title: "O que nos orienta",
    text: "Cinco princípios que definem a postura da DM diante do cliente, em qualquer trabalho.",
  },
  values: [
    {
      name: "Diagnóstico antes de proposta",
      practice: "Nenhuma proposta chega antes de a DM entender o caixa e a realidade da empresa.",
    },
    {
      name: "Transparência em cada etapa",
      practice:
        "O cliente sabe o que está sendo feito, inclusive quando a resposta honesta é que a DM não pode ajudar.",
    },
    {
      name: "Plano com prazo e responsável",
      practice: "Uma decisão só está tomada quando tem prazo e alguém responsável por ela.",
    },
    {
      name: "Disponibilidade todos os dias",
      practice: "A DM atende todos os dias: quando algo muda na empresa, há com quem falar.",
    },
    {
      name: "Discrição sobre a situação do cliente",
      practice: "O que o cliente conta sobre a empresa não circula fora da conversa.",
    },
  ] as { name: string; practice: string }[],
};

// ------------------------------------------------------------------------------ Soluções

export type SolutionType = "CONSULTORIA" | "SERVICO";
export type SolutionItem = { title: string; body?: string };

export type Solution = {
  slug: string;
  type: SolutionType;
  title: string;
  summary: string;
  isFeatured: boolean;
  situations: SolutionItem[];
  steps: SolutionItem[];
  goals: SolutionItem[];
};

/** Títulos e resumos: as quatro frentes definidas pelo usuário (seção "O que fazemos"). */
export const SOLUTIONS: Solution[] = [
  {
    slug: "recuperacao-de-credito",
    type: "SERVICO",
    title: "Recuperação de crédito",
    summary:
      "Negociamos diretamente com os bancos para reorganizar dívidas, alongar prazos e devolver fôlego financeiro ao negócio. Preparamos a proposta antes de você sentar na mesa.",
    isFeatured: false,
    situations: [],
    steps: [],
    goals: [],
  },
  {
    slug: "reorganizacao-de-dividas",
    type: "SERVICO",
    title: "Reorganização de dívidas",
    summary:
      "Mapeamento de tudo que a empresa deve, ordem de prioridade de pagamento e um plano financeiro que cabe no caixa real, não no caixa desejado.",
    isFeatured: false,
    situations: [],
    steps: [],
    goals: [],
  },
  {
    slug: "consultoria-estrategica",
    type: "CONSULTORIA",
    title: "Consultoria estratégica",
    summary:
      "Identificamos o que está travando o crescimento e montamos um plano de ação com prazo e responsável. Sem relatório de cem páginas que ninguém lê.",
    isFeatured: false,
    situations: [],
    steps: [],
    goals: [],
  },
  {
    slug: "reestruturacao-de-gestao",
    type: "CONSULTORIA",
    title: "Reestruturação de gestão",
    summary:
      "Reorganizamos processos, estrutura e indicadores para que a empresa volte a funcionar com controle, e não no susto de cada boleto.",
    isFeatured: false,
    situations: [],
    steps: [],
    goals: [],
  },
];

export function findSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}

// --------------------------------------------------------------------------- Especialistas

/**
 * Página /solucoes. As frentes vêm de SOLUTIONS (as quatro da Home); aqui ficam só a narrativa
 * da página, as situações de identificação (todas derivadas dos textos já publicados da DM) e
 * o processo. Marketing não entra: não é uma das quatro frentes da Home.
 */
export const SOLUTIONS_PAGE = {
  hero: {
    /** O título tem duas partes, como na Home: a segunda sai em destaque (cor de ação). */
    titleStart: "Caixa apertado, dívida, gestão sem rumo:",
    titleHighlight: "veja por onde a DM começa",
    description:
      "Estas são as quatro frentes em que a DM atua e o critério para escolher entre elas. Começamos sempre por entender o caixa antes de propor qualquer coisa.",
  },
  /** Situações de identificação: cada uma aponta para a frente correspondente (slug). */
  situations: [
    {
      text: "As dívidas com bancos já não cabem no caixa da empresa.",
      slug: "recuperacao-de-credito",
    },
    {
      text: "Ninguém sabe ao certo o que a empresa deve, nem o que pagar primeiro.",
      slug: "reorganizacao-de-dividas",
    },
    {
      text: "A empresa não cresce e falta clareza sobre o que está travando.",
      slug: "consultoria-estrategica",
    },
    {
      text: "A empresa funciona no susto de cada boleto, sem processos nem indicadores.",
      slug: "reestruturacao-de-gestao",
    },
  ],
  /** Frentes agrupadas pelo tipo de problema. `anchor` preserva os endereços já usados no site
   * (/solucoes#servicos no rodapé; #gestao e #financas nos artigos do blog). */
  groups: [
    {
      id: "servicos",
      headingId: "financas",
      title: "Quando o problema é financeiro",
      text: "Atuação direta sobre dívida e crédito, inclusive na negociação com os bancos.",
      fronts: [
        { slug: "recuperacao-de-credito", anchor: "recuperacao-de-credito" },
        { slug: "reorganizacao-de-dividas", anchor: "reorganizacao-de-dividas" },
      ],
    },
    {
      id: "consultorias",
      headingId: "direcao-e-gestao",
      title: "Quando faltam direção e controle",
      text: "Consultorias sobre o rumo e a organização da empresa.",
      fronts: [
        { slug: "consultoria-estrategica", anchor: "estrategia" },
        { slug: "reestruturacao-de-gestao", anchor: "gestao" },
      ],
    },
  ],
  process: {
    title: "Não existe solução automática: primeiro entendemos, depois propomos.",
    text: "Nem toda empresa precisa das quatro frentes, e algumas precisam de mais de uma. A ordem depende do que o diagnóstico mostrar.",
    steps: [
      { name: "Entendimento", text: "Conhecemos o cenário e os desafios da empresa." },
      { name: "Diagnóstico", text: "Identificamos problemas, oportunidades e prioridades." },
      { name: "Estratégia", text: "Definimos os caminhos possíveis." },
      { name: "Implementação", text: "Transformamos a estratégia em ação." },
      { name: "Acompanhamento", text: "Avaliamos a evolução e os próximos passos." },
    ],
  },
  cta: {
    eyebrow: "Próximo passo",
    title: "Nem todo caso tem resposta pronta. A\u00a0conversa começa pelo seu.",
    text: "Conte o que está acontecendo na empresa. A DM entende o cenário e diz com honestidade se pode ajudar. A primeira conversa é sem compromisso.",
    label: "Conversar com a DM",
  },
};

/** Página /blog (texto definido pelo usuário em 29/09/2026). */
export const BLOG_PAGE = {
  hero: {
    title: "Conhecimento para decisões empresariais mais claras.",
    description:
      "Conteúdos sobre gestão, estratégia, finanças, marketing e os desafios de quem conduz uma empresa.",
  },
  /** Navegação por necessidade: cada item leva a uma categoria do blog (slug). */
  needs: [
    { need: "Tenho problemas de gestão", answer: "Conteúdos sobre Gestão", category: "gestao" },
    {
      need: "Preciso entender melhor minhas finanças",
      answer: "Conteúdos sobre Finanças",
      category: "financas",
    },
    {
      need: "Estou planejando mudanças na empresa",
      answer: "Estratégia e Gestão",
      category: "gestao",
    },
    { need: "Quero melhorar meu posicionamento", answer: "Marketing", category: "marketing" },
    { need: "Quero organizar meus processos", answer: "Processos", category: "processos" },
  ],
  cta: {
    title: "O conteúdo ajudou. E agora?",
    text: "Se esse desafio também faz parte da realidade da sua empresa, podemos conversar sobre o cenário e entender os caminhos possíveis.",
  },
};

/** Solução relacionada a cada categoria do blog (fim do artigo: conteúdo → problema → solução). */
export const CATEGORY_SOLUTION: Record<string, { label: string; href: string }> = {
  gestao: { label: "Conheça as soluções de gestão da DM", href: "/solucoes#gestao" },
  processos: { label: "Conheça as soluções de gestão da DM", href: "/solucoes#gestao" },
  financas: { label: "Conheça as soluções financeiras da DM", href: "/solucoes#financas" },
};

/** Página /contato (texto definido pelo usuário em 29/09/2026). */
export const CONTACT_PAGE = {
  hero: {
    title: "Você não precisa ter todas as respostas.",
    /** Só fatos da própria página: o assunto do formulário é opcional e a DM analisa o que for
     * enviado antes de conversar (ver `afterSend`). Também é a description da página. */
    description:
      "Explique a situação da empresa com as suas palavras, sem precisar escolher um serviço antes. A DM analisa o contexto e depois conversa com você sobre os caminhos possíveis.",
  },
  /** Assunto do contato: gravado em `leads.segment` para a DM classificar o lead. */
  subjects: [
    { value: "estrategia", label: "Estratégia" },
    { value: "gestao", label: "Gestão" },
    { value: "financas", label: "Finanças" },
    { value: "recuperacao-de-credito", label: "Recuperação de crédito" },
    { value: "processos", label: "Processos" },
    { value: "marketing", label: "Marketing" },
    { value: "outro", label: "Outro assunto" },
  ],
  /** Localização (lateral do formulário). O endereço vem de CONTACT.address; o link abre a busca
   * desse endereço no Google Maps (sem mapa incorporado nem coordenadas). */
  location: {
    title: "Onde a DM fica",
    action: "Abrir no Google Maps",
  },
  /** "Prefere não preencher o formulário?": só os canais reais de CONTACT (WhatsApp e e-mail).
   * O endereço fica na lateral do formulário, com o mapa; não se repete aqui. */
  direct: {
    title: "Prefere não preencher o formulário?",
    text: "Você também pode falar com a DM por um destes dois canais.",
    whatsappLabel: "WhatsApp",
    whatsappAction: "Abrir conversa no WhatsApp",
    emailLabel: "E-mail",
    emailAction: "Escrever por e-mail",
  },
  /** "E depois do envio?". Só o que acontece de fato (submit-lead.ts): a mensagem é registrada e a
   * DM é avisada por e-mail com o endereço da pessoa como resposta; não há e-mail de confirmação
   * para quem enviou nem prazo definido. Por isso nenhum prazo, reunião ou proposta aqui. */
  afterSend: {
    title: "E depois do envio?",
    intro: "Sem etapas complicadas. É isso que acontece com a sua mensagem.",
    steps: [
      {
        when: "Agora",
        name: "Sua mensagem é registrada.",
        text: "Ela chega à equipe da DM com o que você contou e os dados para retorno.",
      },
      {
        when: "Em seguida",
        name: "A DM lê o que você escreveu.",
        text: "Antes de qualquer conversa, a DM analisa o contexto que você apresentou.",
      },
      {
        when: "Depois",
        name: "Um responsável pode retornar.",
        text: "Pelos dados que você informou, para entender melhor a situação e dizer com honestidade se a DM pode ajudar.",
      },
    ],
    note: "Não há prazo fixo de retorno. Se preferir falar agora, os canais diretos estão logo abaixo.",
  },
};

// ------------------------------------------------------------------------------ Clientes

export type ClientItem = {
  /** Nome exibido como alt (com logo) ou como texto tipográfico (sem logo). */
  name: string;
  /**
   * Caminho de uma imagem em /public (ex.: "/clients/empresa.svg").
   * Prefira SVG ou PNG com fundo transparente; a imagem será invertida para branco no fundo escuro.
   * null → o nome da empresa é exibido como texto.
   */
  logo: string | null;
};

/**
 * Seção "Nossos clientes" da Home.
 * Para adicionar logos reais: coloque o arquivo em public/clients/ e preencha logo: "/clients/nome.svg".
 * Para remover a seção inteira, esvazie o array `items`.
 */
export const CLIENTS = {
  /** Rótulo de seção acima do título (cor de ação). */
  label: "Quem confia na DM",
  heading: "Nossos clientes",
  items: [
    { name: "Cliente 1", logo: "/clients/1.webp" },
    { name: "Cliente 2", logo: "/clients/2.webp" },
    { name: "Cliente 3", logo: "/clients/3.webp" },
    { name: "Cliente 4", logo: "/clients/4.webp" },
    { name: "Cliente 5", logo: "/clients/5.webp" },
    { name: "Cliente 6", logo: "/clients/6.webp" },
    { name: "Cliente 7", logo: "/clients/7.webp" },
    { name: "Cliente 8", logo: "/clients/8.webp" },
    { name: "Cliente 9", logo: "/clients/9.webp" },
    { name: "Cliente 10", logo: "/clients/10.webp" },
    { name: "Cliente 11", logo: "/clients/11.webp" },
    { name: "Cliente 12", logo: "/clients/12.webp" },
    { name: "Cliente 13", logo: "/clients/13.webp" },
    { name: "Cliente 14", logo: "/clients/14.webp" },
    { name: "Cliente 15", logo: "/clients/15.webp" },
    { name: "Cliente 16", logo: "/clients/16.webp" },
    { name: "Cliente 17", logo: "/clients/17.webp" },
    { name: "Cliente 18", logo: "/clients/18.webp" },
    { name: "Cliente 19", logo: "/clients/19.webp" },
    { name: "Cliente 20", logo: "/clients/20.webp" },
  ] satisfies ClientItem[],
};

// -------------------------------------------------------------------------------- Contato

export const CONTACT = {
  title: "Vamos conversar",
  intro:
    "A primeira conversa é para entender a situação e dizer com honestidade se podemos ajudar. Não cobramos por ela.",
  phone: "(34) 99665-3600",
  /** Só dígitos, com DDI: usado no link wa.me. */
  whatsapp: "5534996653600",
  email: "contato@dmempresarial.com.br",
  address: "Avenida C. Delfino Nunes, 1111, Frutal — MG",
  hours: "Atendimento todos os dias.",
  /** Rodapé e dados para o Google. null = não aparece no site. */
  legalName: null as string | null,
  /** Formato: "00.000.000/0000-00". */
  cnpj: null as string | null,
  /** URL completa de cada rede; deixe vazio ("") para esconder o ícone. */
  social: { instagram: "", linkedin: "", facebook: "" } as Record<string, string>,
};

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}`;

// ------------------------------------------------------------------------------- Legais

export type LegalDocument = { title: string; paragraphs: string[] };

export const PRIVACY: LegalDocument = {
  title: "Política de Privacidade",
  paragraphs: [
    "A DM Empresarial ('DM', 'nós') respeita a sua privacidade. Esta Política explica quais dados pessoais coletamos neste site (dmempresarial.com.br), para que os usamos, por quanto tempo os guardamos e quais são os seus direitos, conforme a Lei Geral de Proteção de Dados (Lei n.º 13.709/2018 — LGPD).",

    "1. Dados que você nos envia. Ao preencher o formulário de contato, coletamos: nome, e-mail, WhatsApp e a mensagem (obrigatórios); e, se você informar, o nome da empresa e o assunto do contato. Também registramos a data e hora em que você aceitou esta Política e a versão do texto aceito.",

    "2. Dados coletados automaticamente. Para evitar envios abusivos (spam), o site gera um código cifrado a partir do endereço IP de quem envia o formulário. O IP em si não é armazenado, e o código muda a cada dia, o que impede identificar a pessoa por ele. Este site não usa cookies de rastreamento, pixels de anúncios nem ferramentas de analytics.",

    "3. Para que usamos os dados. Exclusivamente para: (a) ler a sua mensagem e responder pelo e-mail ou WhatsApp que você informou; (b) entender o contexto da empresa antes da primeira conversa; (c) proteger o formulário contra abuso. Não enviamos propaganda nem incluímos você em listas de e-mail sem pedido expresso.",

    "4. Base legal. O tratamento se baseia no seu consentimento, dado ao marcar a caixa de aceite do formulário (art. 7.º, I, da LGPD), e no legítimo interesse da DM em proteger o site contra abuso (art. 7.º, IX).",

    "5. Compartilhamento. A DM não vende, aluga nem cede seus dados. Eles são processados apenas por fornecedores necessários ao funcionamento do site — hospedagem, banco de dados e envio de e-mail —, que atuam como operadores, seguindo as nossas instruções e obrigados a manter sigilo. Alguns desses fornecedores podem armazenar dados fora do Brasil, com as garantias previstas na LGPD.",

    "6. Por quanto tempo guardamos. O código cifrado do IP é apagado em até 30 dias. Os dados do formulário são mantidos por até 24 meses após o envio, para dar continuidade ao atendimento, e depois são excluídos — salvo se houver relação contratual com a DM ou obrigação legal de guardá-los por mais tempo. Você pode pedir a exclusão antes disso a qualquer momento.",

    "7. Seus direitos (art. 18 da LGPD). Você pode, a qualquer momento e sem custo: confirmar se tratamos seus dados; acessá-los; corrigir dados incompletos ou desatualizados; pedir anonimização, bloqueio ou eliminação; saber com quem os compartilhamos; e revogar o consentimento. Basta escrever para contato@dmempresarial.com.br. Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).",

    "8. Segurança. Adotamos medidas técnicas e administrativas para proteger seus dados contra acesso não autorizado, perda ou alteração, como conexão cifrada (HTTPS) e acesso restrito à equipe responsável.",

    "9. Alterações. Esta Política pode ser atualizada. A versão vigente fica sempre nesta página, com a data abaixo. Mudanças relevantes passam a valer para os envios feitos depois da publicação.",

    "Última atualização: 13 de outubro de 2026. Dúvidas ou pedidos: contato@dmempresarial.com.br.",
  ],
};

export const TERMS: LegalDocument = {
  title: "Termos de Uso",
  paragraphs: [
    "Ao acessar e utilizar o site dmempresarial.com.br ('Site'), operado pela DM Empresarial ('DM'), você concorda com os presentes Termos de Uso. Se não concordar com alguma condição, por favor, não utilize o Site.",

    "1. Objeto. Este Site tem finalidade institucional e informativa: apresentar a DM Empresarial, seus serviços de consultoria e conteúdos educativos sobre gestão e finanças empresariais.",

    "2. Uso permitido. O Site é destinado a pessoas físicas e jurídicas interessadas em conhecer ou contratar os serviços da DM. É vedado utilizar o Site para fins ilícitos, disseminar conteúdo falso ou ofensivo, tentar acessar sistemas além do permitido, ou reproduzir conteúdo sem autorização prévia por escrito.",

    "3. Formulário de contato. O formulário de contato disponível no Site é um canal exclusivo para solicitações de informação e diagnóstico inicial. Não constitui prestação de serviço de emergência nem gera, por si só, qualquer vínculo contratual entre as partes.",

    "4. Conteúdo informativo. Os artigos e materiais publicados no Blog da DM têm caráter educativo e informativo. Não substituem consultoria especializada individualizada. A DM não se responsabiliza por decisões tomadas com base exclusivamente no conteúdo do Site.",

    "5. Propriedade intelectual. Todo o conteúdo do Site — textos, logotipos, imagens e estrutura — é de propriedade da DM Empresarial ou está licenciado para seu uso. A reprodução total ou parcial, sem autorização prévia por escrito, é proibida.",

    "6. Links para terceiros. O Site pode conter links para sites de terceiros. A DM não controla nem se responsabiliza pelo conteúdo, práticas de privacidade ou disponibilidade desses sites.",

    "7. Disponibilidade. A DM não garante disponibilidade ininterrupta do Site e pode suspendê-lo temporariamente para manutenção ou atualizações, sem aviso prévio.",

    "8. Limitação de responsabilidade. Na extensão permitida pela lei, a DM não será responsável por danos diretos, indiretos, incidentais ou consequentes decorrentes do uso ou da impossibilidade de uso do Site.",

    "9. Alterações. A DM pode revisar estes Termos a qualquer momento. A versão atualizada será publicada nesta página. O uso contínuo do Site após a publicação de alterações implica a aceitação dos novos termos.",

    "10. Foro. Fica eleito o foro da Comarca de Frutal/MG para dirimir quaisquer controvérsias decorrentes destes Termos, com renúncia a qualquer outro, por mais privilegiado que seja.",

    "Última atualização: 13 de outubro de 2026. Contato: contato@dmempresarial.com.br.",
  ],
};
