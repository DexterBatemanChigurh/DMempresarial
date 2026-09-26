import { describe, expect, it } from "vitest";
import { canTransitionTestimonial, validateTestimonial, type TestimonialInput } from "./proof";

const base: TestimonialInput = {
  authorName: "  Maria  ",
  authorDetail: "  ",
  quote: " Ótimo trabalho. ",
  rating: 5,
  source: "GOOGLE",
  givenAt: "2026-07-01",
  position: 0,
};

describe("validateTestimonial", () => {
  it("normaliza espaços e trata texto vazio opcional como nulo", () => {
    const { value, errors } = validateTestimonial(base);
    expect(errors).toEqual({});
    expect(value).toMatchObject({
      authorName: "Maria",
      authorDetail: null,
      quote: "Ótimo trabalho.",
    });
  });

  it("exige autor e texto", () => {
    const { errors } = validateTestimonial({ ...base, authorName: " ", quote: "" });
    expect(Object.keys(errors).sort()).toEqual(["authorName", "quote"]);
  });

  it("nota só de 1 a 5, inteira, ou ausente", () => {
    for (const rating of [0, 6, 4.5]) {
      expect(validateTestimonial({ ...base, rating }).errors.rating).toBeDefined();
    }
    expect(validateTestimonial({ ...base, rating: null }).errors).toEqual({});
  });

  it("recusa data malformada, origem desconhecida, posição negativa e texto longo demais", () => {
    const { errors } = validateTestimonial({
      ...base,
      givenAt: "01/07/2026",
      source: "INSTAGRAM" as TestimonialInput["source"],
      position: -1,
      quote: "x".repeat(2001),
    });
    expect(Object.keys(errors).sort()).toEqual(["givenAt", "position", "quote", "source"]);
  });
});

describe("canTransitionTestimonial", () => {
  it("rascunho publica; publicado arquiva; arquivado volta a rascunho ou é republicado", () => {
    expect(canTransitionTestimonial("DRAFT", "PUBLISHED")).toBe(true);
    expect(canTransitionTestimonial("PUBLISHED", "ARCHIVED")).toBe(true);
    expect(canTransitionTestimonial("ARCHIVED", "PUBLISHED")).toBe(true);
    expect(canTransitionTestimonial("ARCHIVED", "DRAFT")).toBe(true);
    expect(canTransitionTestimonial("DRAFT", "ARCHIVED")).toBe(false);
    expect(canTransitionTestimonial("PUBLISHED", "DRAFT")).toBe(false);
  });
});
