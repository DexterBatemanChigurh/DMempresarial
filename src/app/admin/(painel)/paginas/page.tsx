import type { Metadata } from "next";
import Link from "next/link";
import { Button, Heading, Text } from "@/components/ui";
import { listPagesForAdminForRoute } from "@/features/pages/application/page-crud";
import { PAGE_TEMPLATE_LABEL } from "@/features/pages/domain/page-schemas";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Páginas" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function PagesListPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const page = parsePage((await searchParams).pagina);
  const { items, total, pageSize } = await listPagesForAdminForRoute(actor, { page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Páginas
        </Heading>
        <Button href="/admin/paginas/novo" size="sm">
          Nova página
        </Button>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Páginas institucionais: o template decide o layout, aqui só se edita o texto.
      </Text>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhuma página ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center justify-between gap-sm py-sm">
              <div>
                <Link
                  href={`/admin/paginas/${page.id}`}
                  className="font-sans font-semibold text-link underline-offset-4 hover:underline"
                >
                  {page.title}
                </Link>
                <p className="font-sans text-caption text-text-secondary">
                  {STATUS_LABEL[page.status]} · {PAGE_TEMPLATE_LABEL[page.template]} · /{page.key}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Páginas de páginas" className="mt-xl flex items-center gap-md">
          {page > 1 ? (
            <Link
              href={`/admin/paginas?pagina=${page - 1}`}
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
              href={`/admin/paginas?pagina=${page + 1}`}
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
