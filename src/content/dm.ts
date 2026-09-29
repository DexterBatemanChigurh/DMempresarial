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
  headlineStart: "Consultoria empresarial com",
  headlineHighlight: "método, acompanhamento e gente de verdade",
  description:
    "Diagnóstico claro, plano prático e alguém acompanhando de perto — da decisão até o resultado.",
  /** Foto do topo: caminho de uma imagem em /public (ex.: "/home/equipe.jpg"); null = espaço vazio. */
  heroImage: null as { src: string; alt: string } | null,
};

// ---------------------------------------------------------------------------------- Sobre

export const ABOUT = {
  title: "Sobre a DM",
  intro:
    "Consultoria empresarial em Frutal/MG. Método, acompanhamento e gente de verdade por trás de cada decisão.",
  whoWeAre: [PLACEHOLDER],
  howWeThink: [PLACEHOLDER],
  howWeWork: [PLACEHOLDER],
  /** Até 5. Os nomes giram em volta do círculo da Home; sem nenhum, o círculo usa dados da DM. */
  values: [] as { name: string; practice: string }[],
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
      "Negociamos diretamente com os bancos para reorganizar dívidas, alongar prazos e devolver fôlego financeiro ao negócio.",
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
      "Mapeamento de tudo que a empresa deve, prioridades de pagamento e um plano compatível com o caixa real.",
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
      "Identificamos o que está travando o crescimento e montamos um plano de ação com prazo e responsável.",
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
      "Reorganizamos processos, estrutura e indicadores para recuperar o controle da operação.",
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

// -------------------------------------------------------------------------------- Contato

export const CONTACT = {
  intro: "Conte o contexto da sua empresa e a DM explica como pode ajudar.",
};

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
