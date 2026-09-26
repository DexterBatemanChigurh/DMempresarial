// Seed de dados REAIS e confirmados (docs/03, parte 39). Idempotente e NUNCA sobrescreve edições:
// se um editor renomeou uma categoria ou preencheu as configurações, rodar de novo não desfaz.
// Não cria nenhum conteúdo fictício: solução, especialista, cliente, depoimento ou número.
import pg from "pg";

/** Categorias iniciais do blog, confirmadas no Product Blueprint (docs/01, seção 12). */
export const BASE_CATEGORIES = [
  { slug: "gestao", name: "Gestão" },
  { slug: "financas", name: "Finanças" },
  { slug: "marketing", name: "Marketing" },
  { slug: "processos", name: "Processos" },
  { slug: "empreendedorismo", name: "Empreendedorismo" },
  { slug: "mercado", name: "Mercado" },
  { slug: "negocios-em-frutal-e-regiao", name: "Negócios em Frutal e Região" },
] as const;

/** Único dado de contato confirmado até agora (Prompt 1). Telefone, e-mail e redes seguem nulos. */
export const CONFIRMED_ADDRESS = "Avenida C. Delfino Nunes, 1111, Frutal — MG";

/**
 * Avaliações públicas reais da DM no Google (fornecidas pelo cliente, com a data aproximada que o
 * Google mostra). Entram publicadas, como estavam no site; a partir daí são geridas em
 * /admin/depoimentos. Só são inseridas se a tabela nunca recebeu depoimento nenhum — rodar o seed
 * de novo não recria o que a DM apagou nem duplica o que editou.
 */
export const GOOGLE_TESTIMONIALS = [
  {
    authorName: "cTanaka",
    quote:
      "Sensacional! Ótima consultoria, ótimos valores, quem possui uma empresa tem que conhecer o pessoal e tirar as próprias conclusões. Recomendo a todos",
    rating: 5,
    givenAt: "2026-06-01T00:00:00Z",
  },
  {
    authorName: "Olavio Cortes",
    quote: "Sou cliente a vários anos!!! Excelente!",
    rating: 5,
    givenAt: "2026-07-01T00:00:00Z",
  },
  {
    authorName: "Guilherme Queiroz",
    quote: "Vocês são fera",
    rating: 5,
    givenAt: "2026-07-01T00:00:00Z",
  },
  {
    authorName: "Cleber Petersen",
    quote:
      "Esse é o endereço certo! O sucesso dos negócios passa pela gestão de equipes e, por isso, não só um bom acompanhamento é essencial para que os resultados sejam alcançados com também o treinamento dos colaboradores deve ser constante. Recomendo!",
    rating: 5,
    givenAt: "2022-06-01T00:00:00Z",
  },
  {
    authorName: "JoSé NeTo",
    quote:
      "Ótimo atendimento, consultoria que ajudou na rapidez dos resultados, renovação dos conhecimentos para melhoria nas tomadas de decisões economizando recursos e enriquecendo a relação empresa/colaborador.",
    rating: 5,
    givenAt: "2022-06-01T00:00:00Z",
  },
  {
    authorName: "Diretoria Impacto Comunicação",
    quote: "Excelência em consultoria empresarial e aconselhamento pessoal!",
    rating: 5,
    givenAt: "2024-06-01T00:00:00Z",
  },
  {
    authorName: "Markim O original (Markim)",
    quote: "Ótima consultoria!",
    rating: 5,
    givenAt: "2022-06-01T00:00:00Z",
  },
  {
    authorName: "Raissa Sousa",
    quote: "Excelente equipe e um trabalho muito bem realizado!",
    rating: 5,
    givenAt: "2026-07-01T00:00:00Z",
  },
  {
    authorName: "Diego Cunha",
    quote: "Equipe muito profissional. Atendimento de muita qualidade",
    rating: 5,
    givenAt: "2026-07-01T00:00:00Z",
  },
  {
    authorName: "Mariana Correa",
    quote: "Excelente equipe e um trabalho muito bem realizado!",
    rating: 5,
    givenAt: "2019-06-01T00:00:00Z",
  },
] as const;

export async function seedBase(adminUrl: string): Promise<void> {
  const client = new pg.Client({ connectionString: adminUrl, connectionTimeoutMillis: 10_000 });
  await client.connect();
  try {
    await client.query("begin");
    for (const [position, category] of BASE_CATEGORIES.entries()) {
      await client.query(
        "insert into categories (slug, name, position) values ($1, $2, $3) on conflict (slug) do nothing",
        [category.slug, category.name, position],
      );
    }
    await client.query(
      "insert into site_settings (id, address) values (1, $1) on conflict (id) do nothing",
      [CONFIRMED_ADDRESS],
    );
    const { rows } = await client.query("select exists (select 1 from testimonials) as seeded");
    if (!rows[0]?.seeded) {
      for (const [position, t] of GOOGLE_TESTIMONIALS.entries()) {
        await client.query(
          `insert into testimonials
             (author_name, quote, rating, source, given_at, position, status, published_at)
           values ($1, $2, $3, 'GOOGLE', $4, $5, 'PUBLISHED', now())`,
          [t.authorName, t.quote, t.rating, t.givenAt, position],
        );
      }
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}
