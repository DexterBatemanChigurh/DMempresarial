import { mergeAttributes, Node, type Extensions } from "@tiptap/core";
import { findWrapping } from "@tiptap/pm/transform";
import StarterKit from "@tiptap/starter-kit";
import { CALLOUT_LABELS, HEADING_LEVELS, isAllowedHref, type RichDoc } from "@/lib/rich-text";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    callout: {
      /** Envolve (ou desfaz) a seleção no destaque "Aplicação na empresa". */
      toggleCallout: () => ReturnType;
    };
  }
}

/**
 * Extensões do editor (docs/03, parte 9). O editor só consegue PRODUZIR o que a lista de
 * permissão (`@/lib/rich-text/schema`) aceita: código, tachado, sublinhado e demais elementos do
 * StarterKit ficam desligados, e o teste `extensions.test.ts` compara o schema resultante com a
 * lista. Colar HTML de fora passa pelo mesmo schema: o que não existe nele é descartado.
 */

/** Destaque "Aplicação na empresa" (Blueprint 1, seção 13). */
export const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "(paragraph | bulletList | orderedList)+",
  defining: true,

  addAttributes() {
    return {
      variant: {
        default: "aplicacao",
        parseHTML: (element) => element.getAttribute("data-callout") ?? "aplicacao",
        renderHTML: (attributes) => ({ "data-callout": attributes.variant }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "aside[data-callout]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "aside",
      mergeAttributes(HTMLAttributes, { "aria-label": CALLOUT_LABELS.aplicacao }),
      0,
    ];
  },

  addCommands() {
    return {
      toggleCallout:
        () =>
        ({ state, tr, dispatch }) => {
          const { $from, $to } = state.selection;

          // Já dentro de um destaque: desembrulha, devolvendo o conteúdo dele ao documento. (O
          // `lift` do Tiptap tiraria o bloco do pai mais próximo, ex.: do item de lista.)
          for (let depth = $from.depth; depth > 0; depth--) {
            const node = $from.node(depth);
            if (node.type === this.type) {
              if (dispatch) tr.replaceWith($from.before(depth), $from.after(depth), node.content);
              return true;
            }
          }

          // Embrulha os blocos de NÍVEL SUPERIOR que contêm a seleção. Um item de lista não aceita
          // destaque dentro dele, então o cursor numa lista embrulha a lista inteira.
          const range = $from.blockRange($to, (node) => node.type.name === "doc");
          if (!range) return false;
          const wrapping = findWrapping(range, this.type);
          if (!wrapping) return false;
          if (dispatch) tr.wrap(range, wrapping);
          return true;
        },
    };
  },
});

/**
 * Imagem referenciada só por id de mídia (nunca por URL). O editor mostra um marcador; a imagem
 * real é resolvida pela tabela de mídia na renderização.
 */
export const MediaImage = Node.create({
  name: "image",
  group: "block",
  atom: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      mediaId: { default: null },
      caption: { default: null },
    };
  },

  parseHTML() {
    return [
      {
        tag: "figure[data-media-id]",
        getAttrs: (element) => ({
          mediaId: element.getAttribute("data-media-id"),
          caption: element.getAttribute("data-caption"),
        }),
      },
    ];
  },

  renderHTML({ node }) {
    const { mediaId, caption } = node.attrs as { mediaId: string | null; caption: string | null };
    return [
      "figure",
      { "data-media-id": mediaId ?? "", "data-caption": caption ?? "", class: "rich-image" },
      `Imagem${caption ? `: ${caption}` : ""}`,
    ];
  },
});

/**
 * O banco guarda o corpo vazio como `content: []`, mas o ProseMirror exige ao menos um bloco: o
 * editor abre com um parágrafo vazio. (E um parágrafo vazio sem texto continua contando como
 * "sem texto" nas regras de publicação.)
 */
export function toEditorContent(
  doc: RichDoc,
): RichDoc | { type: "doc"; content: [{ type: "paragraph" }] } {
  return doc.content.length > 0 ? doc : { type: "doc", content: [{ type: "paragraph" }] };
}

export function richTextExtensions(): Extensions {
  return [
    StarterKit.configure({
      heading: { levels: [...HEADING_LEVELS] },
      // Fora da lista de permissão:
      code: false,
      codeBlock: false,
      strike: false,
      underline: false,
      link: {
        openOnClick: false,
        autolink: false,
        linkOnPaste: false,
        defaultProtocol: "https",
        protocols: ["mailto", "tel"],
        // A MESMA regra do servidor: um link que o editor aceita é um link que o servidor aceita.
        isAllowedUri: (url) => isAllowedHref(url),
      },
    }),
    Callout,
    MediaImage,
  ];
}
