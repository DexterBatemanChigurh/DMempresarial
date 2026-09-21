import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ArrowRightIcon, SpinnerIcon } from "./icons";

/**
 * Botões (Blueprint 2, seção 13). `primary` (terracota) é o botão de CONVERSÃO: no máximo um por
 * tela ("Fale com a DM"). `secondary` é a ação alternativa; `tertiary` navega/continua leitura.
 * Alturas 40/48/56 px: o padrão de 48 px respeita o alvo de toque mínimo de 44 px.
 */
const BASE =
  "inline-flex items-center justify-center gap-xs rounded-control font-sans font-semibold transition-colors duration-150 ease-standard";

const SIZE = {
  sm: "h-10 px-md text-sm",
  md: "h-12 px-lg text-base",
  lg: "h-14 px-xl text-base",
} as const;

const VARIANT = {
  primary:
    "bg-action text-action-contrast hover:bg-action-hover disabled:bg-surface-disabled disabled:text-text-disabled",
  secondary:
    "border-[1.5px] border-text text-text hover:bg-text/10 disabled:border-transparent disabled:bg-surface-disabled disabled:text-text-disabled",
  tertiary:
    "min-h-11 px-0 text-link underline-offset-4 hover:underline disabled:text-text-disabled",
} as const;

export type ButtonVariant = keyof typeof VARIANT;
export type ButtonSize = keyof typeof SIZE;

type Common = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

type AsButton = Common &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className" | "children"> & {
    href?: undefined;
    /** Envio em andamento: bloqueia novo clique, sinaliza `aria-busy` e mostra o indicador. */
    loading?: boolean;
    /** Texto durante o carregamento (ex.: "Enviando…"). Padrão: o próprio rótulo. */
    loadingLabel?: string;
  };

type AsLink = Common &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className" | "children" | "href"> & {
    href: string;
  };

export type ButtonProps = AsButton | AsLink;

export function Button(props: ButtonProps) {
  const { variant = "primary", size = "md", className, children } = props;
  const classes = cn(BASE, SIZE[size], VARIANT[variant], className);
  const arrow = variant === "tertiary" ? <ArrowRightIcon className="size-5" /> : null;

  if (props.href !== undefined) {
    const { href, variant: _v, size: _s, className: _c, children: _ch, ...anchor } = props;
    return (
      <Link href={href} className={classes} {...anchor}>
        {children}
        {arrow}
      </Link>
    );
  }

  const {
    loading = false,
    loadingLabel,
    disabled,
    type = "button",
    variant: _v,
    size: _s,
    className: _c,
    children: _ch,
    href: _h,
    ...button
  } = props;
  return (
    <button
      // `button` por padrão: um botão dentro de <form> não envia sem pedir (type="submit").
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={classes}
      {...button}
    >
      {loading ? <SpinnerIcon className="size-5" /> : null}
      {loading ? (loadingLabel ?? children) : children}
      {loading ? null : arrow}
    </button>
  );
}

/** Botão só com ícone (ex.: abrir/fechar menu). O nome acessível é obrigatório. */
export function IconButton({
  label,
  className,
  children,
  type = "button",
  ...rest
}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, "aria-label" | "className"> & {
  label: string;
  className?: string;
}) {
  return (
    <button
      type={type}
      aria-label={label}
      className={cn(
        "inline-flex size-11 items-center justify-center rounded-control text-text transition-colors duration-150 ease-standard hover:bg-text/10",
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
}
