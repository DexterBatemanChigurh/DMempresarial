import type { SVGProps } from "react";

/**
 * Ícones de ação e estado (Blueprint 2, seção 12): traço de 1,5 px, grade de 24 px, herdam a
 * cor do texto. Decorativos: sempre `aria-hidden` (o significado vem do texto ao lado).
 */
type IconProps = Omit<SVGProps<SVGSVGElement>, "children">;

function Icon({ className, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    />
  );
}

export function ArrowRightIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M4 12h16M14 6l6 6-6 6" />
    </Icon>
  );
}

export function AlertIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </Icon>
  );
}

export function CheckCircleIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.7 2.7L16 9.8" />
    </Icon>
  );
}

export function InfoIcon(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.5h.01" />
    </Icon>
  );
}

export function SpinnerIcon({ className, ...rest }: IconProps) {
  return (
    <Icon className={className ? `animate-spin ${className}` : "animate-spin"} {...rest}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </Icon>
  );
}
