import { describe, expect, it } from "vitest";
import {
  ALLOWED_INPUT_MIME_TYPES,
  LIMITS,
  checkAltText,
  checkCaption,
  checkDetectedMime,
  checkSourceDimensions,
  checkSourceSize,
  isAllowedInputMime,
  outputDimensionsFor,
} from "./rules";

describe("isAllowedInputMime / checkDetectedMime", () => {
  it("aceita exatamente JPEG, PNG, WebP e AVIF", () => {
    expect(ALLOWED_INPUT_MIME_TYPES).toEqual([
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/avif",
    ]);
    for (const mime of ALLOWED_INPUT_MIME_TYPES) {
      expect(isAllowedInputMime(mime)).toBe(true);
      expect(checkDetectedMime(mime)).toBeNull();
    }
  });

  it("recusa SVG, GIF, PDF e tipo ausente (arquivo que o file-type não reconheceu)", () => {
    for (const mime of ["image/svg+xml", "image/gif", "application/pdf", "text/html", undefined]) {
      const result = checkDetectedMime(mime);
      expect(result?.code, String(mime)).toBe("MIME_NOT_ALLOWED");
    }
  });
});

describe("checkSourceSize", () => {
  it("aceita até 10 MB, recusa acima e recusa vazio", () => {
    expect(checkSourceSize(LIMITS.maxSourceBytes)).toBeNull();
    expect(checkSourceSize(1024)).toBeNull();
    expect(checkSourceSize(LIMITS.maxSourceBytes + 1)?.code).toBe("FILE_TOO_LARGE");
    expect(checkSourceSize(0)?.code).toBe("FILE_TOO_LARGE");
    expect(checkSourceSize(-1)?.code).toBe("FILE_TOO_LARGE");
  });
});

describe("checkSourceDimensions", () => {
  it("aceita até 6000px no maior lado, recusa acima", () => {
    expect(checkSourceDimensions(6000, 4000)).toBeNull();
    expect(checkSourceDimensions(100, 6000)).toBeNull();
    expect(checkSourceDimensions(6001, 100)?.code).toBe("DIMENSIONS_TOO_LARGE");
    expect(checkSourceDimensions(100, 6001)?.code).toBe("DIMENSIONS_TOO_LARGE");
  });

  it("recusa dimensões inválidas (zero, negativa, NaN, infinita) — proteção contra bomba de decompressão", () => {
    for (const [w, h] of [
      [0, 10],
      [10, 0],
      [-1, 10],
      [NaN, 10],
      [Infinity, 10],
    ] as const) {
      expect(checkSourceDimensions(w, h)?.code).toBe("DIMENSIONS_INVALID");
    }
  });
});

describe("checkAltText / checkCaption", () => {
  it("aceita ausente, curto e no limite; recusa acima do limite", () => {
    expect(checkAltText(undefined)).toBeNull();
    expect(checkAltText(null)).toBeNull();
    expect(checkAltText("x".repeat(LIMITS.maxAltText))).toBeNull();
    expect(checkAltText("x".repeat(LIMITS.maxAltText + 1))?.code).toBe("ALT_TEXT_TOO_LONG");

    expect(checkCaption(undefined)).toBeNull();
    expect(checkCaption("x".repeat(LIMITS.maxCaption))).toBeNull();
    expect(checkCaption("x".repeat(LIMITS.maxCaption + 1))?.code).toBe("CAPTION_TOO_LONG");
  });
});

describe("outputDimensionsFor", () => {
  it("não amplia imagem menor que o limite", () => {
    expect(outputDimensionsFor(800, 600)).toEqual({ width: 800, height: 600 });
    expect(outputDimensionsFor(2400, 2400)).toEqual({ width: 2400, height: 2400 });
  });

  it("reduz preservando a proporção quando o maior lado excede o limite", () => {
    expect(outputDimensionsFor(4800, 2400)).toEqual({ width: 2400, height: 1200 });
    expect(outputDimensionsFor(2400, 4800)).toEqual({ width: 1200, height: 2400 });
    expect(outputDimensionsFor(6000, 6000)).toEqual({ width: 2400, height: 2400 });
  });

  it("nunca produz dimensão zero mesmo com proporção extrema", () => {
    const { width, height } = outputDimensionsFor(6000, 10);
    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });
});
