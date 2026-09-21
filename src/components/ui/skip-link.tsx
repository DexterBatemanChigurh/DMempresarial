/** Primeiro elemento focável da página: leva direto ao conteúdo (Blueprint 2, seção 26). */
export function SkipLink({ targetId = "conteudo" }: { targetId?: string }) {
  return (
    <a
      href={`#${targetId}`}
      className="sr-only rounded-control bg-surface-raised px-md py-sm font-sans text-base font-semibold text-text focus:not-sr-only focus:fixed focus:top-md focus:left-md focus:z-50 focus:shadow-overlay"
    >
      Ir para o conteúdo
    </a>
  );
}
