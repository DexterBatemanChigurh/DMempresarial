import Link from "next/link";
import { Text } from "@/components/ui";

/** Filtro por estado (links, funciona sem JS) e paginação das listas do painel. */
export function FilterNav({
  label,
  basePath,
  param,
  current,
  options,
}: {
  label: string;
  basePath: string;
  param: string;
  current: string | undefined;
  options: { value: string | undefined; label: string; count?: number }[];
}) {
  return (
    <nav aria-label={label} className="mb-lg flex flex-wrap gap-md font-sans text-sm">
      {options.map((option) => {
        const href = option.value
          ? `${basePath}?${param}=${encodeURIComponent(option.value)}`
          : basePath;
        const active = option.value === current;
        return (
          <Link
            key={option.value ?? "todos"}
            href={href}
            aria-current={active ? "page" : undefined}
            className={
              active
                ? "font-semibold text-text underline underline-offset-4"
                : "text-link underline underline-offset-4"
            }
          >
            {option.label}
            {option.count !== undefined ? ` (${option.count})` : ""}
          </Link>
        );
      })}
    </nav>
  );
}

export function Pagination({
  label,
  page,
  totalPages,
  hrefFor,
}: {
  label: string;
  page: number;
  totalPages: number;
  hrefFor: (page: number) => string;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav aria-label={label} className="mt-xl flex items-center gap-md">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className="text-link underline underline-offset-4">
          Anterior
        </Link>
      ) : null}
      <Text as="span" size="caption" tone="secondary">
        Página {page} de {totalPages}
      </Text>
      {page < totalPages ? (
        <Link href={hrefFor(page + 1)} className="text-link underline underline-offset-4">
          Próxima
        </Link>
      ) : null}
    </nav>
  );
}

export function parsePageParam(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
