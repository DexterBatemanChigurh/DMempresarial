import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Texto corrido e de apoio. Serifa só em texto longo (`article`); interface e textos curtos em
 * sans (Blueprint 2, seção 07). `muted` (tinta suave) só de 13 px para cima e fora de fundo areia.
 */
const SIZE = {
  lg: "font-sans text-body-lg",
  base: "font-sans text-body",
  sm: "font-sans text-body-sm",
  article: "font-serif text-article",
  caption: "font-sans text-caption",
  metadata: "font-sans text-metadata font-medium tracking-[0.02em]",
} as const;

const TONE = {
  default: "text-text",
  secondary: "text-text-secondary",
  muted: "text-text-muted",
} as const;

type TextProps = {
  as?: "p" | "span" | "div" | "li";
  size?: keyof typeof SIZE;
  tone?: keyof typeof TONE;
  className?: string;
  children: ReactNode;
};

export function Text({
  as: Tag = "p",
  size = "base",
  tone = "default",
  className,
  children,
}: TextProps) {
  return <Tag className={cn(SIZE[size], TONE[tone], className)}>{children}</Tag>;
}
