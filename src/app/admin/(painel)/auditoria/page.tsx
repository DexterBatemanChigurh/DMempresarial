import type { Metadata } from "next";
import Link from "next/link";
import { Heading, Text } from "@/components/ui";
import {
  getAuditEntityTypesForRoute,
  getAuditLogForRoute,
} from "@/features/audit/application/audit-query";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Auditoria" };

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}
function parseFilter(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v !== "" ? v : undefined;
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; entidade?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const params = await searchParams;
  const page = parsePage(params.pagina);
  const entityType = parseFilter(params.entidade);

  const [{ items, total, pageSize }, entityTypes] = await Promise.all([
    getAuditLogForRoute(actor, { entityType }, { page }),
    getAuditEntityTypesForRoute(actor),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Heading as="h1" variant="h1">
        Auditoria
      </Heading>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Trilha de ações administrativas. Sem dado pessoal: só ator, ação e entidade.
      </Text>

      <nav aria-label="Filtrar por entidade" className="mb-lg flex flex-wrap gap-sm">
        <Link
          href="/admin/auditoria"
          className={
            entityType === undefined
              ? "font-semibold underline underline-offset-4"
              : "text-link underline underline-offset-4"
          }
        >
          Todas
        </Link>
        {entityTypes.map((type) => (
          <Link
            key={type}
            href={`/admin/auditoria?entidade=${encodeURIComponent(type)}`}
            className={
              entityType === type
                ? "font-semibold underline underline-offset-4"
                : "text-link underline underline-offset-4"
            }
          >
            {type}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhum registro ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((entry) => (
            <li key={entry.id} className="py-sm">
              <p className="font-sans text-caption text-text-secondary">
                {entry.at.toLocaleString("pt-BR")}
              </p>
              <p className="font-sans">
                <strong>{entry.actorName ?? "sistema"}</strong> · {entry.action} ·{" "}
                {entry.entityType}
                {entry.entityId ? ` (${entry.entityId})` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Páginas de auditoria" className="mt-xl flex items-center gap-md">
          {page > 1 ? (
            <Link
              href={`/admin/auditoria?pagina=${page - 1}${entityType ? `&entidade=${encodeURIComponent(entityType)}` : ""}`}
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
              href={`/admin/auditoria?pagina=${page + 1}${entityType ? `&entidade=${encodeURIComponent(entityType)}` : ""}`}
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
