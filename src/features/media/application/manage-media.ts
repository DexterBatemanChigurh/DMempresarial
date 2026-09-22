import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import type { StoragePort } from "@/server/storage/port";
import { checkAltText, checkCaption } from "../domain/rules";
import {
  deleteMediaRow,
  findMediaById,
  isMediaReferenced,
  listMedia,
  updateMediaMetadata,
  type MediaListPage,
  type MediaRow,
} from "../infrastructure/media-repository";

type Deps = { db: Database; storage: StoragePort };

/** Só ADMIN e EDITOR veem toda a biblioteca; AUTHOR só a própria mídia. */
export async function listMediaFor(
  db: Database,
  actor: Actor | null | undefined,
  page: number,
): Promise<MediaListPage> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const ownerId = actor.role === "AUTHOR" ? actor.id : undefined;
  return listMedia(db, { page, ownerId });
}

export type UpdateMediaInput = {
  actor: Actor | null | undefined;
  id: string;
  altText?: string | null;
  caption?: string | null;
  focalX?: number;
  focalY?: number;
  requestId?: string;
};

export async function updateMedia(
  { db }: Pick<Deps, "db">,
  input: UpdateMediaInput,
): Promise<MediaRow> {
  const { actor, id } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");

  const existing = await findMediaById(db, id);
  if (!existing) throw new AppError("NOT_FOUND", "Mídia inexistente.");

  const hideExistence = actor.role === "AUTHOR" && existing.uploadedBy !== actor.id;
  assertCan(actor, "media:manage", { ownerId: existing.uploadedBy }, { hideExistence });

  if (input.altText !== undefined) {
    const error = checkAltText(input.altText);
    if (error)
      throw new AppError("VALIDATION", error.message, {
        fieldErrors: { altText: [error.message] },
      });
  }
  if (input.caption !== undefined) {
    const error = checkCaption(input.caption);
    if (error)
      throw new AppError("VALIDATION", error.message, {
        fieldErrors: { caption: [error.message] },
      });
  }
  if (input.focalX !== undefined && (input.focalX < 0 || input.focalX > 1)) {
    throw new AppError("VALIDATION", "Ponto focal inválido.", {
      fieldErrors: { focalX: ["Deve estar entre 0 e 1."] },
    });
  }
  if (input.focalY !== undefined && (input.focalY < 0 || input.focalY > 1)) {
    throw new AppError("VALIDATION", "Ponto focal inválido.", {
      fieldErrors: { focalY: ["Deve estar entre 0 e 1."] },
    });
  }

  return db.transaction(async (tx) => {
    const values: Parameters<typeof updateMediaMetadata>[2] = {};
    if (input.altText !== undefined) values.altText = input.altText?.trim() || null;
    if (input.caption !== undefined) values.caption = input.caption?.trim() || null;
    if (input.focalX !== undefined) values.focalX = input.focalX;
    if (input.focalY !== undefined) values.focalY = input.focalY;

    const row = await updateMediaMetadata(tx, id, values);
    if (!row) throw new AppError("NOT_FOUND", "Mídia inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "media.update",
      entityType: "media",
      entityId: id,
      metadata: { fields: Object.keys(values) },
      requestId: input.requestId,
    });
    return row;
  });
}

export type DeleteMediaInput = { actor: Actor | null | undefined; id: string; requestId?: string };

/** Recusa apagar mídia referenciada em conteúdo (evita imagem quebrada em artigo/solução/página). */
export async function deleteMedia({ db, storage }: Deps, input: DeleteMediaInput): Promise<void> {
  const { actor, id } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");

  const existing = await findMediaById(db, id);
  if (!existing) throw new AppError("NOT_FOUND", "Mídia inexistente.");

  const hideExistence = actor.role === "AUTHOR" && existing.uploadedBy !== actor.id;
  assertCan(actor, "media:delete", { ownerId: existing.uploadedBy }, { hideExistence });

  if (await isMediaReferenced(db, id)) {
    throw new AppError("DOMAIN_RULE", "Esta mídia está em uso e não pode ser excluída.");
  }

  await db.transaction(async (tx) => {
    // Confere de novo DENTRO da transação: fecha a janela entre a checagem acima e a exclusão
    // (alguém poderia ter referenciado a mídia entre as duas chamadas).
    if (await isMediaReferenced(tx, id)) {
      throw new AppError("DOMAIN_RULE", "Esta mídia está em uso e não pode ser excluída.");
    }
    await deleteMediaRow(tx, id);
    await recordAudit(tx, {
      actorId: actor.id,
      action: "media.delete",
      entityType: "media",
      entityId: id,
      requestId: input.requestId,
    });
  });

  // Fora da transação: se a remoção do arquivo falhar, a linha já não existe mais no banco (o
  // que importa para a integridade); o arquivo órfão é um problema menor, tratado por um job depois.
  await storage.remove(existing.storageKey).catch(() => undefined);
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (ver nota em upload-media.ts).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { getStorage } from "@/server/storage";

export function listMediaForRoute(
  actor: Actor | null | undefined,
  page: number,
): Promise<MediaListPage> {
  return listMediaFor(getDb(), actor, page);
}

export function updateMediaForRoute(input: UpdateMediaInput): Promise<MediaRow> {
  return updateMedia({ db: getDb() }, input);
}

export function deleteMediaForRoute(input: DeleteMediaInput): Promise<void> {
  return deleteMedia({ db: getDb(), storage: getStorage() }, input);
}
