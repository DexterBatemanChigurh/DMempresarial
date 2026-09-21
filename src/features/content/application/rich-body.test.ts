import { describe, expect, it } from "vitest";
import { AppError } from "@/lib/errors";
import { prepareRichBody } from "./rich-body";

const t = (text: string) => ({ type: "text", text });
const doc = (...content: unknown[]) => ({ type: "doc", content });
const p = (text: string) => ({ type: "paragraph", content: [t(text)] });

describe("prepareRichBody", () => {
  it("devolve o documento normalizado, o texto plano e o tempo de leitura", () => {
    const result = prepareRichBody(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [t("Título")] },
        p("a ".repeat(450).trim()),
      ),
    );
    expect(result.doc.content).toHaveLength(2);
    expect(result.text.startsWith("Título a a")).toBe(true);
    expect(result.readingMinutes).toBe(3);
  });

  it("corpo vazio é válido e tem tempo de leitura 0 (a regra de publicação é que exige texto)", () => {
    expect(prepareRichBody(doc())).toMatchObject({ text: "", readingMinutes: 0 });
  });

  it("recusa com VALIDATION e devolve os motivos no campo certo, sem eco do conteúdo hostil", () => {
    try {
      prepareRichBody(doc({ type: "script", content: [t("<img onerror=alert(1)>")] }), "bio");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(AppError);
      const app = error as AppError;
      expect(app.code).toBe("VALIDATION");
      expect(app.fieldErrors?.bio?.length).toBeGreaterThan(0);
      expect(JSON.stringify(app.fieldErrors)).not.toContain("onerror");
    }
  });

  it("o texto derivado não carrega marcação: HTML digitado permanece texto", () => {
    expect(prepareRichBody(doc(p("<b>oi</b>"))).text).toBe("<b>oi</b>");
  });
});
