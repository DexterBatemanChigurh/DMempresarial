import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * Link em texto corrido (Blueprint 2, seção 13): cor de link, sublinhado de 1 px com
 * afastamento de 3 px que engrossa no hover. Caminhos internos usam o roteador; endereços
 * externos, `mailto:` e `tel:` usam <a>, e os externos avisam a quem usa leitor de tela.
 */
const STYLE = "text-link underline decoration-1 underline-offset-[3px] hover:decoration-2";

export function TextLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const isInternal = href.startsWith("/") || href.startsWith("#");
  if (isInternal) {
    return (
      <Link href={href} className={cn(STYLE, className)}>
        {children}
      </Link>
    );
  }
  const isWeb = /^https?:\/\//i.test(href);
  return (
    <a
      href={href}
      className={cn(STYLE, className)}
      {...(isWeb ? { target: "_blank", rel: "noopener noreferrer" } : {})}
    >
      {children}
      {isWeb ? <span className="sr-only"> (abre em nova aba)</span> : null}
    </a>
  );
}
