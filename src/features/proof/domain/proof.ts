import { z } from "zod";

/**
 * Depoimento/Prova Social (Gap L-09).
 * Dados reais vindos do Google Meu Negócio — não inventados.
 * Estrutura preparada para quando a DM autorizar uso público.
 */
export const depoimentoSchema = z.object({
  autor: z.string().min(1),
  avatarUrl: z.string().url().nullable().optional(),
  texto: z.string().min(1),
  estrelas: z.number().int().min(1).max(5),
  data: z.string().datetime().optional(), // ISO 8601
  fonte: z.enum(["google", "manual"]).default("google"),
  visivel: z.boolean().default(true),
  ordem: z.number().int().default(0),
});

export type Depoimento = z.infer<typeof depoimentoSchema>;

/**
 * Dados reais do Google Meu Negócio (fornecidos pelo usuário).
 * Usados como seed/placeholder até a DM autorizar uso público.
 */
export const DEPOIMENTOS_SEED: Depoimento[] = [
  {
    autor: "cTanaka",
    avatarUrl: null,
    texto:
      "Sensacional! Ótima consultoria, ótimos valores, quem possui uma empresa tem que conhecer o pessoal e tirar as próprias conclusões. Recomendo a todos",
    estrelas: 5,
    data: "2026-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 1,
  },
  {
    autor: "Olavio Cortes",
    avatarUrl: null,
    texto: "Sou cliente a vários anos!!! Excelente!",
    estrelas: 5,
    data: "2026-07-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 2,
  },
  {
    autor: "Guilherme Queiroz",
    avatarUrl: null,
    texto: "Vocês são fera",
    estrelas: 5,
    data: "2026-07-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 3,
  },
  {
    autor: "Cleber Petersen",
    avatarUrl: null,
    texto:
      "Esse é o endereço certo! O sucesso dos negócios passa pela gestão de equipes e, por isso, não só um bom acompanhamento é essencial para que os resultados sejam alcançados com também o treinamento dos colaboradores deve ser constante. Recomendo!",
    estrelas: 5,
    data: "2022-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 4,
  },
  {
    autor: "JoSé NeTo",
    avatarUrl: null,
    texto:
      "Ótimo atendimento, consultoria que ajudou na rapidez dos resultados, renovação dos conhecimentos para melhoria nas tomadas de decisões economizando recursos e enriquecendo a relação empresa/colaborador.",
    estrelas: 5,
    data: "2022-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 5,
  },
  {
    autor: "Diretoria Impacto Comunicação",
    avatarUrl: null,
    texto: "Excelência em consultoria empresarial e aconselhamento pessoal!",
    estrelas: 5,
    data: "2024-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 6,
  },
  {
    autor: "Markim O original (Markim)",
    avatarUrl: null,
    texto: "Ótima consultoria!",
    estrelas: 5,
    data: "2022-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 7,
  },
  {
    autor: "Raissa Sousa",
    avatarUrl: null,
    texto: "Excelente equipe e um trabalho muito bem realizado!",
    estrelas: 5,
    data: "2026-07-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 8,
  },
  {
    autor: "Diego Cunha",
    avatarUrl: null,
    texto: "Equipe muito profissional. Atendimento de muita qualidade",
    estrelas: 5,
    data: "2026-07-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 9,
  },
  {
    autor: "Mariana Correa",
    avatarUrl: null,
    texto: "Excelente equipe e um trabalho muito bem realizado!",
    estrelas: 5,
    data: "2019-06-01T00:00:00Z",
    fonte: "google",
    visivel: true,
    ordem: 10,
  },
];

export type { Depoimento as ProofTestimonial };
