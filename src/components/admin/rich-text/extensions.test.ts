import { getSchema } from "@tiptap/core";
import { Node as ProseNode } from "@tiptap/pm/model";
import { describe, expect, it } from "vitest";
import { MARK_TYPES, NODE_TYPES, validateRichText } from "@/lib/rich-text";
import { richTextExtensions, toEditorContent } from "./extensions";

const schema = getSchema(richTextExtensions());
const MEDIA = "0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c";
const t = (text: string, marks?: unknown[]) => ({
  type: "text",
  text,
  ...(marks ? { marks } : {}),
});
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const doc = (...content: unknown[]) => ({ type: "doc", content });

describe("o schema do editor é EXATAMENTE a lista de permissão", () => {
  it("todo elemento e marca da lista existe no editor", () => {
    for (const node of NODE_TYPES) expect(schema.nodes[node], node).toBeDefined();
    for (const mark of MARK_TYPES) expect(schema.marks[mark], mark).toBeDefined();
  });

  it("o editor NÃO tem nenhum elemento ou marca fora da lista (código, tachado, sublinhado…)", () => {
    const allowedNodes = new Set<string>(["doc", ...NODE_TYPES]);
    const allowedMarks = new Set<string>(MARK_TYPES);
    for (const name of Object.keys(schema.nodes))
      expect(allowedNodes.has(name), `nó ${name}`).toBe(true);
    for (const name of Object.keys(schema.marks))
      expect(allowedMarks.has(name), `marca ${name}`).toBe(true);
  });
});

describe("o editor não emite NENHUM atributo que o servidor desconheça", () => {
  // Atributos que o validador conhece por elemento (chaves, não valores).
  const knownAttrs: Record<string, string[]> = {
    heading: ["level"],
    orderedList: ["start", "type"],
    image: ["mediaId", "caption"],
    callout: ["variant"],
  };
  const knownMarkAttrs: Record<string, string[]> = {
    link: ["href", "target", "rel", "class", "title"],
  };

  it("cada elemento do schema declara só atributos conhecidos (uma atualização da biblioteca que acrescente um faz este teste falhar)", () => {
    for (const [name, type] of Object.entries(schema.nodes)) {
      if (name === "doc" || name === "text") continue;
      const declared = Object.keys(type.spec.attrs ?? {});
      expect(
        declared.filter((k) => !(knownAttrs[name] ?? []).includes(k)),
        `nó ${name}`,
      ).toEqual([]);
    }
    for (const [name, type] of Object.entries(schema.marks)) {
      const declared = Object.keys(type.spec.attrs ?? {});
      expect(
        declared.filter((k) => !(knownMarkAttrs[name] ?? []).includes(k)),
        `marca ${name}`,
      ).toEqual([]);
    }
  });

  it("um link criado pelo editor, com TODOS os atributos padrão do schema, é aceito pelo servidor", () => {
    const mark = schema.marks.link!.create({ href: "https://exemplo.com" });
    const value = doc(p({ type: "text", text: "x", marks: [mark.toJSON()] }));
    expect(validateRichText(value)).toMatchObject({ ok: true });
  });
});

describe("o que o servidor aceita, o editor consegue abrir; o que é estruturalmente inválido, ambos recusam", () => {
  const valid = [
    doc(),
    doc(p()),
    doc(
      { type: "heading", attrs: { level: 3 }, content: [t("Título")] },
      p(
        t("negrito", [{ type: "bold" }]),
        { type: "hardBreak" },
        t("itálico", [{ type: "italic" }]),
      ),
      p(t("link", [{ type: "link", attrs: { href: "https://exemplo.com" } }])),
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              p(t("a")),
              {
                type: "orderedList",
                attrs: { start: 2 },
                content: [{ type: "listItem", content: [p(t("b"))] }],
              },
            ],
          },
        ],
      },
      { type: "blockquote", content: [p(t("citação"))] },
      { type: "callout", attrs: { variant: "aplicacao" }, content: [p(t("x"))] },
      { type: "horizontalRule" },
      { type: "image", attrs: { mediaId: MEDIA, caption: "Legenda" } },
    ),
  ];

  for (const [index, value] of valid.entries()) {
    it(`documento válido #${index + 1}: validador aceita e o editor abre sem erro`, () => {
      const result = validateRichText(value);
      expect(result.ok).toBe(true);
      // O documento NORMALIZADO é o que vai para o banco: é ele que o editor precisa conseguir carregar.
      if (result.ok) {
        expect(() => ProseNode.fromJSON(schema, toEditorContent(result.doc)).check()).not.toThrow();
      }
    });
  }

  it("o documento vazio do banco NÃO abre direto no ProseMirror, mas toEditorContent o converte", () => {
    const empty = validateRichText(doc());
    expect(empty.ok).toBe(true);
    if (!empty.ok) return;
    expect(() => ProseNode.fromJSON(schema, empty.doc).check()).toThrow();
    const converted = toEditorContent(empty.doc);
    expect(() => ProseNode.fromJSON(schema, converted).check()).not.toThrow();
    // Conteúdo existente passa intacto.
    const full = validateRichText(doc(p(t("x"))));
    if (full.ok) expect(toEditorContent(full.doc)).toBe(full.doc);
  });

  const structurallyInvalid: [string, unknown][] = [
    ["item de lista fora de lista", doc({ type: "listItem", content: [p()] })],
    ["texto solto no documento", doc(t("solto"))],
    ["lista com parágrafo direto", doc({ type: "bulletList", content: [p(t("x"))] })],
    [
      "destaque dentro de destaque",
      doc({ type: "callout", content: [{ type: "callout", content: [p()] }] }),
    ],
    ["elemento inexistente", doc({ type: "codeBlock", content: [t("x")] })],
  ];
  for (const [name, value] of structurallyInvalid) {
    it(`recusado por ambos: ${name}`, () => {
      expect(validateRichText(value).ok).toBe(false);
      expect(() => ProseNode.fromJSON(schema, value).check()).toThrow();
    });
  }
});
