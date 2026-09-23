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
 * para URL absoluta. Sem imagem — não existe asset de marca real ainda (lacuna L-02).
 */
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
    },
  };
}
