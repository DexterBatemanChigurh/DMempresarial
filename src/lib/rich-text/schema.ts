/**
 * Lista de permissão do texto rico (docs/03, parte 9). É a ÚNICA definição do que um artigo pode
 * conter: o validador do servidor, o renderizador e o editor derivam dela. Nada fora da lista é
 * aceito, e o JSON guardado é normalizado para conter só isto.
 */
export const NODE_TYPES = [
  "paragraph",
  "heading",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "callout",
  "horizontalRule",
  "image",
  "hardBreak",
  "text",
] as const;
export type NodeType = (typeof NODE_TYPES)[number];

export const MARK_TYPES = ["bold", "italic", "link"] as const;
export type MarkType = (typeof MARK_TYPES)[number];

/** H1 é reservado ao título da página (docs/02, seção 19): o corpo usa H2 a H4. */
export const HEADING_LEVELS = [2, 3, 4] as const;
export type HeadingLevel = (typeof HEADING_LEVELS)[number];

export const CALLOUT_VARIANTS = ["aplicacao"] as const;
export type CalloutVariant = (typeof CALLOUT_VARIANTS)[number];

/** Rótulo visível de cada variante do destaque (Blueprint 1, seção 13). */
export const CALLOUT_LABELS: Record<CalloutVariant, string> = {
  aplicacao: "Aplicação na empresa",
};

export const LIMITS = {
  maxDepth: 10,
  maxNodes: 20_000,
  maxTotalText: 200_000,
  maxTextNode: 20_000,
  maxMarksPerText: 3,
  maxCaption: 300,
  maxErrors: 20,
} as const;

// ---- Tipos do documento já VALIDADO (o que o renderizador recebe) ----
export type Mark =
  { type: "bold" } | { type: "italic" } | { type: "link"; attrs: { href: string } };

export type TextNode = { type: "text"; text: string; marks?: Mark[] };
export type HardBreak = { type: "hardBreak" };
export type Inline = TextNode | HardBreak;

export type Paragraph = { type: "paragraph"; content?: Inline[] };
export type Heading = { type: "heading"; attrs: { level: HeadingLevel }; content?: Inline[] };
export type ListItem = { type: "listItem"; content: (Paragraph | List)[] };
export type BulletList = { type: "bulletList"; content: ListItem[] };
export type OrderedList = { type: "orderedList"; attrs: { start: number }; content: ListItem[] };
export type List = BulletList | OrderedList;
export type Blockquote = { type: "blockquote"; content: (Paragraph | List)[] };
export type Callout = {
  type: "callout";
  attrs: { variant: CalloutVariant };
  content: (Paragraph | List)[];
};
export type HorizontalRule = { type: "horizontalRule" };
export type ImageBlock = { type: "image"; attrs: { mediaId: string; caption?: string } };

export type Block = Paragraph | Heading | List | Blockquote | Callout | HorizontalRule | ImageBlock;

export type RichDoc = { type: "doc"; content: Block[] };
