import { isAllowedHref } from "./href";
import {
  CALLOUT_VARIANTS,
  HEADING_LEVELS,
  LIMITS,
  type Block,
  type CalloutVariant,
  type HeadingLevel,
  type Inline,
  type ListItem,
  type Mark,
  type RichDoc,
} from "./schema";

/**
 * Validador do texto rico (docs/03, parte 9): a barreira contra XSS armazenado. Recebe o JSON
 * vindo do cliente (não confiável) e devolve um documento NOVO, reconstruído só com o que a lista
 * de permissão aceita. O que não está na lista é RECUSADO com o motivo (não é "limpo" em silêncio),
 * salvo os atributos padrão que o próprio editor emite nos links (target/rel/class), que têm o
 * valor conferido e são descartados na normalização.
 */
export type ValidationErrorCode =
  | "NOT_OBJECT"
  | "BAD_ROOT"
  | "UNKNOWN_NODE"
  | "UNKNOWN_KEY"
  | "BAD_CHILD"
  | "BAD_ATTR"
  | "BAD_MARK"
  | "BAD_LINK"
  | "BAD_TEXT"
  | "LIMIT";

export type ValidationError = { path: string; code: ValidationErrorCode; message: string };
export type ValidationResult =
  { ok: true; doc: RichDoc } | { ok: false; errors: ValidationError[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EDITOR_LINK_REL = new Set(["noopener noreferrer nofollow", "noopener noreferrer"]);

const BLOCKS = new Set([
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "blockquote",
  "callout",
  "horizontalRule",
  "image",
]);
const INLINES = new Set(["text", "hardBreak"]);
const IN_CONTAINER = new Set(["paragraph", "bulletList", "orderedList"]);
const IN_LIST_ITEM_AFTER_FIRST = new Set(["paragraph", "bulletList", "orderedList"]);

type Ctx = { errors: ValidationError[]; nodes: number; totalText: number };

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
};

/** Só um trecho seguro do tipo desconhecido entra na mensagem (nunca eco de conteúdo hostil). */
const safeName = (v: unknown) =>
  typeof v === "string" ? v.replace(/[^A-Za-z0-9_-]/g, "").slice(0, 30) || "?" : "?";

function fail(ctx: Ctx, path: string, code: ValidationErrorCode, message: string): undefined {
  if (ctx.errors.length < LIMITS.maxErrors) ctx.errors.push({ path, code, message });
  return undefined;
}

const tooMany = (ctx: Ctx) => ctx.errors.length >= LIMITS.maxErrors;

/** Confere as chaves permitidas de um objeto. */
function onlyKeys(
  ctx: Ctx,
  path: string,
  obj: Record<string, unknown>,
  allowed: readonly string[],
) {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      fail(ctx, path, "UNKNOWN_KEY", `Campo não permitido: ${safeName(key)}.`);
      return false;
    }
  }
  return true;
}

/** `attrs` opcional; devolve um objeto (vazio se ausente) ou undefined em caso de erro. */
function attrsOf(ctx: Ctx, path: string, value: unknown): Record<string, unknown> | undefined {
  if (value === undefined || value === null) return {};
  if (!isPlainObject(value)) return fail(ctx, `${path}.attrs`, "BAD_ATTR", "Atributos inválidos.");
  return value;
}

function noAttrs(ctx: Ctx, path: string, value: unknown): boolean {
  const attrs = attrsOf(ctx, path, value);
  if (!attrs) return false;
  if (Object.keys(attrs).length > 0) {
    fail(ctx, `${path}.attrs`, "BAD_ATTR", "Este elemento não aceita atributos.");
    return false;
  }
  return true;
}

function parseMarks(ctx: Ctx, path: string, value: unknown): Mark[] | undefined {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) return fail(ctx, `${path}.marks`, "BAD_MARK", "Formatação inválida.");
  if (value.length > LIMITS.maxMarksPerText) {
    return fail(ctx, `${path}.marks`, "LIMIT", "Formatação em excesso no mesmo trecho.");
  }
  const seen = new Set<string>();
  const out: Mark[] = [];
  for (const [i, raw] of value.entries()) {
    const mpath = `${path}.marks[${i}]`;
    if (!isPlainObject(raw)) return fail(ctx, mpath, "BAD_MARK", "Formatação inválida.");
    if (!onlyKeys(ctx, mpath, raw, ["type", "attrs"])) return undefined;
    const type = raw.type;
    if (type !== "bold" && type !== "italic" && type !== "link") {
      return fail(ctx, mpath, "BAD_MARK", `Formatação não permitida: ${safeName(type)}.`);
    }
    if (seen.has(type)) return fail(ctx, mpath, "BAD_MARK", "Formatação repetida no mesmo trecho.");
    seen.add(type);

    if (type === "link") {
      const attrs = attrsOf(ctx, mpath, raw.attrs);
      if (!attrs) return undefined;
      if (!onlyKeys(ctx, `${mpath}.attrs`, attrs, ["href", "target", "rel", "class", "title"]))
        return undefined;
      // Atributos que o próprio editor emite no link (Tiptap 3: target, rel, class, title). Só o
      // valor PADRÃO passa (nulo, "_blank" ou o rel padrão) e é descartado na normalização: o
      // renderizador define os seus. Qualquer outro valor é recusado.
      const { target, rel, class: cls, title } = attrs;
      if (
        (target !== undefined && target !== null && target !== "_blank") ||
        (rel !== undefined &&
          rel !== null &&
          !(typeof rel === "string" && EDITOR_LINK_REL.has(rel))) ||
        (cls !== undefined && cls !== null) ||
        (title !== undefined && title !== null)
      ) {
        return fail(ctx, `${mpath}.attrs`, "BAD_LINK", "Atributos de link não permitidos.");
      }
      if (!isAllowedHref(attrs.href)) {
        return fail(ctx, `${mpath}.attrs.href`, "BAD_LINK", "Endereço de link não permitido.");
      }
      out.push({ type: "link", attrs: { href: attrs.href } });
    } else {
      if (!noAttrs(ctx, mpath, raw.attrs)) return undefined;
      out.push({ type });
    }
  }
  // Ordem estável: o JSON guardado não depende da ordem em que o editor aplicou as marcas.
  const order = { bold: 0, italic: 1, link: 2 } as const;
  return out.sort((a, b) => order[a.type] - order[b.type]);
}

function parseInline(ctx: Ctx, value: unknown, path: string): Inline | undefined {
  if (!isPlainObject(value)) return fail(ctx, path, "NOT_OBJECT", "Elemento inválido.");
  const type = value.type;
  if (type === "hardBreak") {
    if (!onlyKeys(ctx, path, value, ["type", "attrs", "marks"])) return undefined;
    return noAttrs(ctx, path, value.attrs) ? { type: "hardBreak" } : undefined;
  }
  if (type !== "text") {
    return fail(ctx, path, "BAD_CHILD", `Elemento não permitido aqui: ${safeName(type)}.`);
  }
  if (!onlyKeys(ctx, path, value, ["type", "text", "marks"])) return undefined;
  const text = value.text;
  if (typeof text !== "string" || text.length === 0) {
    return fail(ctx, path, "BAD_TEXT", "Trecho de texto vazio ou inválido.");
  }
  if (text.length > LIMITS.maxTextNode)
    return fail(ctx, path, "LIMIT", "Trecho de texto longo demais.");
  ctx.totalText += text.length;
  if (ctx.totalText > LIMITS.maxTotalText) return fail(ctx, path, "LIMIT", "Texto longo demais.");
  const marks = parseMarks(ctx, path, value.marks);
  if (!marks) return undefined;
  return marks.length > 0 ? { type: "text", text, marks } : { type: "text", text };
}

function children(
  ctx: Ctx,
  value: Record<string, unknown>,
  path: string,
  depth: number,
): unknown[] | undefined {
  const raw = value.content;
  if (raw === undefined || raw === null) return [];
  if (!Array.isArray(raw)) return fail(ctx, `${path}.content`, "BAD_CHILD", "Conteúdo inválido.");
  if (depth + 1 > LIMITS.maxDepth) return fail(ctx, path, "LIMIT", "Aninhamento profundo demais.");
  return raw;
}

function count(ctx: Ctx, path: string): boolean {
  ctx.nodes += 1;
  if (ctx.nodes > LIMITS.maxNodes) {
    fail(ctx, path, "LIMIT", "Documento grande demais.");
    return false;
  }
  return true;
}

function parseInlineContent(
  ctx: Ctx,
  value: Record<string, unknown>,
  path: string,
  depth: number,
): Inline[] | undefined {
  const raw = children(ctx, value, path, depth);
  if (!raw) return undefined;
  const out: Inline[] = [];
  for (const [i, child] of raw.entries()) {
    if (tooMany(ctx) || !count(ctx, `${path}.content[${i}]`)) return undefined;
    const parsed = parseInline(ctx, child, `${path}.content[${i}]`);
    if (!parsed) return undefined;
    out.push(parsed);
  }
  return out;
}

function parseBlock(
  ctx: Ctx,
  value: unknown,
  path: string,
  depth: number,
  allowed: ReadonlySet<string>,
): Block | ListItem | undefined {
  if (!isPlainObject(value)) return fail(ctx, path, "NOT_OBJECT", "Elemento inválido.");
  const type = value.type;
  if (typeof type !== "string") return fail(ctx, path, "UNKNOWN_NODE", "Elemento sem tipo.");
  if (!allowed.has(type)) {
    const known = BLOCKS.has(type) || INLINES.has(type) || type === "listItem";
    return fail(
      ctx,
      path,
      known ? "BAD_CHILD" : "UNKNOWN_NODE",
      `Elemento não permitido aqui: ${safeName(type)}.`,
    );
  }
  if (!onlyKeys(ctx, path, value, ["type", "attrs", "content"])) return undefined;

  switch (type) {
    case "paragraph": {
      if (!noAttrs(ctx, path, value.attrs)) return undefined;
      const content = parseInlineContent(ctx, value, path, depth);
      return content ? (content.length ? { type, content } : { type }) : undefined;
    }
    case "heading": {
      const attrs = attrsOf(ctx, path, value.attrs);
      if (!attrs || !onlyKeys(ctx, `${path}.attrs`, attrs, ["level"])) return undefined;
      const level = attrs.level;
      if (typeof level !== "number" || !(HEADING_LEVELS as readonly number[]).includes(level)) {
        return fail(ctx, `${path}.attrs.level`, "BAD_ATTR", "Título deve ser de nível 2, 3 ou 4.");
      }
      const content = parseInlineContent(ctx, value, path, depth);
      const attrsOut = { level: level as HeadingLevel };
      return content
        ? content.length
          ? { type, attrs: attrsOut, content }
          : { type, attrs: attrsOut }
        : undefined;
    }
    case "horizontalRule": {
      if (!noAttrs(ctx, path, value.attrs)) return undefined;
      if (Array.isArray(value.content) && value.content.length > 0) {
        return fail(ctx, path, "BAD_CHILD", "Este elemento não tem conteúdo.");
      }
      return { type };
    }
    case "image": {
      const attrs = attrsOf(ctx, path, value.attrs);
      if (!attrs || !onlyKeys(ctx, `${path}.attrs`, attrs, ["mediaId", "caption"]))
        return undefined;
      // A imagem é referenciada só por id de mídia: nunca por URL enviada pelo cliente.
      if (typeof attrs.mediaId !== "string" || !UUID.test(attrs.mediaId)) {
        return fail(ctx, `${path}.attrs.mediaId`, "BAD_ATTR", "Imagem inválida.");
      }
      const caption = attrs.caption;
      if (caption !== undefined && caption !== null) {
        if (typeof caption !== "string" || caption.length > LIMITS.maxCaption) {
          return fail(
            ctx,
            `${path}.attrs.caption`,
            "BAD_ATTR",
            "Legenda inválida ou longa demais.",
          );
        }
      }
      if (Array.isArray(value.content) && value.content.length > 0) {
        return fail(ctx, path, "BAD_CHILD", "Este elemento não tem conteúdo.");
      }
      const attrsOut =
        typeof caption === "string" && caption !== ""
          ? { mediaId: attrs.mediaId, caption }
          : { mediaId: attrs.mediaId };
      return { type, attrs: attrsOut };
    }
    case "bulletList":
    case "orderedList": {
      const attrs = attrsOf(ctx, path, value.attrs);
      if (!attrs) return undefined;
      let start = 1;
      if (type === "orderedList") {
        if (!onlyKeys(ctx, `${path}.attrs`, attrs, ["start", "type"])) return undefined;
        if (attrs.type !== undefined && attrs.type !== null) {
          return fail(ctx, `${path}.attrs.type`, "BAD_ATTR", "Tipo de numeração não permitido.");
        }
        if (attrs.start !== undefined && attrs.start !== null) {
          if (
            typeof attrs.start !== "number" ||
            !Number.isInteger(attrs.start) ||
            attrs.start < 1 ||
            attrs.start > 9999
          ) {
            return fail(ctx, `${path}.attrs.start`, "BAD_ATTR", "Número inicial inválido.");
          }
          start = attrs.start;
        }
      } else if (Object.keys(attrs).length > 0) {
        return fail(ctx, `${path}.attrs`, "BAD_ATTR", "Este elemento não aceita atributos.");
      }
      const items = listItems(ctx, value, path, depth);
      if (!items) return undefined;
      return type === "orderedList"
        ? { type, attrs: { start }, content: items }
        : { type, content: items };
    }
    case "blockquote":
    case "callout": {
      const attrs = attrsOf(ctx, path, value.attrs);
      if (!attrs) return undefined;
      let variant: CalloutVariant = "aplicacao";
      if (type === "callout") {
        if (!onlyKeys(ctx, `${path}.attrs`, attrs, ["variant"])) return undefined;
        if (attrs.variant !== undefined && attrs.variant !== null) {
          if (!(CALLOUT_VARIANTS as readonly unknown[]).includes(attrs.variant)) {
            return fail(
              ctx,
              `${path}.attrs.variant`,
              "BAD_ATTR",
              "Tipo de destaque não permitido.",
            );
          }
          variant = attrs.variant as CalloutVariant;
        }
      } else if (Object.keys(attrs).length > 0) {
        return fail(ctx, `${path}.attrs`, "BAD_ATTR", "Este elemento não aceita atributos.");
      }
      const raw = children(ctx, value, path, depth);
      if (!raw) return undefined;
      if (raw.length === 0)
        return fail(ctx, path, "BAD_CHILD", "Este elemento não pode ficar vazio.");
      const content: Extract<Block, { type: "paragraph" | "bulletList" | "orderedList" }>[] = [];
      for (const [i, child] of raw.entries()) {
        if (tooMany(ctx) || !count(ctx, `${path}.content[${i}]`)) return undefined;
        const parsed = parseBlock(ctx, child, `${path}.content[${i}]`, depth + 1, IN_CONTAINER);
        if (!parsed) return undefined;
        content.push(parsed as (typeof content)[number]);
      }
      return type === "callout" ? { type, attrs: { variant }, content } : { type, content };
    }
    case "listItem": {
      if (!noAttrs(ctx, path, value.attrs)) return undefined;
      const raw = children(ctx, value, path, depth);
      if (!raw) return undefined;
      if (raw.length === 0) return fail(ctx, path, "BAD_CHILD", "Item de lista vazio.");
      const content: Extract<Block, { type: "paragraph" | "bulletList" | "orderedList" }>[] = [];
      for (const [i, child] of raw.entries()) {
        if (tooMany(ctx) || !count(ctx, `${path}.content[${i}]`)) return undefined;
        // O primeiro filho de um item é sempre um parágrafo (regra do editor).
        const allowedHere = i === 0 ? new Set(["paragraph"]) : IN_LIST_ITEM_AFTER_FIRST;
        const parsed = parseBlock(ctx, child, `${path}.content[${i}]`, depth + 1, allowedHere);
        if (!parsed) return undefined;
        content.push(parsed as (typeof content)[number]);
      }
      return { type, content };
    }
    default:
      return fail(ctx, path, "UNKNOWN_NODE", `Elemento não permitido: ${safeName(type)}.`);
  }
}

function listItems(
  ctx: Ctx,
  value: Record<string, unknown>,
  path: string,
  depth: number,
): ListItem[] | undefined {
  const raw = children(ctx, value, path, depth);
  if (!raw) return undefined;
  if (raw.length === 0) return fail(ctx, path, "BAD_CHILD", "Lista vazia.");
  const items: ListItem[] = [];
  for (const [i, child] of raw.entries()) {
    if (tooMany(ctx) || !count(ctx, `${path}.content[${i}]`)) return undefined;
    const parsed = parseBlock(
      ctx,
      child,
      `${path}.content[${i}]`,
      depth + 1,
      new Set(["listItem"]),
    );
    if (!parsed) return undefined;
    items.push(parsed as ListItem);
  }
  return items;
}

/** Valida e NORMALIZA um documento de texto rico. Nunca lança. */
export function validateRichText(input: unknown): ValidationResult {
  const ctx: Ctx = { errors: [], nodes: 0, totalText: 0 };
  if (!isPlainObject(input)) {
    return {
      ok: false,
      errors: [{ path: "", code: "NOT_OBJECT", message: "Documento inválido." }],
    };
  }
  if (input.type !== "doc") {
    return {
      ok: false,
      errors: [{ path: "", code: "BAD_ROOT", message: "Documento sem raiz válida." }],
    };
  }
  if (!onlyKeys(ctx, "", input, ["type", "content", "attrs"]) || !noAttrs(ctx, "", input.attrs)) {
    return { ok: false, errors: ctx.errors };
  }

  const raw = input.content;
  if (raw !== undefined && raw !== null && !Array.isArray(raw)) {
    return {
      ok: false,
      errors: [{ path: "content", code: "BAD_CHILD", message: "Conteúdo inválido." }],
    };
  }
  const blocks: Block[] = [];
  for (const [i, child] of (raw ?? []).entries()) {
    if (tooMany(ctx) || !count(ctx, `content[${i}]`)) break;
    const parsed = parseBlock(ctx, child, `content[${i}]`, 1, BLOCKS);
    if (parsed) blocks.push(parsed as Block);
  }
  if (ctx.errors.length > 0) return { ok: false, errors: ctx.errors };
  return { ok: true, doc: { type: "doc", content: blocks } };
}

/** Documento vazio válido (corpo padrão de um artigo novo). */
export const EMPTY_DOC: RichDoc = { type: "doc", content: [] };
