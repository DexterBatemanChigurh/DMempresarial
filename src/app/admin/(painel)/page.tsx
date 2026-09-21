import type { Metadata } from "next";
import { Heading, Text } from "@/components/ui";
import { getPostCounts } from "@/features/content/application/dashboard";
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
  const counts = await getPostCounts(actor);

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
    </>
  );
}
