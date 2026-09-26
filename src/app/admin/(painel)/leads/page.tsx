import type { Metadata } from "next";
import Link from "next/link";
import { FormMessage, Heading, Text } from "@/components/ui";
import { FilterNav, Pagination, parsePageParam } from "@/components/admin/list-nav";
import { LEAD_STATUS_LABEL } from "@/components/admin/leads/labels";
import {
  listLeadsForAdminForRoute,
  parseLeadStatus,
} from "@/features/conversion/application/conversion-admin";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Leads" };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const params = await searchParams;
  const status = parseLeadStatus(params.estado);
  const page = parsePageParam(params.pagina);

  let data;
  try {
    data = await listLeadsForAdminForRoute(actor, { status }, { page });
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Leads
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  const { items, total, pageSize } = data.page;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const all = Object.values(data.counts).reduce((a, b) => a + b, 0);
  const query = (p: number) =>
    `/admin/leads?${new URLSearchParams({ ...(status ? { estado: status } : {}), pagina: String(p) })}`;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Leads
        </Heading>
        {/* <a> de propósito: <Link> faria prefetch da rota e dispararia uma exportação (e um
            registro de auditoria) sem ninguém clicar. */}
        <a
          download
          href={`/admin/leads/exportar${status ? `?estado=${status}` : ""}`}
          className="font-sans text-sm font-semibold text-link underline underline-offset-4"
        >
          Exportar CSV{status ? ` (${LEAD_STATUS_LABEL[status].toLowerCase()})` : ""}
        </a>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Contatos recebidos pelo site. Dados pessoais: só administradores veem, e toda exportação ou
        exclusão fica registrada na auditoria.
      </Text>

      <FilterNav
        label="Filtrar por estado"
        basePath="/admin/leads"
        param="estado"
        current={status}
        options={[
          { value: undefined, label: "Todos", count: all },
          ...(Object.keys(LEAD_STATUS_LABEL) as (keyof typeof LEAD_STATUS_LABEL)[]).map((s) => ({
            value: s,
            label: LEAD_STATUS_LABEL[s],
            count: data.counts[s],
          })),
        ]}
      />

      {items.length === 0 ? (
        <Text tone="secondary">Nenhum lead {status ? "neste estado" : "ainda"}.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((lead) => (
            <li
              key={lead.id}
              className="flex flex-wrap items-baseline justify-between gap-sm py-sm"
            >
              <div>
                <Link
                  href={`/admin/leads/${lead.id}`}
                  className="font-sans font-semibold text-link underline-offset-4 hover:underline"
                >
                  {lead.name}
                </Link>
                <p className="font-sans text-caption text-text-secondary">
                  {lead.email}
                  {lead.company ? ` · ${lead.company}` : ""}
                </p>
              </div>
              <p className="font-sans text-caption text-text-secondary">
                {LEAD_STATUS_LABEL[lead.status]} · {dateTime.format(lead.createdAt)}
              </p>
            </li>
          ))}
        </ul>
      )}

      <Pagination label="Páginas de leads" page={page} totalPages={totalPages} hrefFor={query} />
    </>
  );
}
