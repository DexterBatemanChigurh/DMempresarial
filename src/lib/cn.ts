/** Junta nomes de classe ignorando valores vazios. Sem dependência (não precisamos de clsx). */
export function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}
