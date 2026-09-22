import { z } from "zod";

/**
 * Páginas institucionais NÃO são um page builder: o template (código) decide o layout; `data`
 * só guarda o texto daquele template, com o formato que o Zod abaixo descreve (docs/03, parte 9).
 * Campos de texto rico (Tiptap JSON) não são validados aqui — a forma exata é responsabilidade de
 * `prepareRichBody`/`validateRichText`, o único portão de gravação de texto rico do projeto; aqui
 * só se garante que a CHAVE existe e é do tipo esperado (`z.unknown()`).
 */
export const PAGE_TEMPLATES = ["HOME", "ABOUT", "CONTACT", "LEGAL"] as const;
export type PageTemplate = (typeof PAGE_TEMPLATES)[number];

export const PAGE_TEMPLATE_LABEL: Record<PageTemplate, string> = {
  HOME: "Home",
  ABOUT: "Sobre",
  CONTACT: "Contato",
  LEGAL: "Página legal",
};

const valueSchema = z.object({ name: z.string(), practice: z.string() });

export const homeDataSchema = z.object({
  headline: z.string(),
  description: z.unknown(),
  howWeThink: z.unknown(),
});
export const aboutDataSchema = z.object({
  whoWeAre: z.unknown(),
  howWeThink: z.unknown(),
  howWeWork: z.unknown(),
  values: z.array(valueSchema).max(5),
});
export const contactDataSchema = z.object({ intro: z.unknown() });
export const legalDataSchema = z.object({ body: z.unknown() });

export type HomeData = z.infer<typeof homeDataSchema>;
export type AboutData = z.infer<typeof aboutDataSchema>;
export type ContactData = z.infer<typeof contactDataSchema>;
export type LegalData = z.infer<typeof legalDataSchema>;

export function dataSchemaFor(template: PageTemplate) {
  switch (template) {
    case "HOME":
      return homeDataSchema;
    case "ABOUT":
      return aboutDataSchema;
    case "CONTACT":
      return contactDataSchema;
    case "LEGAL":
      return legalDataSchema;
  }
}

/** Quais chaves de `data`, por template, são texto rico (Tiptap JSON) — precisam passar por
 * `prepareRichBody` antes de gravar. As demais (título, `values[].name`/`practice`) são texto
 * plano comum. */
export const RICH_FIELDS: Record<PageTemplate, readonly string[]> = {
  HOME: ["description", "howWeThink"],
  ABOUT: ["whoWeAre", "howWeThink", "howWeWork"],
  CONTACT: ["intro"],
  LEGAL: ["body"],
};

/** O bloco "essencial" de cada template: sem ele, a página não publica (docs/01, seções 07/10/14;
 * docs/03, parte 9, D4 — publicar só com conteúdo real). Os demais blocos aparecem só quando
 * preenchidos ("dado ausente = seção ausente"), sem bloquear a publicação. */
export const ESSENTIAL_RICH_FIELD: Record<PageTemplate, string> = {
  HOME: "description",
  ABOUT: "whoWeAre",
  CONTACT: "intro",
  LEGAL: "body",
};
