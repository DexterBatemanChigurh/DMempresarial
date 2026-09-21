import { describe, expect, it } from "vitest";
import { createLogger, redact, type LogLevel } from "./logger";

function capture(level: LogLevel = "debug") {
  const lines: { level: LogLevel; entry: Record<string, unknown> }[] = [];
  const logger = createLogger({
    level,
    now: () => new Date("2026-01-02T03:04:05.000Z"),
    sink: (lvl, line) => lines.push({ level: lvl, entry: JSON.parse(line) }),
  });
  return { logger, lines };
}

describe("logger", () => {
  it("emite uma linha JSON estruturada com hora, nível e mensagem", () => {
    const { logger, lines } = capture();
    logger.info("lead.created", { leadId: "abc" });
    expect(lines).toHaveLength(1);
    expect(lines[0]?.entry).toMatchObject({
      time: "2026-01-02T03:04:05.000Z",
      level: "info",
      msg: "lead.created",
      leadId: "abc",
    });
  });

  it("respeita o nível mínimo", () => {
    const { logger, lines } = capture("warn");
    logger.debug("d");
    logger.info("i");
    logger.warn("w");
    logger.error("e");
    expect(lines.map((l) => l.level)).toEqual(["warn", "error"]);
  });

  it("child herda vínculos (ex.: requestId) sem alterar o pai", () => {
    const { logger, lines } = capture();
    logger.child({ requestId: "r1" }).info("a");
    logger.info("b");
    expect(lines[0]?.entry.requestId).toBe("r1");
    expect(lines[1]?.entry.requestId).toBeUndefined();
  });

  it("não deixa campos do usuário sobrescreverem msg, level e time", () => {
    const { logger, lines } = capture();
    logger.info("real", { msg: "falso", level: "error", time: "falso" });
    expect(lines[0]?.entry).toMatchObject({
      msg: "real",
      level: "info",
      time: "2026-01-02T03:04:05.000Z",
    });
  });
});

describe("redact", () => {
  it("oculta valores de chaves sensíveis em qualquer profundidade", () => {
    const out = redact({
      user: "ana",
      password: "123",
      nested: { apiKey: "k", Authorization: "Bearer x", session_token: "t", ok: 1 },
      lista: [{ cookie: "c", nome: "n" }],
    }) as Record<string, unknown>;
    expect(JSON.stringify(out)).not.toMatch(/123|Bearer x|"k"|"t"|"c"/);
    expect(out.user).toBe("ana");
    expect((out.nested as Record<string, unknown>).ok).toBe(1);
  });

  it("oculta a senha dentro de URLs em texto livre", () => {
    const out = redact("falha em postgres://dono:senha-secreta@host:5432/db ao conectar") as string;
    expect(out).not.toContain("senha-secreta");
    expect(out).toContain("postgres://dono:[redacted]@host");
  });

  it("serializa Error sem vazar segredo na mensagem, na causa ou no stack", () => {
    const error = new Error("erro em postgres://u:segredo1@h/db", {
      cause: new Error("token=segredo2 em https://a:segredo3@b"),
    });
    const text = JSON.stringify(redact(error));
    expect(text).not.toMatch(/segredo1|segredo3/);
    expect(text).toContain("Error");
  });

  it("não quebra com referência circular, bigint nem Date", () => {
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;
    expect(() => JSON.stringify(redact({ circular, n: 10n, d: new Date(0) }))).not.toThrow();
    expect((redact({ n: 10n }) as { n: string }).n).toBe("10");
  });

  it("trunca estruturas muito profundas", () => {
    let deep: Record<string, unknown> = { fim: true };
    for (let i = 0; i < 20; i++) deep = { filho: deep };
    expect(JSON.stringify(redact(deep))).toContain("[truncated]");
  });
});
