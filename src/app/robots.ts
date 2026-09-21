import type { MetadataRoute } from "next";
import { env } from "@/server/env";

// Lido a cada requisição, não no build: um build de staging promovido a production não pode
// carregar o `Disallow: /` (nem o contrário: production indexável em staging).
export const dynamic = "force-dynamic";

// Falha para o lado seguro: qualquer ambiente que não seja production não é indexável.
export default function robots(): MetadataRoute.Robots {
  if (env().APP_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] } };
}
