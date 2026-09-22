import type { Metadata } from "next";
import Link from "next/link";
import { Button, Heading, Text } from "@/components/ui";
import { listPostsForAdminForRoute } from "@/features/content/application/post-crud";
import type { PostStatus } from "@/features/content/domain/post-status";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Artigos" };

const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const STATUS_FILTERS: (PostStatus | "ALL")[] = [
  "ALL",
  "DRAFT",
  "REVIEW",
  "SCHEDULED",
  "PUBLISHED",
  "ARCHIVED",
];

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

function parseStatus(value: string | string[] | undefined): PostStatus | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw && (STATUS_FILTERS as string[]).includes(raw) && raw !== "ALL"
    ? (raw as PostStatus)
    : undefined;
}

export default async function PostsListPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string; status?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const params = await searchParams;
  const page = parsePage(params.pagina);
  const status = parseStatus(params.status);
  const { items, total, pageSize } = await listPostsForAdminForRoute(actor, { page, status });
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-md">
        <Heading as="h1" variant="h1">
          Artigos
        </Heading>
        <Button href="/admin/artigos/novo" size="sm">
          Novo artigo
        </Button>
      </div>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        {actor.role === "AUTHOR" ? "Seus artigos." : "Todos os artigos."}
      </Text>

      <nav aria-label="Filtrar por status" className="mb-lg flex flex-wrap gap-sm">
        {STATUS_FILTERS.map((s) => (
          <Link
            key={s}
            href={s === "ALL" ? "/admin/artigos" : `/admin/artigos?status=${s}`}
            className={
              (s === "ALL" && !status) || s === status
                ? "border-b-2 border-text px-xs py-2xs font-sans text-sm font-semibold text-text"
                : "px-xs py-2xs font-sans text-sm text-text-secondary hover:text-text"
            }
          >
            {s === "ALL" ? "Todos" : STATUS_LABEL[s]}
          </Link>
        ))}
      </nav>

      {items.length === 0 ? (
        <Text tone="secondary">Nenhum artigo encontrado.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {items.map((post) => (
            <li key={post.id} className="flex flex-wrap items-center justify-between gap-sm py-sm">
              <div>
                <Link
                  href={`/admin/artigos/${post.id}`}
                  className="font-sans font-semibold text-link underline-offset-4 hover:underline"
                >
                  {post.title}
                </Link>
                <p className="font-sans text-caption text-text-secondary">
                  {STATUS_LABEL[post.status]} · {post.authorName}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 ? (
        <nav aria-label="Páginas de artigos" className="mt-xl flex items-center gap-md">
          {page > 1 ? (
            <Link
              href={`/admin/artigos?pagina=${page - 1}${status ? `&status=${status}` : ""}`}
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
              href={`/admin/artigos?pagina=${page + 1}${status ? `&status=${status}` : ""}`}
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
