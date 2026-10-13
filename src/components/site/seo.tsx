import type { Metadata } from "next";

/**
 * JSON-LD como TEXTO (children) de `<script>` — não é HTML montado como string; React escapa o
 * conteúdo normalmente, e é o padrão que a própria documentação do Next recomenda para dados
 * estruturados.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
}

/**
 * Metadata pública comum (canonical + Open Graph): `metadataBase` no layout raiz resolve `path`
 * para URL absoluta. Um `openGraph` definido aqui substitui o do layout e o `opengraph-image.png`
 * da raiz, por isso a imagem, o nome do site e o idioma precisam ser repetidos.
 */
const OG_IMAGE = {
  url: "/opengraph-image.png",
  width: 1200,
  height: 630,
  alt: "Logo da DM Empresarial, consultoria empresarial em Frutal, MG",
};

export function publicMetadata(input: {
  title: string;
  description?: string;
  path: string;
  type?: "website" | "article";
}): Metadata {
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    openGraph: {
      title: input.title,
      description: input.description,
      url: input.path,
      type: input.type ?? "website",
      siteName: "DM Empresarial",
      locale: "pt_BR",
      images: [OG_IMAGE],
    },
  };
}
