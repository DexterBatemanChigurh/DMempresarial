import type { Block, ListItem, RichDoc } from "./schema";

/**
 * Ids de mídia referenciados por um documento já validado. Puro: usado para pré-carregar as
 * imagens (uma consulta em lote) antes de montar o `MediaResolver` síncrono que `<RichText>`
 * exige (ver `features/media/application/resolve.ts`).
 *
 * Percorre só os níveis BLOCO (nunca o conteúdo em linha de parágrafo/título, que é texto, não
 * pode conter imagem): listas, itens de lista, citação e destaque.
 */
function visitBlock(block: Block, out: Set<string>): void {
  switch (block.type) {
    case "image":
      out.add(block.attrs.mediaId);
      return;
    case "bulletList":
    case "orderedList":
      for (const item of block.content) visitListItem(item, out);
      return;
    case "blockquote":
    case "callout":
      for (const child of block.content) visitBlock(child, out);
      return;
    default:
      return;
  }
}

function visitListItem(item: ListItem, out: Set<string>): void {
  for (const child of item.content) visitBlock(child, out);
}

export function extractMediaIds(doc: RichDoc): string[] {
  const ids = new Set<string>();
  for (const block of doc.content) visitBlock(block, ids);
  return [...ids];
}
