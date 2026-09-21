/**
 * Utilitários sobre documentos de texto rico (JSON do Tiptap/ProseMirror). Puros e defensivos:
 * o JSON vem do cliente e pode ser malformado, gigante ou cíclico. A validação por allowlist
 * (nós, marcas, atributos, protocolos de link) é da fase do CMS; aqui só se extrai texto.
 */
const MAX_DEPTH = 40;
const MAX_TEXT_LENGTH = 1_000_000;

const BLOCK_TYPES = new Set([
  "paragraph",
  "heading",
  "blockquote",
  "bulletList",
  "orderedList",
  "listItem",
  "callout",
  "horizontalRule",
  "hardBreak",
]);

type Node = { type?: unknown; text?: unknown; content?: unknown };

/** Texto plano de um documento, com espaço entre blocos. Entrada inválida vira "". */
export function extractPlainText(doc: unknown): string {
  const parts: string[] = [];
  let length = 0;

  const visit = (node: unknown, depth: number): void => {
    if (length > MAX_TEXT_LENGTH || depth > MAX_DEPTH) return;
    if (node === null || typeof node !== "object") return;
    const { type, text, content } = node as Node;

    if (typeof text === "string") {
      parts.push(text);
      length += text.length;
    }
    if (Array.isArray(content)) {
      for (const child of content) visit(child, depth + 1);
    }
    if (typeof type === "string" && BLOCK_TYPES.has(type)) parts.push(" ");
  };

  visit(doc, 0);
  return parts.join("").replace(/\s+/g, " ").trim().slice(0, MAX_TEXT_LENGTH);
}

export function isEmptyRichText(doc: unknown): boolean {
  return extractPlainText(doc).length === 0;
}

/** Palavras por minuto de leitura silenciosa (padrão editorial). */
const WORDS_PER_MINUTE = 200;

/** Tempo de leitura em minutos, arredondado para cima; texto vazio = 0. */
export function readingMinutes(plainText: string): number {
  const words = plainText.trim().split(/\s+/).filter(Boolean).length;
  return words === 0 ? 0 : Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
