import type { MediaResolver } from "@/lib/rich-text";

/**
 * Capa de um artigo nas listagens (Home, /blog, categorias). Sem capa, a caixa fica só com o fundo
 * neutro para o grid não "pular". `resolve` vem de `buildCoverResolverForRoute` (uma consulta).
 */
export function PostCover({
  mediaId,
  resolve,
  className = "",
  children,
}: {
  mediaId: string | null;
  resolve: MediaResolver;
  className?: string;
  children?: React.ReactNode;
}) {
  const cover = mediaId ? resolve(mediaId) : null;
  return (
    <div
      className={`relative aspect-[16/10] overflow-hidden rounded-[12px] border border-border bg-surface-muted ${className}`}
    >
      {cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cover.url}
          alt={cover.alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-base group-hover:scale-[1.03]"
        />
      ) : null}
      {children}
    </div>
  );
}
