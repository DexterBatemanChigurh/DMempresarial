import { describe, expect, it } from "vitest";
import { extractMediaIds } from "./media-refs";

const M1 = "0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c";
const M2 = "1a2b3c4d-5e6f-4a1b-8c2d-3e4f5a6b7c8d";
const t = (text: string) => ({ type: "text", text });
const p = (...content: unknown[]) => ({ type: "paragraph", content });
import type { RichDoc } from "./schema";

const doc = (...content: unknown[]) => ({ type: "doc", content }) as unknown as RichDoc;
const image = (id: string) => ({ type: "image", attrs: { mediaId: id } });

describe("extractMediaIds", () => {
  it("documento sem imagem devolve lista vazia", () => {
    expect(extractMediaIds(doc(p(t("x"))))).toEqual([]);
    expect(extractMediaIds(doc())).toEqual([]);
  });

  it("acha imagens em nível superior, dentro de citação, destaque e lista", () => {
    const value = doc(
      image(M1),
      { type: "blockquote", content: [p(t("x")), image(M2)] },
      { type: "callout", attrs: { variant: "aplicacao" }, content: [p(t("y"))] },
      {
        type: "bulletList",
        content: [{ type: "listItem", content: [p(t("z")), image(M1)] }],
      },
    );
    expect(extractMediaIds(value).sort()).toEqual([M1, M2].sort());
  });

  it("a mesma imagem repetida aparece só uma vez", () => {
    expect(extractMediaIds(doc(image(M1), p(t("x")), image(M1)))).toEqual([M1]);
  });
});
