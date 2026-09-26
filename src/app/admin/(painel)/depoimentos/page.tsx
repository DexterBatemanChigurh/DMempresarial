import type { Metadata } from "next";
import Link from "next/link";
import { Button, FormMessage, Heading, Text } from "@/components/ui";
import { listTestimonialsForRoute } from "@/features/proof/application/testimonial-crud";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Depoimentos" };

const STATUS_LABEL = { DRAFT: "Rascunho", PUBLISHED: "Publicado", ARCHIVED: "Oculto" } as const;
const SOURCE_LABEL = { GOOGLE: "Google", MANUAL: "Enviado à DM" } as const;

export default async function TestimonialsAdminPage() {
  const { actor } = await requireAdminSession();
  let items;
  try {
    items = await listTestimonialsForRoute(actor);
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Depoimentos
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Depoimentos
        </Heading>
        <Button href="/admin/depoimentos/novo" size="sm">
          Novo depoimento
        </Button>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Prova social real. Os publicados aparecem na Home (os 3 primeiros) e em /depoimentos, na
        ordem abaixo.
      </Text>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhum depoimento ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((t) => (
            <li key={t.id} className="py-sm">
              <Link
                href={`/admin/depoimentos/${t.id}`}
                className="font-sans font-semibold text-link underline-offset-4 hover:underline"
              >
                {t.authorName}
              </Link>
              <p className="font-sans text-caption text-text-secondary">
                {STATUS_LABEL[t.status]} · {SOURCE_LABEL[t.source]} · ordem {t.position}
                {t.rating ? ` · nota ${t.rating}` : ""}
              </p>
              <p className="mt-2xs line-clamp-2 max-w-reading font-sans text-body-sm text-text-secondary">
                {t.quote}
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
