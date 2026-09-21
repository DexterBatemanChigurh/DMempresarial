import { describe, expect, it } from "vitest";
import { isAllowedHref, isExternalHref } from "./href";

describe("isAllowedHref: o que é aceito", () => {
  it("http e https com host, mailto, tel, caminho interno e âncora", () => {
    for (const ok of [
      "https://exemplo.com",
      "http://exemplo.com/caminho?x=1&y=2#topo",
      "HTTPS://EXEMPLO.COM",
      "https://sub.exemplo.com.br/a/b",
      "https://exemplo.com:8443/x",
      "mailto:pessoa@exemplo.com",
      "tel:+5534999999999",
      "tel:(34) 3333-4444".replace(/ /g, ""),
      "/blog/meu-artigo",
      "/",
      "/blog?pagina=2",
      "#secao-1",
    ]) {
      expect(isAllowedHref(ok), ok).toBe(true);
    }
  });
});

describe("isAllowedHref: vetores de XSS e de disfarce são recusados", () => {
  const hostile = [
    "javascript:alert(1)",
    "JaVaScRiPt:alert(1)",
    " javascript:alert(1)",
    "java\tscript:alert(1)",
    "java\nscript:alert(1)",
    "\u0000javascript:alert(1)",
    "javascript&colon;alert(1)",
    "&#106;avascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "data:text/html;base64,PHNjcmlwdD4=",
    "vbscript:msgbox(1)",
    "file:///etc/passwd",
    "ftp://exemplo.com/arquivo",
    "blob:https://exemplo.com/uuid",
    "about:blank",
    "//evil.example/x",
    "///evil.example",
    "\\\\evil.example\\x",
    "/\\evil.example",
    "https://usuario:senha@evil.example",
    "https://@evil.example",
    "https://",
    "https:///caminho",
    "https://exemplo.com/ com espaço",
    "https://exemplo .com",
    "mailto:",
    "mailto:sem-arroba",
    "mailto:a@b.com?bcc=vitima@x.com&subject=x",
    "mailto:a@b.com#x",
    "tel:",
    "tel:abc",
    "tel:+55 34 9999",
    "#",
    "#com espaço",
    "exemplo.com",
    "www.exemplo.com",
    "",
    " ",
  ];
  for (const value of hostile) {
    it(`recusa ${JSON.stringify(value).slice(0, 60)}`, () => {
      expect(isAllowedHref(value)).toBe(false);
    });
  }

  it("recusa valores que não são texto", () => {
    for (const value of [null, undefined, 1, {}, [], ["https://a.com"], true]) {
      expect(isAllowedHref(value)).toBe(false);
    }
  });

  it("recusa endereço acima de 2048 caracteres", () => {
    expect(isAllowedHref("https://exemplo.com/" + "a".repeat(2028))).toBe(true);
    expect(isAllowedHref("https://exemplo.com/" + "a".repeat(2029))).toBe(false);
  });
});

describe("isExternalHref", () => {
  it("só http(s) absoluto é externo", () => {
    expect(isExternalHref("https://a.com")).toBe(true);
    expect(isExternalHref("HTTP://a.com")).toBe(true);
    for (const value of ["/blog", "#x", "mailto:a@b.com", "tel:+5534999999999"]) {
      expect(isExternalHref(value)).toBe(false);
    }
  });
});
