import type { MetadataRoute } from "next";
import { env } from "@/server/env";

// Falha para o lado seguro: qualquer ambiente que não seja production não é indexável.
export default function robots(): MetadataRoute.Robots {
  if (env().APP_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api"] } };
}
