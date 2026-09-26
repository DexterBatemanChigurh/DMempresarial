import type { Metadata } from "next";
import Link from "next/link";
import { Heading, Text } from "@/components/ui";
import { getPostCounts } from "@/features/content/application/dashboard";
import { countLeadsForDashboardForRoute } from "@/features/conversion/application/conversion-admin";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Início" };

const LABELS = [
  ["DRAFT", "Rascunhos"],
  ["REVIEW", "Em revisão"],
  ["SCHEDULED", "Agendados"],
  ["PUBLISHED", "Publicados"],
  ["ARCHIVED", "Arquivados"],
] as const;

export default async function DashboardPage() {
  // A autorização é revalidada aqui (não só no layout): cada página decide por si.
  const { actor, user } = await requireAdminSession();
  const [counts, leadCounts] = await Promise.all([
    getPostCounts(actor),
    can(actor, "lead:view") ? countLeadsForDashboardForRoute(actor) : Promise.resolve(null),
  ]);

  return (
    <>
      <Heading as="h1" variant="h1">
        Olá, {user.name}
      </Heading>
      <Text tone="secondary" className="mt-md">
        {actor.role === "AUTHOR"
          ? "Estes são os números dos seus artigos."
          : "Estes são os números de todos os artigos."}
      </Text>
      <dl className="mt-2xl grid grid-cols-2 gap-lg sm:grid-cols-3 lg:grid-cols-5">
        {LABELS.map(([status, label]) => (
          <div key={status} className="border-t border-border-strong pt-sm">
            <dt className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
              {label}
            </dt>
            <dd className="mt-xs font-serif text-display-m text-text">{counts[status]}</dd>
          </div>
        ))}
      </dl>

      {leadCounts ? (
        <section aria-labelledby="painel-leads" className="mt-3xl">
          <Heading as="h2" variant="h3" id="painel-leads">
            Contatos pelo site
          </Heading>
          <p className="mt-sm font-sans text-body text-text">
            {leadCounts.NEW === 0 ? (
              "Nenhum lead novo para responder."
            ) : (
              <Link
                href="/admin/leads?estado=NEW"
                className="text-link underline underline-offset-4"
              >
                {leadCounts.NEW === 1
                  ? "1 lead novo para responder"
                  : `${leadCounts.NEW} leads novos para responder`}
              </Link>
            )}
          </p>
        </section>
      ) : null}
    </>
  );
}
