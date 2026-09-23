import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { submitLead, type SubmitLeadInput } from "@/features/conversion/application/submit-lead";
import { mintFormToken } from "@/server/security/form-token";
import { createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Pipeline de lead (docs/03, parte 22): honeypot, token de tempo mínimo, rate limit, validação,
 * dedupe e a heurística de spam por link. Usa `submitLead` direto (não o wrapper `*ForRoute`,
 * que só existe para ligar ao banco de produção) com um `formToken` "velho o bastante" simulado
 * via `now` passado para `mintFormToken`/verificação — o teste não espera 2,5s de verdade.
 */
const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

beforeAll(async () => {
  await fx.cleanup();
});
afterEach(async () => {
  await q("delete from leads where email like $1", ["%@dom-it.example.test"]);
  await q("delete from rate_limits where key like 'lead:%'");
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

/** Token válido: mintado 3s no passado, dentro da janela [2.5s, 1h] que `submitLead` exige. */
function validToken(): string {
  return mintFormToken(new Date(Date.now() - 3_000));
}

// IP único por chamada (contador, não sorteio): nenhum teste de submissão única esbarra sem
// querer no limite de 5/15min por IP só por rodar depois de outro no mesmo arquivo.
let nextIp = 1;
function freshIp(): string {
  const n = nextIp++;
  return `203.0.114.${n % 254 || 1}`;
}

const input = (over: Partial<SubmitLeadInput> = {}): SubmitLeadInput => ({
  name: "Pessoa de Teste",
  email: `${uniq("lead-")}@dom-it.example.test`,
  message: "Preciso de ajuda com a gestão financeira da minha empresa.",
  phone: undefined,
  company: undefined,
  jobTitle: undefined,
  segment: undefined,
  website: undefined,
  consent: true,
  honeypot: "",
  formToken: validToken(),
  ip: freshIp(),
  ...over,
});

async function countLeads(email: string): Promise<number> {
  const rows = await q("select 1 from leads where email = $1", [email]);
  return rows.length;
}

describe("submitLead", () => {
  it("honeypot preenchido: finge sucesso e não grava nada", async () => {
    const data = input({ honeypot: "sou um robô" });
    const result = await submitLead(deps, data);
    expect(result).toEqual({ ok: true });
    expect(await countLeads(data.email)).toBe(0);
  });

  it("token de tempo mínimo ausente/inválido → VALIDATION", async () => {
    await expect(submitLead(deps, input({ formToken: "lixo" }))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token mintado agora mesmo (envio rápido demais) → VALIDATION", async () => {
    await expect(submitLead(deps, input({ formToken: mintFormToken() }))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token velho demais (formulário aberto há mais de 1h) → VALIDATION", async () => {
    const old = mintFormToken(new Date(Date.now() - 2 * 60 * 60 * 1000));
    await expect(submitLead(deps, input({ formToken: old }))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("sem consentimento → VALIDATION", async () => {
    await expect(submitLead(deps, input({ consent: false }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { consent: expect.any(Array) },
    });
  });

  it("e-mail inválido → VALIDATION", async () => {
    await expect(submitLead(deps, input({ email: "não-é-um-email" }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { email: expect.any(Array) },
    });
  });

  it("grava o lead válido", async () => {
    const data = input();
    const result = await submitLead(deps, data);
    expect(result).toEqual({ ok: true });
    const rows = await q<{ status: string; consent_version: string }>(
      "select status, consent_version from leads where email = $1",
      [data.email],
    );
    expect(rows[0]?.status).toBe("NEW");
    expect(rows[0]?.consent_version).toBeTruthy();
  });

  it("dedupe: mesmo e-mail + mesma mensagem em seguida não grava de novo", async () => {
    const data = input();
    await submitLead(deps, data);
    const second = await submitLead(deps, { ...data, formToken: validToken() });
    expect(second).toEqual({ ok: true });
    expect(await countLeads(data.email)).toBe(1);
  });

  it("mensagem com muitos links vira SPAM automaticamente e não bloqueia o envio", async () => {
    const data = input({
      message: "Veja http://a.test http://b.test http://c.test http://d.test",
    });
    await submitLead(deps, data);
    const rows = await q<{ status: string }>("select status from leads where email = $1", [
      data.email,
    ]);
    expect(rows[0]?.status).toBe("SPAM");
  });

  it("rate limit por e-mail: 4ª tentativa na mesma janela é recusada", async () => {
    const email = `${uniq("lead-")}@dom-it.example.test`;
    // IPs distintos e fixos: isola do rate limit por IP, sem depender de sorteio.
    for (let i = 0; i < 3; i++) {
      await submitLead(
        deps,
        input({
          email,
          ip: `203.0.113.${10 + i}`,
          message: `Mensagem número ${i} para não cair no dedupe.`,
        }),
      );
    }
    await expect(
      submitLead(deps, input({ email, ip: "203.0.113.13", message: "Mensagem número 4." })),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("rate limit por IP: 6ª tentativa na mesma janela é recusada, mesmo com e-mails diferentes", async () => {
    const ip = "203.0.113.250";
    for (let i = 0; i < 5; i++) {
      await submitLead(deps, input({ ip, message: `Mensagem ${i} de origens diferentes.` }));
    }
    await expect(
      submitLead(deps, input({ ip, message: "Mais uma mensagem." })),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("sem IP (nenhum cabeçalho de proxy): não quebra, só não aplica limite por IP", async () => {
    const result = await submitLead(deps, input({ ip: null }));
    expect(result).toEqual({ ok: true });
  });
});
