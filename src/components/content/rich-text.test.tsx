import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { RichText } from "./rich-text";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      createElement("a", { href, ...rest }, children),
  };
});

const MEDIA = "0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c";
const t = (text: string, marks?: unknown[]) => ({
  type: "text",
  text,
  ...(marks ? { marks } : {}),
});
const p = (...content: unknown[]) => ({ type: "paragraph", content });
const doc = (...content: unknown[]) => ({ type: "doc", content });
const html = (value: unknown, props: Partial<Parameters<typeof RichText>[0]> = {}) =>
  renderToStaticMarkup(<RichText value={value} {...props} />);

describe("RichText: estrutura", () => {
  it("renderiza parágrafos, títulos com o nível semântico certo e listas", () => {
    const out = html(
      doc(
        { type: "heading", attrs: { level: 2 }, content: [t("Título")] },
        { type: "heading", attrs: { level: 4 }, content: [t("Menor")] },
        p(t("Texto")),
        { type: "bulletList", content: [{ type: "listItem", content: [p(t("um"))] }] },
        {
          type: "orderedList",
          attrs: { start: 3 },
          content: [{ type: "listItem", content: [p(t("três"))] }],
        },
      ),
    );
    expect(out).toContain("<h2");
    expect(out).toContain("text-article-h2");
    expect(out).toContain("<h4");
    expect(out).toContain("<p>Texto</p>");
    expect(out).toContain("<ul");
    expect(out).toContain('<ol start="3"');
  });

  it("citação, destaque com rótulo acessível e linha divisória", () => {
    const out = html(
      doc(
        { type: "blockquote", content: [p(t("citada"))] },
        { type: "callout", attrs: { variant: "aplicacao" }, content: [p(t("na prática"))] },
        { type: "horizontalRule" },
      ),
    );
    expect(out).toContain("<blockquote");
    expect(out).toContain("italic");
    expect(out).toContain('<aside aria-label="Aplicação na empresa"');
    expect(out).toContain('data-tone="muted"');
    expect(out).toContain("<hr");
  });

  it("marcas: negrito e itálico dentro do link, com o link por fora; quebra de linha vira <br>", () => {
    const link = { type: "link", attrs: { href: "https://exemplo.com" } };
    const out = html(
      doc(p(t("a", [{ type: "bold" }, { type: "italic" }, link]), { type: "hardBreak" }, t("b"))),
    );
    expect(out).toMatch(/<a [^>]*><strong><em>a<\/em><\/strong>/);
    expect(out).toContain("<br/>");
  });
});

describe("RichText: segurança", () => {
  it("todo texto é escapado: HTML digitado aparece como texto, nunca como elemento", () => {
    const out = html(doc(p(t('<script>alert(1)</script><img src=x onerror="alert(1)">'))));
    expect(out).not.toContain("<script>");
    expect(out).not.toContain("<img");
    expect(out).toContain("&lt;script&gt;");
  });

  it("links: interno sem nova aba; externo com noopener noreferrer e aviso; mailto simples", () => {
    const at = (href: string) => html(doc(p(t("x", [{ type: "link", attrs: { href } }]))));
    expect(at("/blog/a")).not.toContain("target=");
    const external = at("https://exemplo.com");
    expect(external).toContain('target="_blank"');
    expect(external).toContain('rel="noopener noreferrer"');
    expect(external).toContain("abre em nova aba");
    expect(at("mailto:a@b.com")).not.toContain("target=");
  });

  it("documento com link javascript:, elemento desconhecido ou atributo estranho renderiza VAZIO", () => {
    for (const hostile of [
      doc(p(t("x", [{ type: "link", attrs: { href: "javascript:alert(1)" } }]))),
      doc({ type: "script", content: [t("x")] }),
      doc({ type: "paragraph", attrs: { onclick: "x" }, content: [t("x")] }),
      doc({ type: "image", attrs: { src: "https://evil.example/x.png" } }),
    ]) {
      expect(html(hostile)).toBe(
        '<div class="space-y-lg font-serif text-article text-text"></div>'.replace(
          /<div.*><\/div>/,
          "",
        ),
      );
    }
  });

  it("entrada que não é documento (null, string, número) não quebra a página", () => {
    for (const value of [null, undefined, "texto", 42, [], {}]) {
      expect(() => html(value)).not.toThrow();
      expect(html(value)).toBe("");
    }
  });
});

describe("RichText: imagens vêm da tabela de mídia, nunca do documento", () => {
  const image = (extra: Record<string, unknown> = {}) =>
    doc({ type: "image", attrs: { mediaId: MEDIA, ...extra } });

  it("sem resolvedor ou com mídia inexistente, não renderiza nada (nunca uma imagem quebrada)", () => {
    expect(html(image())).not.toContain("<img");
    expect(html(image(), { resolveMedia: () => null })).not.toContain("<img");
  });

  it("usa URL, texto alternativo e dimensões da MÍDIA; a legenda é escapada", () => {
    const out = html(image({ caption: "<b>Legenda</b>" }), {
      resolveMedia: (id) =>
        id === MEDIA
          ? {
              url: "https://midia.exemplo.test/a.webp",
              alt: "Equipe em reunião",
              width: 800,
              height: 600,
            }
          : null,
    });
    expect(out).toContain('src="https://midia.exemplo.test/a.webp"');
    expect(out).toContain('alt="Equipe em reunião"');
    expect(out).toContain('width="800"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain("<figcaption");
    expect(out).toContain("&lt;b&gt;Legenda&lt;/b&gt;");
    expect(out).not.toContain("<b>");
  });
});
