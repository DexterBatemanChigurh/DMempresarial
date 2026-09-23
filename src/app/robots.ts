import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { env } from "@/server/env";

// Lido a cada requisição, não no build: um build de staging promovido a production não pode
// carregar o `Disallow: /` (nem o contrário: production indexável em staging). Com
// `cacheComponents`, `export const dynamic` não existe mais — `connection()` marca o ponto
// em que a renderização espera a requisição real (mesmo padrão de `design-system/page.tsx`).
export default async function robots(): Promise<MetadataRoute.Robots> {
  await connection();
  // Falha para o lado seguro: qualquer ambiente que não seja production não é indexável.
  if (env().APP_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] } };
}
