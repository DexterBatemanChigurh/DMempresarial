import type { Metadata } from "next";
import Link from "next/link";
import { Button, Heading, Text } from "@/components/ui";
import { listSolutionsForAdminForRoute } from "@/features/catalog/application/solution-crud";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Soluções" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};
const TYPE_LABEL: Record<string, string> = { CONSULTORIA: "Consultoria", SERVICO: "Serviço" };

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function SolutionsListPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const page = parsePage((await searchParams).pagina);
  const { items, total, pageSize } = await listSolutionsForAdminForRoute(actor, { page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Soluções
        </Heading>
        <Button href="/admin/solucoes/novo" size="sm">
          Nova solução
        </Button>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Consultorias e serviços oferecidos pela DM.
      </Text>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhuma solução ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((solution) => (
            <li
              key={solution.id}
              className="flex flex-wrap items-center justify-between gap-sm py-sm"
            >
              <div>
                <Link
                  href={`/admin/solucoes/${solution.id}`}
                  className="font-sans font-semibold text-link underline-offset-4 hover:underline"
                >
                  {solution.title}
                </Link>
                <p className="font-sans text-caption text-text-secondary">
                  {STATUS_LABEL[solution.status]} · {TYPE_LABEL[solution.type]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Páginas de soluções" className="mt-xl flex items-center gap-md">
          {page > 1 ? (
            <Link
              href={`/admin/solucoes?pagina=${page - 1}`}
              className="text-link underline underline-offset-4"
            >
              Anterior
            </Link>
          ) : null}
          <Text as="span" size="caption" tone="secondary">
            Página {page} de {totalPages}
          </Text>
          {page < totalPages ? (
            <Link
              href={`/admin/solucoes?pagina=${page + 1}`}
              className="text-link underline underline-offset-4"
            >
              Próxima
            </Link>
          ) : null}
        </nav>
      ) : null}
    </>
  );
}
