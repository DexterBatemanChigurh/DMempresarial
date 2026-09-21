import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { AlertIcon, CheckCircleIcon, InfoIcon } from "./icons";

/**
 * Mensagem de resultado de um formulário (Blueprint 2, seção 15): o retorno é no próprio lugar
 * (sem toast). Nunca só por cor: cada tom tem ícone e texto. Erro é anunciado na hora
 * (`role="alert"`); sucesso e informação, de forma educada (`role="status"`).
 */
const TONE = {
  error: { icon: AlertIcon, box: "border-danger text-danger", role: "alert" },
  success: { icon: CheckCircleIcon, box: "border-success text-success", role: "status" },
  info: { icon: InfoIcon, box: "border-border-strong text-text", role: "status" },
} as const;

export function FormMessage({
  tone,
  title,
  children,
  className,
}: {
  tone: keyof typeof TONE;
  title?: string;
  children?: ReactNode;
  className?: string;
}) {
  const { icon: Icon, box, role } = TONE[tone];
  return (
    <div
      role={role}
      className={cn("flex gap-sm border-l-2 bg-surface-raised px-md py-sm", box, className)}
    >
      <Icon className="mt-2xs size-5 shrink-0" />
      <div className="font-sans text-body-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="text-text">{children}</div> : null}
      </div>
    </div>
  );
}
