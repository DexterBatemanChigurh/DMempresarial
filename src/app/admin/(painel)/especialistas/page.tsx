import type { Metadata } from "next";
import Link from "next/link";
import { Button, Heading, Text } from "@/components/ui";
import { listSpecialistsForAdminForRoute } from "@/features/people/application/specialist-crud";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Especialistas" };

const STATUS_LABEL: Record<string, string> = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};
const KIND_LABEL: Record<string, string> = { TEAM: "Equipe", GUEST: "Convidado" };

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function SpecialistsListPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const page = parsePage((await searchParams).pagina);
  const { items, total, pageSize } = await listSpecialistsForAdminForRoute(actor, { page });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Especialistas
        </Heading>
        <Button href="/admin/especialistas/novo" size="sm">
          Novo especialista
        </Button>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Perfis de quem atua na DM e de convidados que assinam artigos.
      </Text>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhum especialista ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((specialist) => (
            <li
              key={specialist.id}
              className="flex flex-wrap items-center justify-between gap-sm py-sm"
            >
              <div>
                <Link
                  href={`/admin/especialistas/${specialist.id}`}
                  className="font-sans font-semibold text-link underline-offset-4 hover:underline"
                >
                  {specialist.name}
                </Link>
                <p className="font-sans text-caption text-text-secondary">
                  {STATUS_LABEL[specialist.status]} · {KIND_LABEL[specialist.kind]}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Páginas de especialistas" className="mt-xl flex items-center gap-md">
          {page > 1 ? (
            <Link
              href={`/admin/especialistas?pagina=${page - 1}`}
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
              href={`/admin/especialistas?pagina=${page + 1}`}
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
