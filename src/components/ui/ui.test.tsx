import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import {
  Button,
  CheckboxField,
  Container,
  FormMessage,
  Heading,
  IconButton,
  Section,
  SectionLabel,
  SelectField,
  SkipLink,
  TextareaField,
  TextField,
  TextLink,
} from "./index";

// `next/link` precisa do contexto do roteador; aqui basta uma âncora equivalente.
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) =>
      createElement("a", { href, ...rest }, children),
  };
});

const html = (node: React.ReactElement) => renderToStaticMarkup(node);

describe("Heading", () => {
  it("o nível semântico (as) é independente da aparência (variant)", () => {
    const out = html(
      <Heading as="h2" variant="display-m">
        Título
      </Heading>,
    );
    expect(out).toMatch(/^<h2 /);
    expect(out).toContain("text-display-m");
  });

  it("sem variant, cada nível usa a escala correspondente (h5/h6 usam a de h4)", () => {
    expect(html(<Heading as="h1">x</Heading>)).toContain("text-h1");
    expect(html(<Heading as="h3">x</Heading>)).toContain("text-h3");
    expect(html(<Heading as="h5">x</Heading>)).toContain("text-h4");
  });
});

describe("Button", () => {
  it("é type=button por padrão (não envia formulário sem pedir) e respeita submit", () => {
    expect(html(<Button>Ok</Button>)).toContain('type="button"');
    expect(html(<Button type="submit">Ok</Button>)).toContain('type="submit"');
  });

  it("carregando: desabilita, sinaliza aria-busy, troca o rótulo e mostra indicador decorativo", () => {
    const out = html(
      <Button loading loadingLabel="Enviando…">
        Enviar
      </Button>,
    );
    expect(out).toContain("disabled");
    expect(out).toContain('aria-busy="true"');
    expect(out).toContain("Enviando…");
    expect(out).not.toContain(">Enviar<");
    expect(out).toContain('aria-hidden="true"');
  });

  it("sem carregar, não marca aria-busy", () => {
    expect(html(<Button>Ok</Button>)).not.toContain("aria-busy");
  });

  it("com href renderiza um link (não um botão)", () => {
    const out = html(<Button href="/contato">Fale com a DM</Button>);
    expect(out).toMatch(/^<a /);
    expect(out).toContain('href="/contato"');
    expect(out).not.toContain("<button");
  });

  it("variantes: primária usa a cor de ação; terciária tem seta decorativa", () => {
    expect(html(<Button variant="primary">x</Button>)).toContain("bg-action");
    const tertiary = html(<Button variant="tertiary">x</Button>);
    expect(tertiary).toContain("text-link");
    expect(tertiary).toContain('aria-hidden="true"');
  });

  it("alturas de toque: padrão 48 px e mínimo de 40 px só no tamanho compacto", () => {
    expect(html(<Button>x</Button>)).toContain("h-12");
    expect(html(<Button size="lg">x</Button>)).toContain("h-14");
    expect(html(<Button size="sm">x</Button>)).toContain("h-10");
  });
});

describe("IconButton", () => {
  it("sempre tem nome acessível e alvo de 44 px", () => {
    const out = html(<IconButton label="Fechar menu">x</IconButton>);
    expect(out).toContain('aria-label="Fechar menu"');
    expect(out).toContain("size-11");
    expect(out).toContain('type="button"');
  });
});

describe("TextField (contrato de acessibilidade dos campos)", () => {
  it("rótulo visível associado ao campo por for/id; name padrão = id", () => {
    const out = html(<TextField id="nome" label="Nome" />);
    expect(out).toContain('<label for="nome"');
    expect(out).toContain('id="nome"');
    expect(out).toContain('name="nome"');
  });

  it("sem erro: sem aria-invalid e sem aria-describedby", () => {
    const out = html(<TextField id="nome" label="Nome" />);
    expect(out).not.toContain("aria-invalid");
    expect(out).not.toContain("aria-describedby");
  });

  it("com erro: aria-invalid, erro ligado por aria-describedby, role=alert e ícone decorativo", () => {
    const out = html(<TextField id="email" label="E-mail" error="Confira o e-mail." />);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('aria-describedby="email-error"');
    expect(out).toMatch(/<p id="email-error" role="alert"/);
    expect(out).toContain("Confira o e-mail.");
    expect(out).toContain('aria-hidden="true"');
  });

  it("dica e erro juntos: ambos em aria-describedby, dica primeiro", () => {
    const out = html(<TextField id="a" label="A" hint="Ajuda" error="Erro" />);
    expect(out).toContain('aria-describedby="a-hint a-error"');
    expect(out).toContain('id="a-hint"');
  });

  it("obrigatório vem escrito (não só asterisco) e marca o atributo required", () => {
    const out = html(<TextField id="a" label="Nome" required />);
    expect(out).toContain("(obrigatório)");
    expect(out).toContain("required");
  });

  it("campo desabilitado e tipo repassados; altura de 48 px", () => {
    const out = html(<TextField id="a" label="A" type="email" disabled />);
    expect(out).toContain('type="email"');
    expect(out).toContain("disabled");
    expect(out).toContain("h-12");
  });
});

describe("TextareaField e SelectField", () => {
  it("textarea segue o mesmo contrato (rótulo, erro e ligação)", () => {
    const out = html(<TextareaField id="msg" label="Mensagem" error="Escreva algo." />);
    expect(out).toContain('<label for="msg"');
    expect(out).toContain('aria-describedby="msg-error"');
    expect(out).toContain("<textarea");
  });

  it("select renderiza a opção vazia primeiro e depois as opções", () => {
    const out = html(
      <SelectField
        id="seg"
        label="Segmento"
        placeholder="Selecione"
        options={[
          { value: "a", label: "Opção A" },
          { value: "b", label: "Opção B" },
        ]}
      />,
    );
    expect(out.indexOf("Selecione")).toBeLessThan(out.indexOf("Opção A"));
    expect(out.indexOf("Opção A")).toBeLessThan(out.indexOf("Opção B"));
    expect(out).toContain('<option value="">');
  });
});

describe("CheckboxField", () => {
  it("o rótulo envolve o controle (alvo de toque amplo) e aceita link no texto", () => {
    const out = html(
      <CheckboxField id="aceite" required>
        Aceito a <TextLink href="/politica-de-privacidade">Política</TextLink>
      </CheckboxField>,
    );
    expect(out).toMatch(/<label for="aceite"[^>]*min-h-11/);
    expect(out).toContain('type="checkbox"');
    expect(out).toContain("(obrigatório)");
    expect(out).toContain('href="/politica-de-privacidade"');
  });

  it("erro fica ligado ao controle", () => {
    const out = html(
      <CheckboxField id="aceite" error="É preciso aceitar.">
        Aceito
      </CheckboxField>,
    );
    expect(out).toContain('aria-invalid="true"');
    expect(out).toContain('aria-describedby="aceite-error"');
  });
});

describe("TextLink", () => {
  it("caminho interno: sem abrir nova aba", () => {
    const out = html(<TextLink href="/sobre">Sobre</TextLink>);
    expect(out).not.toContain("target=");
  });

  it("endereço externo: nova aba com noopener noreferrer e aviso para leitor de tela", () => {
    const out = html(<TextLink href="https://example.test">Site</TextLink>);
    expect(out).toContain('target="_blank"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain("abre em nova aba");
  });

  it("mailto e tel não abrem nova aba", () => {
    for (const href of ["mailto:a@example.test", "tel:+5500000000000"]) {
      const out = html(<TextLink href={href}>x</TextLink>);
      expect(out).not.toContain("target=");
      expect(out).not.toContain("abre em nova aba");
    }
  });
});

describe("FormMessage", () => {
  it("erro é anunciado na hora; sucesso e informação de forma educada; ícone sempre decorativo", () => {
    const error = html(<FormMessage tone="error" title="Falhou" />);
    const success = html(<FormMessage tone="success" title="Enviado" />);
    const info = html(<FormMessage tone="info">Aviso</FormMessage>);
    expect(error).toContain('role="alert"');
    expect(success).toContain('role="status"');
    expect(info).toContain('role="status"');
    for (const out of [error, success, info]) expect(out).toContain('aria-hidden="true"');
  });
});

describe("Section, Container, SectionLabel e SkipLink", () => {
  it("faixa escura e de apoio marcam data-tone; a padrão não marca", () => {
    expect(html(<Section tone="dark">x</Section>)).toContain('data-tone="dark"');
    expect(html(<Section tone="muted">x</Section>)).toContain('data-tone="muted"');
    expect(html(<Section>x</Section>)).not.toContain("data-tone");
  });

  it("espaçamento vertical usa a escala nomeada", () => {
    expect(html(<Section>x</Section>)).toContain("py-3xl");
    expect(html(<Section spacing="loose">x</Section>)).toContain("py-4xl");
  });

  it("container escolhe a largura pelo nome (texto corrido = leitura)", () => {
    expect(html(<Container>x</Container>)).toContain("max-w-content");
    expect(html(<Container size="reading">x</Container>)).toContain("max-w-reading");
    expect(html(<Container size="narrow">x</Container>)).toContain("max-w-narrow");
  });

  it("SectionLabel: filete forte e caixa alta (só onde a marca permite)", () => {
    const out = html(<SectionLabel>Cores</SectionLabel>);
    expect(out).toContain("border-border-strong");
    expect(out).toContain("uppercase");
  });

  it("SkipLink aponta para o conteúdo principal", () => {
    expect(html(<SkipLink />)).toContain('href="#conteudo"');
    expect(html(<SkipLink targetId="principal" />)).toContain('href="#principal"');
  });
});
