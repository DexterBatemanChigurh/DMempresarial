import { Fragment, type ReactNode } from "react";
import { Heading, TextLink } from "@/components/ui";
import { cn } from "@/lib/cn";
import {
  CALLOUT_LABELS,
  validateRichText,
  type Block,
  type Inline,
  type ListItem,
  type Mark,
} from "@/lib/rich-text";

/**
 * Renderizador do texto rico (docs/03, parte 9; docs/02, seção 19). Produz elementos React a
 * partir do JSON VALIDADO: não existe HTML montado como texto, então o
 * navegador só recebe o que a lista de permissão permite, com escape automático de todo texto.
 *
 * Valida DE NOVO na leitura (mesmo que já tenha sido validado ao salvar): um dado antigo ou
 * alterado direto no banco nunca chega à página sem passar pela lista. Documento inválido
 * renderiza vazio em vez de derrubar a página.
 */
export type ResolvedMedia = { url: string; alt: string; width: number; height: number };
export type MediaResolver = (mediaId: string) => ResolvedMedia | null;

type Props = {
  value: unknown;
  /** Resolve o id da mídia para URL, texto alternativo e dimensões (vêm da tabela `media`). */
  resolveMedia?: MediaResolver;
  className?: string;
};

function renderMarks(text: string, marks: Mark[] | undefined, key: number): ReactNode {
  let node: ReactNode = text;
  let href: string | null = null;
  let bold = false;
  let italic = false;
  for (const mark of marks ?? []) {
    if (mark.type === "bold") bold = true;
    else if (mark.type === "italic") italic = true;
    else href = mark.attrs.href;
  }
  // Aninhamento fixo: link por fora, depois negrito, depois itálico.
  if (italic) node = <em>{node}</em>;
  if (bold) node = <strong>{node}</strong>;
  return href ? (
    <TextLink key={key} href={href}>
      {node}
    </TextLink>
  ) : (
    <Fragment key={key}>{node}</Fragment>
  );
}

function renderInline(content: Inline[] | undefined): ReactNode[] {
  return (content ?? []).map((node, i) =>
    node.type === "hardBreak" ? <br key={i} /> : renderMarks(node.text, node.marks, i),
  );
}

function renderListItem(item: ListItem, key: number, resolveMedia?: MediaResolver): ReactNode {
  return (
    <li key={key} className="space-y-xs">
      {item.content.map((child, i) => renderBlock(child, i, resolveMedia))}
    </li>
  );
}

function renderBlock(block: Block, key: number, resolveMedia?: MediaResolver): ReactNode {
  switch (block.type) {
    case "paragraph":
      return <p key={key}>{renderInline(block.content)}</p>;
    case "heading": {
      const level = block.attrs.level;
      return (
        <Heading
          key={key}
          as={`h${level}`}
          variant={level === 2 ? "article-h2" : level === 3 ? "h3" : "h4"}
          className="pt-md"
        >
          {renderInline(block.content)}
        </Heading>
      );
    }
    case "bulletList":
      return (
        <ul key={key} className="list-disc space-y-xs pl-lg marker:text-text-secondary">
          {block.content.map((item, i) => renderListItem(item, i, resolveMedia))}
        </ul>
      );
    case "orderedList":
      return (
        <ol
          key={key}
          start={block.attrs.start}
          className="list-decimal space-y-xs pl-lg marker:text-text-secondary"
        >
          {block.content.map((item, i) => renderListItem(item, i, resolveMedia))}
        </ol>
      );
    case "blockquote":
      return (
        <blockquote
          key={key}
          className="space-y-md border-l-[3px] border-link pl-lg font-serif text-h3 italic"
        >
          {block.content.map((child, i) => renderBlock(child, i, resolveMedia))}
        </blockquote>
      );
    case "callout": {
      const label = CALLOUT_LABELS[block.attrs.variant];
      return (
        <aside
          key={key}
          aria-label={label}
          data-tone="muted"
          className="space-y-md border-l-[3px] border-link bg-surface-muted px-lg py-md"
        >
          <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
            {label}
          </p>
          {block.content.map((child, i) => renderBlock(child, i, resolveMedia))}
        </aside>
      );
    }
    case "horizontalRule":
      return <hr key={key} className="border-border" />;
    case "image": {
      // Nunca há URL no documento: a mídia vem da tabela por id. Sem resolver, não renderiza.
      const media = resolveMedia?.(block.attrs.mediaId);
      if (!media) return null;
      return (
        <figure key={key} className="space-y-xs">
          {/* URL do storage (host definido na fase de mídia): next/image entra com o host configurado. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={media.url}
            alt={media.alt}
            width={media.width}
            height={media.height}
            loading="lazy"
            decoding="async"
            className="h-auto w-full"
          />
          {block.attrs.caption ? (
            <figcaption className="font-sans text-caption text-text-secondary">
              {block.attrs.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    }
  }
}

export function RichText({ value, resolveMedia, className }: Props) {
  const result = validateRichText(value);
  if (!result.ok) return null;
  return (
    <div className={cn("space-y-lg font-serif text-article text-text", className)}>
      {result.doc.content.map((block, i) => renderBlock(block, i, resolveMedia))}
    </div>
  );
}
