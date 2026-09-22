import type { Metadata } from "next";
import Link from "next/link";
import { MediaItemCard, type MediaLibraryItem } from "@/components/admin/media/media-item-card";
import { MediaUploadForm } from "@/components/admin/media/media-upload-form";
import { Heading, Text } from "@/components/ui";
import { listMediaForRoute } from "@/features/media/application/manage-media";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Mídia" };

function parsePage(value: string | string[] | undefined): number {
  const n = Number(Array.isArray(value) ? value[0] : value);
  return Number.isInteger(n) && n >= 1 ? n : 1;
}

export default async function MediaLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ pagina?: string }>;
}) {
  const { actor } = await requireAdminSession();
  const page = parsePage((await searchParams).pagina);
  const { items, total, pageSize } = await listMediaForRoute(actor, page);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Heading as="h1" variant="h1">
        Mídia
      </Heading>
      <Text tone="secondary" className="mt-md mb-2xl max-w-reading">
        {actor.role === "AUTHOR"
          ? "Suas imagens enviadas. Elas ficam disponíveis para uso em artigos."
          : "Imagens da biblioteca, disponíveis para uso em artigos, soluções, especialistas e páginas."}
      </Text>

      <section aria-labelledby="enviar-imagem" className="mb-3xl">
        <Heading as="h2" variant="h3" id="enviar-imagem" className="mb-md">
          Enviar imagem
        </Heading>
        <MediaUploadForm />
      </section>

      <section id="biblioteca-secao" aria-labelledby="biblioteca">
        <Heading as="h2" variant="h3" id="biblioteca" className="mb-md">
          Biblioteca ({total})
        </Heading>
        {items.length === 0 ? (
          <Text tone="secondary">Nenhuma imagem enviada ainda.</Text>
        ) : (
          <ul className="grid grid-cols-2 gap-lg sm:grid-cols-3 lg:grid-cols-4">
            {items.map((row) => {
              const item: MediaLibraryItem = {
                id: row.id,
                url: `/media/${row.storageKey}`,
                width: row.width,
                height: row.height,
                altText: row.altText,
                caption: row.caption,
                bytes: row.bytes,
                uploadedBy: row.uploadedBy,
                createdAt: row.createdAt.toISOString(),
                focalX: row.focalX,
                focalY: row.focalY,
              };
              return (
                <MediaItemCard
                  key={row.id}
                  item={item}
                  canManage={can(actor, "media:manage", { ownerId: row.uploadedBy })}
                  canDelete={can(actor, "media:delete", { ownerId: row.uploadedBy })}
                />
              );
            })}
          </ul>
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Páginas da biblioteca de mídia"
            className="mt-xl flex items-center gap-md"
          >
            {page > 1 ? (
              <Link
                href={`/admin/midia?pagina=${page - 1}`}
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
                href={`/admin/midia?pagina=${page + 1}`}
                className="text-link underline underline-offset-4"
              >
                Próxima
              </Link>
            ) : null}
          </nav>
        ) : null}
      </section>
    </>
  );
}
