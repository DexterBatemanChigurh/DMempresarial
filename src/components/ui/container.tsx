import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Largura e margens laterais do conteúdo (Blueprint 2, seções 04 e 05). Texto corrido nunca
 * passa de `reading`. Margens: 20 → 24 → 32 → 40 px; a partir de `xl` o container centraliza.
 */
const SIZE = {
  content: "max-w-content",
  wide: "max-w-wide",
  reading: "max-w-reading",
  narrow: "max-w-narrow",
} as const;

export type ContainerSize = keyof typeof SIZE;

type ContainerProps = {
  as?: ElementType;
  size?: ContainerSize;
  className?: string;
  children: ReactNode;
};

export function Container({
  as: Tag = "div",
  size = "content",
  className,
  children,
}: ContainerProps) {
  return (
    <Tag className={cn("mx-auto w-full px-5 sm:px-6 md:px-8 lg:px-10", SIZE[size], className)}>
      {children}
    </Tag>
  );
}
