import type { NextConfig } from "next";

// Cabeçalhos de base — fonte ÚNICA (o vercel.json não repete nenhum). CSP em duas camadas fica
// em src/proxy.ts (ADR-009). HSTS aqui: 2 anos +
// subdomínios (valor recomendado na doc do Next). Sem `preload` de propósito — entrar na lista de
// preload do navegador é praticamente irreversível e exige domínio definitivo (lacuna L-02 do
// Blueprint 1); decisão para o usuário quando o domínio real estiver definido (Fase 12).
// Em `http://localhost` o cabeçalho é inofensivo (HSTS só tem efeito sobre HTTPS).
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
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
      // `/servicos` é uma visão filtrada; a página de cada serviço vive só em `/solucoes/<slug>`
      // (docs/01, D1): uma URL canônica por entidade.
      { source: "/servicos/:slug", destination: "/solucoes/:slug", permanent: true },
    ];
  },
};

export default nextConfig;
