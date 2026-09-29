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
    "Somos a consultoria que entra na empresa em dificuldade, reorganiza a operação e senta com o banco junto com você. Em Frutal e região, há mais de dez anos.",
  /** Linha pequena abaixo dos botões do topo. */
  note: "Primeira conversa sem compromisso. Atendemos todos os dias.",
  /** Faixa de números: só o que a DM confirmou. */
  stats: [
    { value: "+100", label: "empresas atendidas desde a fundação" },
    { value: "10 anos", label: "sentando à mesa de negociação com bancos" },
  ],
  /** Foto do topo: caminho de uma imagem em /public (ex.: "/home/equipe.jpg"); null = espaço vazio. */
  heroImage: null as { src: string; alt: string } | null,
};

// ---------------------------------------------------------------------------------- Sobre

export const ABOUT = {
  title: "Sobre a DM",
  intro:
    "Consultoria empresarial em Frutal/MG. Método, acompanhamento e gente de verdade por trás de cada decisão.",
  whoWeAre: [
    "A DM Empresarial desenvolve pessoas e empresas por meio de uma consultoria personalizada e orientada a resultados concretos. Entramos no negócio para identificar os pontos críticos, reorganizar a estratégia e destravar o crescimento.",
    "Também atuamos na recuperação de crédito, negociando diretamente com bancos para reorganizar dívidas e devolver fôlego financeiro ao negócio. Quem conduz o trabalho é Dino Marques de Oliveira, fundador da consultoria.",
  ],
  howWeThink: [PLACEHOLDER],
  howWeWork: [PLACEHOLDER],
  /** "Como trabalhamos". Até 5: os nomes giram em volta do círculo da Home. `practice` é a
   * explicação que aparece em /sobre (vazia: só o nome). */
  values: [
    { name: "Diagnóstico antes de proposta", practice: "" },
    { name: "Transparência em cada etapa", practice: "" },
    { name: "Plano com prazo e responsável", practice: "" },
    { name: "Disponibilidade todos os dias", practice: "" },
    { name: "Discrição sobre a situação do cliente", practice: "" },
  ] as { name: string; practice: string }[],
};

// ------------------------------------------------------------------------------ Soluções

export type SolutionType = "CONSULTORIA" | "SERVICO";
export type SolutionItem = { title: string; body?: string };

export type Solution = {
  /** Endereço: /solucoes/<slug>. Mudar o slug quebra links antigos. */
  slug: string;
  type: SolutionType;
  title: string;
  summary: string;
  isFeatured: boolean;
  context: string[];
  approach: string[];
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
    context: [PLACEHOLDER],
    approach: [PLACEHOLDER],
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
    context: [PLACEHOLDER],
    approach: [PLACEHOLDER],
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
    context: [PLACEHOLDER],
    approach: [PLACEHOLDER],
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
    context: [PLACEHOLDER],
    approach: [PLACEHOLDER],
    situations: [],
    steps: [],
    goals: [],
  },
];

export function findSolution(slug: string): Solution | undefined {
  return SOLUTIONS.find((s) => s.slug === slug);
}

// --------------------------------------------------------------------------- Especialistas

export type Specialist = {
  /** Endereço: /sobre/especialistas/<slug>. Também é o autor gravado nos artigos do blog. */
  slug: string;
  name: string;
  roleTitle: string;
  summary: string | null;
  bio: string[];
  /** Caminho de uma imagem em /public (ex.: "/especialistas/nome.jpg"); null mostra iniciais. */
  photo: string | null;
};

export const SPECIALISTS: Specialist[] = [
  {
    slug: "especialista-dm",
    name: "Especialista DM",
    roleTitle: PLACEHOLDER,
    summary: null,
    bio: [PLACEHOLDER],
    photo: null,
  },
];

export function findSpecialist(slug: string): Specialist | undefined {
  return SPECIALISTS.find((s) => s.slug === slug);
}

/** Nome do autor de um artigo. Se o especialista sair da lista, o artigo passa a ser da DM. */
export function authorName(slug: string): string {
  return findSpecialist(slug)?.name ?? "DM Empresarial";
}

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
};

export const WHATSAPP_URL = `https://wa.me/${CONTACT.whatsapp}`;

// ------------------------------------------------------------------------------- Legais

export type LegalDocument = { title: string; paragraphs: string[] };

/** ATENÇÃO: o site coleta dados (formulário de contato). Publique o texto real antes de divulgar. */
export const PRIVACY: LegalDocument = {
  title: "Política de Privacidade",
  paragraphs: [PLACEHOLDER],
};

export const TERMS: LegalDocument = {
  title: "Termos de Uso",
  paragraphs: [PLACEHOLDER],
};
