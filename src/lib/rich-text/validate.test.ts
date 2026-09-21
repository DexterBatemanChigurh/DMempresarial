import { describe, expect, it } from "vitest";
import { LIMITS } from "./schema";
import { EMPTY_DOC, validateRichText } from "./validate";

const MEDIA = "0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c";
const t = (text: string, marks?: unknown[]) => ({
  type: "text",
  text,
  ...(marks ? { marks } : {}),
});
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const doc = (...content: unknown[]) => ({ type: "doc", content });
const codes = (input: unknown) => {
  const result = validateRichText(input);
  return result.ok ? [] : result.errors.map((e) => e.code);
};

describe("documentos válidos", () => {
  it("documento vazio e parágrafo vazio (o que o editor produz sem texto)", () => {
    expect(validateRichText(doc())).toEqual({ ok: true, doc: EMPTY_DOC });
    expect(validateRichText({ type: "doc" })).toEqual({ ok: true, doc: EMPTY_DOC });
    expect(validateRichText(doc({ type: "paragraph" }))).toMatchObject({ ok: true });
  });

  it("aceita todos os elementos da lista de permissão", () => {
    const value = doc(
      { type: "heading", attrs: { level: 2 }, content: [t("Título")] },
      p(
        t("negrito", [{ type: "bold" }]),
        t(" e "),
        t("itálico", [{ type: "italic" }]),
        { type: "hardBreak" },
        t("fim"),
      ),
      {
        type: "bulletList",
        content: [
          {
            type: "listItem",
            content: [
              p(t("um")),
              {
                type: "orderedList",
                attrs: { start: 3 },
                content: [{ type: "listItem", content: [p(t("aninhado"))] }],
              },
            ],
          },
          { type: "listItem", content: [p(t("dois"))] },
        ],
      },
      { type: "blockquote", content: [p(t("citação"))] },
      { type: "callout", attrs: { variant: "aplicacao" }, content: [p(t("na empresa"))] },
      { type: "horizontalRule" },
      { type: "image", attrs: { mediaId: MEDIA, caption: "Legenda" } },
    );
    expect(validateRichText(value)).toMatchObject({ ok: true });
  });

  it("aceita links permitidos e normaliza os atributos padrão do editor (target/rel/class somem)", () => {
    const link = {
      type: "link",
      attrs: {
        href: "https://exemplo.com",
        target: "_blank",
        rel: "noopener noreferrer nofollow",
        class: null,
      },
    };
    const result = validateRichText(doc(p(t("site", [link]))));
    expect(result).toEqual({
      ok: true,
      doc: doc(p(t("site", [{ type: "link", attrs: { href: "https://exemplo.com" } }]))),
    });
  });

  it("ordena as marcas de forma estável (o JSON guardado não depende da ordem de aplicação)", () => {
    const a = validateRichText(doc(p(t("x", [{ type: "italic" }, { type: "bold" }]))));
    const b = validateRichText(doc(p(t("x", [{ type: "bold" }, { type: "italic" }]))));
    expect(a).toEqual(b);
  });

  it("aplica os padrões (orderedList.start = 1; callout.variant = aplicacao)", () => {
    const result = validateRichText(
      doc(
        { type: "orderedList", content: [{ type: "listItem", content: [p()] }] },
        { type: "callout", content: [p(t("x"))] },
      ),
    );
    expect(result).toMatchObject({
      ok: true,
      doc: { content: [{ attrs: { start: 1 } }, { attrs: { variant: "aplicacao" } }] },
    });
  });

  it("devolve objetos NOVOS: alterar a entrada depois não altera o resultado", () => {
    const input = doc(p(t("original")));
    const result = validateRichText(input);
    (input.content[0] as { content: { text: string }[] }).content[0]!.text = "adulterado";
    expect(result.ok && JSON.stringify(result.doc)).toContain("original");
  });
});

describe("XSS armazenado: elementos, marcas e atributos fora da lista", () => {
  it("recusa elementos perigosos ou desconhecidos", () => {
    for (const type of [
      "script",
      "iframe",
      "html",
      "codeBlock",
      "table",
      "video",
      "embed",
      "style",
      "object",
      "constructor",
      "__proto__",
    ]) {
      expect(codes(doc({ type, content: [t("x")] })), type).toContain("UNKNOWN_NODE");
    }
  });

  it("recusa marcas desconhecidas (code, underline, textStyle com style)", () => {
    for (const type of ["code", "underline", "strike", "textStyle", "highlight", "subscript"]) {
      expect(codes(doc(p(t("x", [{ type }])))), type).toContain("BAD_MARK");
    }
  });

  it("recusa atributos em elementos que não os têm (class, style, onclick, id)", () => {
    for (const attrs of [
      { class: "x" },
      { style: "color:red" },
      { onclick: "alert(1)" },
      { id: "a" },
    ]) {
      expect(
        codes(doc({ type: "paragraph", attrs, content: [t("x")] })),
        JSON.stringify(attrs),
      ).toContain("BAD_ATTR");
    }
  });

  it("recusa chaves extras no elemento e no texto (onerror, html, innerHTML)", () => {
    expect(codes(doc({ type: "paragraph", onclick: "x" }))).toContain("UNKNOWN_KEY");
    expect(codes(doc(p({ type: "text", text: "x", html: "<b>" })))).toContain("UNKNOWN_KEY");
    expect(codes({ type: "doc", content: [], innerHTML: "<script>" })).toContain("UNKNOWN_KEY");
  });

  it("recusa atributos de link fora do padrão e href perigoso em TODAS as formas", () => {
    const link = (attrs: Record<string, unknown>) => doc(p(t("x", [{ type: "link", attrs }])));
    expect(codes(link({ href: "javascript:alert(1)" }))).toContain("BAD_LINK");
    expect(codes(link({ href: "data:text/html,<script>" }))).toContain("BAD_LINK");
    expect(codes(link({ href: "https://ok.com", target: "_top" }))).toContain("BAD_LINK");
    expect(codes(link({ href: "https://ok.com", rel: "opener" }))).toContain("BAD_LINK");
    expect(codes(link({ href: "https://ok.com", class: "x" }))).toContain("BAD_LINK");
    expect(codes(link({ href: "https://ok.com", title: "dica" }))).toContain("BAD_LINK");
    // Nulo é o padrão que o editor emite, e passa.
    expect(codes(link({ href: "https://ok.com", title: null, class: null }))).toEqual([]);
    expect(codes(link({ href: "https://ok.com", onclick: "x" }))).toContain("UNKNOWN_KEY");
    expect(codes(link({}))).toContain("BAD_LINK");
    expect(codes(link({ href: 42 }))).toContain("BAD_LINK");
  });

  it("imagem só por id de mídia: nada de src/url, e o id precisa ser um uuid", () => {
    const image = (attrs: Record<string, unknown>) => doc({ type: "image", attrs });
    expect(codes(image({ src: "https://evil.example/a.png" }))).toContain("UNKNOWN_KEY");
    expect(codes(image({ mediaId: MEDIA, src: "x" }))).toContain("UNKNOWN_KEY");
    for (const mediaId of [
      "1",
      "javascript:alert(1)",
      "../../etc/passwd",
      `${MEDIA}x`,
      "",
      5,
      null,
    ]) {
      expect(codes(image({ mediaId })), String(mediaId)).toContain("BAD_ATTR");
    }
    expect(codes(image({ mediaId: MEDIA, caption: "x".repeat(LIMITS.maxCaption + 1) }))).toContain(
      "BAD_ATTR",
    );
    expect(codes(image({ mediaId: MEDIA, caption: 5 }))).toContain("BAD_ATTR");
  });

  it("HTML dentro do texto é só texto (o renderizador escapa): permanece como dado, sem virar elemento", () => {
    const result = validateRichText(
      doc(p(t("<script>alert(1)</script><img src=x onerror=alert(1)>"))),
    );
    expect(result).toMatchObject({ ok: true });
  });
});

describe("estrutura (a gramática do editor)", () => {
  it("títulos só de nível 2 a 4, inteiros", () => {
    for (const level of [1, 5, 6, 0, -1, 2.5, "2", null, undefined]) {
      expect(
        codes(doc({ type: "heading", attrs: { level }, content: [t("x")] })),
        String(level),
      ).toContain("BAD_ATTR");
    }
    for (const level of [2, 3, 4]) {
      expect(codes(doc({ type: "heading", attrs: { level }, content: [t("x")] }))).toEqual([]);
    }
  });

  it("item de lista fora de lista, lista com filho errado e item vazio são recusados", () => {
    expect(codes(doc({ type: "listItem", content: [p()] }))).toContain("BAD_CHILD");
    expect(codes(doc({ type: "bulletList", content: [p(t("x"))] }))).toContain("BAD_CHILD");
    expect(codes(doc({ type: "bulletList", content: [] }))).toContain("BAD_CHILD");
    expect(
      codes(doc({ type: "bulletList", content: [{ type: "listItem", content: [] }] })),
    ).toContain("BAD_CHILD");
    // O primeiro filho de um item precisa ser parágrafo.
    expect(
      codes(
        doc({
          type: "bulletList",
          content: [{ type: "listItem", content: [{ type: "horizontalRule" }] }],
        }),
      ),
    ).toContain("BAD_CHILD");
  });

  it("texto solto no documento, bloco dentro de parágrafo e destaque dentro de destaque são recusados", () => {
    expect(codes(doc(t("solto")))).toContain("BAD_CHILD");
    expect(codes(doc(p({ type: "paragraph", content: [] })))).toContain("BAD_CHILD");
    expect(
      codes(doc({ type: "callout", content: [{ type: "callout", content: [p()] }] })),
    ).toContain("BAD_CHILD");
    expect(
      codes(doc({ type: "blockquote", content: [{ type: "blockquote", content: [p()] }] })),
    ).toContain("BAD_CHILD");
    expect(
      codes(
        doc({
          type: "blockquote",
          content: [{ type: "heading", attrs: { level: 2 }, content: [] }],
        }),
      ),
    ).toContain("BAD_CHILD");
  });

  it("raiz inválida, texto vazio, elementos sem conteúdo com conteúdo e tipos errados", () => {
    expect(codes({ type: "paragraph" })).toContain("BAD_ROOT");
    expect(codes(doc(p({ type: "text", text: "" })))).toContain("BAD_TEXT");
    expect(codes(doc(p({ type: "text" })))).toContain("BAD_TEXT");
    expect(codes(doc(p({ type: "text", text: 5 })))).toContain("BAD_TEXT");
    expect(codes(doc({ type: "horizontalRule", content: [p()] }))).toContain("BAD_CHILD");
    expect(codes({ type: "doc", content: "x" })).toContain("BAD_CHILD");
    expect(codes(doc({ type: "paragraph", content: "x" }))).toContain("BAD_CHILD");
  });

  it("recusa qualquer entrada que não seja objeto simples", () => {
    for (const value of [
      null,
      undefined,
      42,
      "texto",
      true,
      [],
      [doc()],
      new Date(),
      new Map(),
      () => 1,
    ]) {
      expect(validateRichText(value).ok, String(value)).toBe(false);
    }
  });

  it("marcas: repetida, em excesso ou malformada", () => {
    expect(codes(doc(p(t("x", [{ type: "bold" }, { type: "bold" }]))))).toContain("BAD_MARK");
    expect(codes(doc(p(t("x", "bold" as unknown as unknown[]))))).toContain("BAD_MARK");
    expect(codes(doc(p(t("x", ["bold"]))))).toContain("BAD_MARK");
    expect(codes(doc(p(t("x", [{ type: "bold", attrs: { x: 1 } }]))))).toContain("BAD_ATTR");
  });
});

describe("poluição de protótipo e objetos exóticos", () => {
  it("chaves __proto__/constructor/prototype vindas de JSON.parse são recusadas", () => {
    for (const hostile of [
      '{"type":"doc","content":[],"__proto__":{"polluted":true}}',
      '{"type":"doc","content":[{"type":"paragraph","__proto__":{"x":1}}]}',
      '{"type":"doc","content":[{"type":"paragraph","attrs":{"__proto__":{"x":1}}}]}',
      '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"x","constructor":{"prototype":{"x":1}}}]}]}',
    ]) {
      const result = validateRichText(JSON.parse(hostile));
      expect(result.ok, hostile).toBe(false);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    }
  });

  it("objeto com protótipo customizado é recusado (só objetos simples)", () => {
    class Custom {
      type = "doc";
      content = [];
    }
    expect(validateRichText(new Custom()).ok).toBe(false);
  });

  it("aceita objetos sem protótipo (Object.create(null)), como alguns parsers geram", () => {
    const value = Object.assign(Object.create(null), { type: "doc", content: [] });
    expect(validateRichText(value)).toMatchObject({ ok: true });
  });
});

describe("limites contra abuso de recursos", () => {
  it("aninhamento profundo é recusado sem estourar a pilha", () => {
    let node: Record<string, unknown> = { type: "paragraph", content: [t("x")] };
    for (let i = 0; i < 500; i++) node = { type: "blockquote", content: [node] };
    const result = validateRichText(doc(node));
    expect(result.ok).toBe(false);
  });

  it("listas aninhadas além do limite de profundidade são recusadas", () => {
    let list: Record<string, unknown> = {
      type: "bulletList",
      content: [{ type: "listItem", content: [p(t("fundo"))] }],
    };
    for (let i = 0; i < LIMITS.maxDepth; i++) {
      list = { type: "bulletList", content: [{ type: "listItem", content: [p(t("n")), list] }] };
    }
    expect(codes(doc(list))).toContain("LIMIT");
  });

  it("documento com nós demais é recusado (e para cedo)", () => {
    const paragraphs = Array.from({ length: LIMITS.maxNodes + 100 }, () => p(t("x")));
    const result = validateRichText(doc(...paragraphs));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.length).toBeLessThanOrEqual(LIMITS.maxErrors);
  });

  it("texto total e por trecho acima do limite é recusado", () => {
    expect(codes(doc(p(t("x".repeat(LIMITS.maxTextNode + 1)))))).toContain("LIMIT");
    const chunk = "y".repeat(LIMITS.maxTextNode);
    const many = Array.from({ length: 12 }, () => p(t(chunk)));
    expect(codes(doc(...many))).toContain("LIMIT");
  });

  it("nunca lança e limita a quantidade de erros devolvidos", () => {
    const bad = Array.from({ length: 200 }, () => ({ type: "script" }));
    const result = validateRichText(doc(...bad));
    expect(result.ok).toBe(false);
    expect(!result.ok && result.errors.length).toBeLessThanOrEqual(LIMITS.maxErrors);
  });

  it("a mensagem de erro não devolve o conteúdo hostil enviado", () => {
    const result = validateRichText(doc({ type: "<script>alert(1)</script>" }));
    const text = JSON.stringify(result);
    expect(text).not.toContain("<script>");
    expect(text).not.toContain("alert(1)");
  });
});
