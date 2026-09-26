import type { Metadata } from "next";
import { FormMessage, Heading, Text } from "@/components/ui";
import { DeleteRedirectButton, NewRedirectForm } from "@/components/admin/redirects/redirect-forms";
import { listRedirectsForRoute } from "@/features/platform/application/redirect-admin";
import { AppError } from "@/lib/errors";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Redirecionamentos" };

const date = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export default async function RedirectsPage() {
  const { actor } = await requireAdminSession();
  let rows;
  try {
    rows = await listRedirectsForRoute(actor);
  } catch (error) {
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Redirecionamentos
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
      <Heading as="h1" variant="h1">
        Redirecionamentos
      </Heading>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Endereços antigos que levam a um novo (301 permanente), para links e buscadores não caírem
        em página inexistente. Os automáticos surgem quando o endereço de um artigo publicado muda.
        Um redirecionamento vale mesmo que o endereço antigo ainda exista.
      </Text>

      <div className="mb-2xl max-w-reading">
        <NewRedirectForm />
      </div>

      {rows.length === 0 ? (
        <Text tone="secondary">Nenhum redirecionamento ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-sm py-sm">
              <div>
                <p className="font-sans font-semibold break-all">
                  {r.fromPath} → {r.toPath}
                </p>
                <p className="font-sans text-caption text-text-secondary">
                  {r.origin === "AUTO" ? "Automático" : "Manual"} · {r.statusCode} ·{" "}
                  {date.format(r.createdAt)}
                  {r.createdByName ? ` · ${r.createdByName}` : ""}
                </p>
              </div>
              <DeleteRedirectButton id={r.id} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
