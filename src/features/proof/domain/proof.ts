/**
 * Regras puras de depoimentos (prova social, docs/01 §20: "nunca inventar prova social"). Só
 * depoimento real, com a origem registrada; nenhum campo de resultado ou número.
 */

export const TESTIMONIAL_SOURCES = ["GOOGLE", "MANUAL"] as const;
export type TestimonialSource = (typeof TESTIMONIAL_SOURCES)[number];

export const TESTIMONIAL_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type TestimonialStatus = (typeof TESTIMONIAL_STATUSES)[number];

const TRANSITIONS: Readonly<Record<TestimonialStatus, readonly TestimonialStatus[]>> = {
  DRAFT: ["PUBLISHED"],
  PUBLISHED: ["ARCHIVED"],
  ARCHIVED: ["DRAFT", "PUBLISHED"],
};

export function canTransitionTestimonial(from: TestimonialStatus, to: TestimonialStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function testimonialTransitionsFrom(from: TestimonialStatus): readonly TestimonialStatus[] {
  return TRANSITIONS[from];
}

export const TESTIMONIAL_LIMITS = { authorName: 120, authorDetail: 120, quote: 2000 } as const;

export type TestimonialInput = {
  authorName: string;
  authorDetail: string | null;
  quote: string;
  rating: number | null;
  source: TestimonialSource;
  /** `aaaa-mm-dd` ou nulo. */
  givenAt: string | null;
  position: number;
};

export type TestimonialFieldErrors = Partial<Record<keyof TestimonialInput, string[]>>;

/** Valida e normaliza. Devolve os erros por campo (vazio = válido). */
export function validateTestimonial(input: TestimonialInput): {
  value: TestimonialInput;
  errors: TestimonialFieldErrors;
} {
  const errors: TestimonialFieldErrors = {};
  const value: TestimonialInput = {
    authorName: input.authorName.trim(),
    authorDetail: input.authorDetail?.trim() || null,
    quote: input.quote.trim(),
    rating: input.rating,
    source: input.source,
    givenAt: input.givenAt?.trim() || null,
    position: input.position,
  };

  if (value.authorName === "") errors.authorName = ["Informe quem deu o depoimento."];
  else if (value.authorName.length > TESTIMONIAL_LIMITS.authorName)
    errors.authorName = [`No máximo ${TESTIMONIAL_LIMITS.authorName} caracteres.`];
  if ((value.authorDetail?.length ?? 0) > TESTIMONIAL_LIMITS.authorDetail)
    errors.authorDetail = [`No máximo ${TESTIMONIAL_LIMITS.authorDetail} caracteres.`];
  if (value.quote === "") errors.quote = ["Escreva o depoimento."];
  else if (value.quote.length > TESTIMONIAL_LIMITS.quote)
    errors.quote = [`No máximo ${TESTIMONIAL_LIMITS.quote} caracteres.`];
  if (
    value.rating !== null &&
    !(Number.isInteger(value.rating) && value.rating >= 1 && value.rating <= 5)
  )
    errors.rating = ["A nota vai de 1 a 5."];
  if (!(TESTIMONIAL_SOURCES as readonly string[]).includes(value.source))
    errors.source = ["Origem inválida."];
  if (value.givenAt !== null) {
    const valid =
      /^\d{4}-\d{2}-\d{2}$/.test(value.givenAt) && !Number.isNaN(Date.parse(value.givenAt));
    if (!valid) errors.givenAt = ["Use uma data válida."];
  }
  if (!Number.isInteger(value.position) || value.position < 0 || value.position > 10_000)
    errors.position = ["Use um número inteiro de 0 a 10000."];

  return { value, errors };
}
