import "server-only";
import { cacheLife } from "next/cache";

/**
 * Ano corrente para o rodapé. Com Cache Components, `new Date()` não pode rodar no prerender
 * sem cachear: esta função `use cache` é avaliada uma vez por período (perfil `max`, revalida a
 * cada 30 dias — suficiente para um ano de copyright) e o valor fica no cache do servidor.
 */
export async function getCurrentYear(): Promise<number> {
  "use cache";
  cacheLife("max");
  return new Date().getFullYear();
}
