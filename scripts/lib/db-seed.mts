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
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}
