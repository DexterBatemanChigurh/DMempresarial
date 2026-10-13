import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Título. `as` define a SEMÂNTICA (nível na hierarquia do documento) e `variant` a APARÊNCIA:
 * um h2 pode ter escala de display sem quebrar a ordem dos níveis (Blueprint 2, seção 13).
 */
export type HeadingLevel = "h1" | "h2" | "h3" | "h4" | "h5" | "h6";

const VARIANT = {
  "display-xl": "font-display text-display-xl font-bold",
  "display-l": "font-display text-display-l font-bold",
  "display-m": "font-display text-display-m font-bold",
  h1: "font-display text-h1 font-bold",
  h2: "font-display text-h2 font-bold",
  h3: "font-display text-h3 font-bold",
  h4: "font-sans text-h4 font-semibold",
  "article-h2": "font-display text-article-h2 font-bold",
} as const;

export type HeadingVariant = keyof typeof VARIANT;

const DEFAULT_VARIANT: Record<HeadingLevel, HeadingVariant> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h4",
  h6: "h4",
};

type HeadingProps = {
  as: HeadingLevel;
  variant?: HeadingVariant;
  id?: string;
  className?: string;
  children: ReactNode;
};

export function Heading({ as: Tag, variant, className, children, id }: HeadingProps) {
  return (
    <Tag id={id} className={cn(VARIANT[variant ?? DEFAULT_VARIANT[Tag]], "text-text", className)}>
      {children}
    </Tag>
  );
}
