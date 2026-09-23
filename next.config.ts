import type { NextConfig } from "next";

// Cabeçalhos de base. CSP em duas camadas, HSTS e demais entram na fase de segurança (ADR-009).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  cacheComponents: true,
  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
  // Decisão de produto: a URL pública fica em português, como o sitemap documentado pede
  // (docs/01 §05). A chave interna da página (`pages.key`) continua em inglês (`privacy`,
  // `terms` — RESERVED_SLUGS já bloqueia as strings em português como key, convenção testada);
  // as rotas `/politica-de-privacidade` e `/termos-de-uso` (rotas próprias, não a `/[key]`
  // dinâmica) fazem essa tradução. Quem tiver indexado o endereço em inglês é redirecionado
  // de volta ao canônico em português.
  async redirects() {
    return [
      { source: "/privacy", destination: "/politica-de-privacidade", permanent: true },
      { source: "/terms", destination: "/termos-de-uso", permanent: true },
    ];
  },
};

export default nextConfig;
