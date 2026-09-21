import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Rótulo que abre uma seção, com filete forte de 1 px (assinatura editorial da marca; Blueprint 2,
 * seção 34). Caixa alta só existe aqui e em rótulos curtos, nunca em títulos.
 */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "border-t border-border-strong pt-sm font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase",
        className,
      )}
    >
      {children}
    </p>
  );
}
