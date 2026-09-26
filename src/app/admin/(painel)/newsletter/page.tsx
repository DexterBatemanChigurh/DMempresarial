import type { Metadata } from "next";
import { FormMessage, Heading, Text } from "@/components/ui";
import { FilterNav, Pagination, parsePageParam } from "@/components/admin/list-nav";
import { SUBSCRIBER_STATUS_LABEL } from "@/components/admin/leads/labels";
import { SubscriberEraseButton } from "@/components/admin/leads/subscriber-erase-button";
import {
  listSubscribersForAdminForRoute,
  parseSubscriberStatus,
} from "@/features/conversion/application/conversion-admin";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Newsletter" };

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function NewsletterAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const params = await searchParams;
  const status = parseSubscriberStatus(params.estado);
  const page = parsePageParam(params.pagina);

  let data;
  try {
    data = await listSubscribersForAdminForRoute(actor, { status }, { page });
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Newsletter
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
  const canErase = can(actor, "subscriber:erase");

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Newsletter
        </Heading>
        {/* <a> de propósito: <Link> faria prefetch da rota e dispararia uma exportação (e um
            registro de auditoria) sem ninguém clicar. */}
        <a
          download
          href="/admin/newsletter/exportar"
          className="font-sans text-sm font-semibold text-link underline underline-offset-4"
        >
          Exportar ativos (CSV)
        </a>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Inscrições pelo blog, com duplo aceite: só quem confirmou pelo e-mail fica ativo e pode
        receber envios. A exportação traz apenas os ativos.
      </Text>

      <FilterNav
        label="Filtrar por estado"
        basePath="/admin/newsletter"
        param="estado"
        current={status}
        options={[
          { value: undefined, label: "Todos", count: all },
          ...(Object.keys(SUBSCRIBER_STATUS_LABEL) as (keyof typeof SUBSCRIBER_STATUS_LABEL)[]).map(
            (s) => ({ value: s, label: SUBSCRIBER_STATUS_LABEL[s], count: data.counts[s] }),
          ),
        ]}
      />

      {items.length === 0 ? (
        <Text tone="secondary">Nenhuma inscrição {status ? "neste estado" : "ainda"}.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-sm py-sm">
              <div>
                <p className="font-sans font-semibold">{s.email}</p>
                <p className="font-sans text-caption text-text-secondary">
                  {s.name ? `${s.name} · ` : ""}
                  {SUBSCRIBER_STATUS_LABEL[s.status]} · inscrito em {date.format(s.createdAt)}
                  {s.source ? ` · pelo ${s.source}` : ""}
                </p>
              </div>
              {canErase ? <SubscriberEraseButton id={s.id} /> : null}
            </li>
          ))}
        </ul>
      )}

      <Pagination
        label="Páginas de inscrições"
        page={page}
        totalPages={totalPages}
        hrefFor={(p) =>
          `/admin/newsletter?${new URLSearchParams({ ...(status ? { estado: status } : {}), pagina: String(p) })}`
        }
      />
    </>
  );
}
