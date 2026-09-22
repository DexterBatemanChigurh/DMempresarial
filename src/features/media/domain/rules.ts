/**
 * Regras puras de mídia (docs/03, parte 21). Sem I/O: recebe já os fatos apurados (tipo real do
 * conteúdo, dimensões) e decide se o upload é aceitável. A detecção do tipo por conteúdo e o
 * reprocessamento ficam na camada de aplicação, que tem acesso a `sharp`/`file-type`.
 */

/** Tipos aceitos NA ENTRADA (o que o usuário pode enviar). Nunca SVG: é vetor de XSS. */
export const ALLOWED_INPUT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
export type AllowedInputMime = (typeof ALLOWED_INPUT_MIME_TYPES)[number];

/** Tudo o que é gravado sai reencodado para isto (docs/03: "sharp sempre reencoda para webp"). */
export const OUTPUT_MIME = "image/webp" as const;

export const LIMITS = {
  /** Tamanho máximo do arquivo ORIGINAL enviado. */
  maxSourceBytes: 10 * 1024 * 1024,
  /** Maior lado da imagem de ORIGEM: acima disso, recusa antes de processar (decompression bomb). */
  maxSourceDimension: 6000,
  /** Maior lado do resultado gravado. */
  maxOutputDimension: 2400,
  maxAltText: 300,
  maxCaption: 300,
} as const;

export type MediaUploadErrorCode =
  | "FILE_TOO_LARGE"
  | "MIME_NOT_ALLOWED"
  | "DIMENSIONS_TOO_LARGE"
  | "DIMENSIONS_INVALID"
  | "ALT_TEXT_TOO_LONG"
  | "CAPTION_TOO_LONG";

export type MediaUploadError = { code: MediaUploadErrorCode; message: string };

export function isAllowedInputMime(mime: string): mime is AllowedInputMime {
  return (ALLOWED_INPUT_MIME_TYPES as readonly string[]).includes(mime);
}

/** Verifica o TAMANHO do arquivo original, antes de gastar CPU detectando tipo ou decodificando. */
export function checkSourceSize(bytes: number): MediaUploadError | null {
  if (bytes <= 0) return { code: "FILE_TOO_LARGE", message: "Arquivo vazio." };
  if (bytes > LIMITS.maxSourceBytes) {
    return { code: "FILE_TOO_LARGE", message: "Arquivo maior que 10 MB." };
  }
  return null;
}

/** Verifica o MIME real (detectado pelo conteúdo, nunca pela extensão nem pelo cabeçalho enviado). */
export function checkDetectedMime(mime: string | undefined): MediaUploadError | null {
  if (!mime || !isAllowedInputMime(mime)) {
    return {
      code: "MIME_NOT_ALLOWED",
      message: "Formato não permitido. Envie JPEG, PNG, WebP ou AVIF.",
    };
  }
  return null;
}

/** Verifica as dimensões da imagem de ORIGEM (antes do reprocessamento). */
export function checkSourceDimensions(width: number, height: number): MediaUploadError | null {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { code: "DIMENSIONS_INVALID", message: "Não foi possível ler as dimensões da imagem." };
  }
  if (width > LIMITS.maxSourceDimension || height > LIMITS.maxSourceDimension) {
    return {
      code: "DIMENSIONS_TOO_LARGE",
      message: `Imagem maior que o permitido (máximo ${LIMITS.maxSourceDimension}px no maior lado).`,
    };
  }
  return null;
}

export function checkAltText(altText: string | null | undefined): MediaUploadError | null {
  if (altText && altText.length > LIMITS.maxAltText) {
    return { code: "ALT_TEXT_TOO_LONG", message: "Texto alternativo longo demais." };
  }
  return null;
}

export function checkCaption(caption: string | null | undefined): MediaUploadError | null {
  if (caption && caption.length > LIMITS.maxCaption) {
    return { code: "CAPTION_TOO_LONG", message: "Legenda longa demais." };
  }
  return null;
}

/** Redimensiona (sem ampliar) para caber em `maxOutputDimension` no maior lado, preservando a proporção. */
export function outputDimensionsFor(
  width: number,
  height: number,
): { width: number; height: number } {
  const max = LIMITS.maxOutputDimension;
  if (width <= max && height <= max) return { width, height };
  const scale = width >= height ? max / width : max / height;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
