import "server-only";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";
import { fileTypeFromBuffer } from "file-type";
import sharp from "sharp";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import type { StoragePort } from "@/server/storage/port";
import {
  OUTPUT_MIME,
  checkAltText,
  checkCaption,
  checkDetectedMime,
  checkSourceDimensions,
  checkSourceSize,
  outputDimensionsFor,
} from "../domain/rules";
import { insertMedia, type MediaRow } from "../infrastructure/media-repository";

/**
 * Pipeline de upload de imagem (docs/03, parte 21). Cada verificação usa o CONTEÚDO real, nunca
 * o nome do arquivo nem o `Content-Type` informado pelo navegador:
 *
 *   assertCan → tamanho → tipo pelos bytes (file-type) → dimensões de origem → reprocessar com
 *   sharp (aplica orientação EXIF, redimensiona, reencoda para WebP — o que também apaga
 *   metadados e neutraliza arquivos "poliglotas") → sha256 do resultado final → grava no
 *   storage → grava a linha em `media` numa transação com a auditoria.
 *
 * Se a gravação no banco falhar depois do storage, o arquivo é removido (não fica órfão).
 */
type Deps = { db: Database; storage: StoragePort };

export type UploadMediaInput = {
  actor: Actor | null | undefined;
  bytes: Buffer;
  altText?: string | null;
  caption?: string | null;
  now?: Date;
  requestId?: string;
};

function firstError<T>(...errors: (T | null)[]): T | null {
  return errors.find((e) => e !== null) ?? null;
}

function keyFor(now: Date): string {
  const yyyy = String(now.getUTCFullYear()).padStart(4, "0");
  const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${yyyy}/${mm}/${randomUUID()}.webp`;
}

export async function uploadMedia(
  { db, storage }: Deps,
  input: UploadMediaInput,
): Promise<MediaRow> {
  const { actor } = input;
  assertCan(actor, "media:upload");
  const now = input.now ?? new Date();

  const sizeError = checkSourceSize(input.bytes.byteLength);
  if (sizeError)
    throw new AppError("VALIDATION", sizeError.message, {
      fieldErrors: { file: [sizeError.message] },
    });

  // Detecção pelo CONTEÚDO: nem a extensão do arquivo nem o Content-Type do navegador chegam até aqui.
  const detected = await fileTypeFromBuffer(input.bytes);
  const mimeError = checkDetectedMime(detected?.mime);
  if (mimeError)
    throw new AppError("VALIDATION", mimeError.message, {
      fieldErrors: { file: [mimeError.message] },
    });

  const altError = checkAltText(input.altText);
  const captionError = checkCaption(input.caption);
  const fieldError = firstError(altError, captionError);
  if (fieldError) {
    throw new AppError("VALIDATION", fieldError.message, {
      fieldErrors: { [fieldError === altError ? "altText" : "caption"]: [fieldError.message] },
    });
  }

  // limitInputPixels: teto de decodificação bem acima do nosso próprio limite de dimensão (defesa
  // extra caso o cabeçalho do arquivo minta sobre o tamanho declarado).
  const source = sharp(input.bytes, { limitInputPixels: 40_000_000, failOn: "error" });
  const metadata = await source.metadata().catch(() => null);
  const dimensionError = checkSourceDimensions(metadata?.width ?? 0, metadata?.height ?? 0);
  if (dimensionError) {
    throw new AppError("VALIDATION", dimensionError.message, {
      fieldErrors: { file: [dimensionError.message] },
    });
  }

  const target = outputDimensionsFor(metadata!.width!, metadata!.height!);
  const { data: processed, info } = await source
    // `.rotate()` sem argumento aplica a orientação do EXIF e depois descarta os metadados: o
    // resultado final não carrega EXIF (nem qualquer outro bloco de metadados do arquivo original).
    .rotate()
    .resize(target.width, target.height, { fit: "fill" })
    .webp({ quality: 82 })
    .toBuffer({ resolveWithObject: true });

  const sha256 = createHash("sha256").update(processed).digest("hex");
  const key = keyFor(now);

  await storage.put(key, processed, OUTPUT_MIME);
  try {
    return await db.transaction(async (tx) => {
      const row = await insertMedia(tx, {
        storageKey: key,
        mime: OUTPUT_MIME,
        bytes: processed.byteLength,
        width: info.width,
        height: info.height,
        sha256,
        altText: input.altText?.trim() || null,
        caption: input.caption?.trim() || null,
        uploadedBy: actor.id,
      });
      await recordAudit(tx, {
        actorId: actor.id,
        action: "media.upload",
        entityType: "media",
        entityId: row.id,
        metadata: { bytes: row.bytes, width: row.width, height: row.height },
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    // A gravação no banco falhou: o arquivo não pode ficar órfão no storage.
    await storage.remove(key).catch(() => undefined);
    throw error;
  }
}

// -----------------------------------------------------------------------------------------------
// Wrapper para uso em Server Actions: `src/app/**` não importa `@/db` nem `@/server/storage`
// diretamente (fronteira de camada imposta por ESLint). A Server Action chama só isto.
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";
import { getStorage } from "@/server/storage";

export function uploadMediaForRoute(input: UploadMediaInput): Promise<MediaRow> {
  return uploadMedia({ db: getDb(), storage: getStorage() }, input);
}
