import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Faixa de página com ritmo vertical da escala de espaçamento e tom de fundo. O tom troca as
 * variáveis semânticas (texto, links, bordas), então os filhos herdam contraste correto sem
 * saber em que faixa estão (Blueprint 2, seção 09).
 */
const SPACING = {
  default: "py-3xl md:py-4xl",
  loose: "py-4xl md:py-5xl",
  none: "",
} as const;

export type SectionTone = "default" | "muted" | "dark";

type SectionProps = {
  tone?: SectionTone;
  spacing?: keyof typeof SPACING;
  id?: string;
  "aria-labelledby"?: string;
  className?: string;
  children: ReactNode;
};

export function Section({
  tone = "default",
  spacing = "default",
  className,
  children,
  ...rest
}: SectionProps) {
  return (
    <section
      data-tone={tone === "default" ? undefined : tone}
      className={cn("bg-surface text-text", SPACING[spacing], className)}
      {...rest}
    >
      {children}
    </section>
  );
}
