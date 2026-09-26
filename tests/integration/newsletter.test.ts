import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  subscribeNewsletter,
  confirmNewsletter,
  unsubscribeNewsletter,
  type SubscribeNewsletterInput,
} from "@/features/conversion/application/newsletter";
import type { EmailMessage } from "@/server/email";
import { mintFormToken } from "@/server/security/form-token";
import {
  createNewsletterConfirmToken,
  createNewsletterUnsubscribeToken,
} from "@/server/security/signed-token";
import { createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

/**
 * Newsletter double-opt-in (docs/03, parte 23):
 * - Cadastro cria PENDING + token de confirmação (hash no banco, token no e-mail)
 * - Confirmação pelo link do e-mail (`/newsletter/confirmacao?token=...`, depois um POST)
 * - Descadastro por token assinado (`/newsletter/descadastro?token=...`)
 */
const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
// Porta de e-mail que guarda as mensagens: o token de confirmação só existe no e-mail.
const sent: EmailMessage[] = [];
const deps = {
  db: handle.db,
  email: {
    async send(message: EmailMessage) {
      sent.push(message);
    },
  },
};
const { q } = fx;

beforeAll(async () => {
  await fx.cleanup();
});
afterEach(async () => {
  sent.length = 0;
  await q("delete from newsletter_subscribers where email like $1", ["%@dom-it.example.test"]);
  await q("delete from rate_limits where key like 'newsletter:%'");
});
afterAll(async () => {
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

function validToken(): string {
  return mintFormToken(new Date(Date.now() - 3_000));
}

let nextIp = 1;
function freshIp(): string {
  const n = nextIp++;
  return `203.0.114.${n % 254 || 1}`;
}

const input = (over: Partial<SubscribeNewsletterInput> = {}): SubscribeNewsletterInput => ({
  email: `${uniq("news-")}@dom-it.example.test`,
  name: "Newsletter Teste",
  consent: true,
  honeypot: "",
  formToken: validToken(),
  ip: freshIp(),
  source: "test",
  ...over,
});

async function countSubscribers(email: string): Promise<number> {
  const rows = await q("select 1 from newsletter_subscribers where email = $1", [email]);
  return rows.length;
}

async function getSubscriber(email: string): Promise<{
  id: string;
  status: string;
  confirm_token_hash: string | null;
  confirm_expires_at: string | null;
} | null> {
  const rows = await q<{
    id: string;
    status: string;
    confirm_token_hash: string | null;
    confirm_expires_at: string | null;
  }>(
    "select id, status, confirm_token_hash, confirm_expires_at from newsletter_subscribers where email = $1",
    [email],
  );
  return rows[0] ?? null;
}

describe("subscribeNewsletter", () => {
  it("honeypot preenchido: finge sucesso e não grava nada", async () => {
    const data = input({ honeypot: "sou um robô" });
    const result = await subscribeNewsletter(deps, data);
    expect(result).toEqual({ ok: true });
    expect(await countSubscribers(data.email)).toBe(0);
  });

  it("token de tempo mínimo ausente/inválido → VALIDATION", async () => {
    await expect(subscribeNewsletter(deps, input({ formToken: "lixo" }))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token mintado agora mesmo (envio rápido demais) → VALIDATION", async () => {
    await expect(
      subscribeNewsletter(deps, input({ formToken: mintFormToken() })),
    ).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token velho demais (formulário aberto há mais de 1h) → VALIDATION", async () => {
    const old = mintFormToken(new Date(Date.now() - 2 * 60 * 60 * 1000));
    await expect(subscribeNewsletter(deps, input({ formToken: old }))).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("sem consentimento → VALIDATION", async () => {
    await expect(subscribeNewsletter(deps, input({ consent: false }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { consent: expect.any(Array) },
    });
  });

  it("e-mail inválido → VALIDATION", async () => {
    await expect(
      subscribeNewsletter(deps, input({ email: "não-é-um-email" })),
    ).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { email: expect.any(Array) },
    });
  });

  it("grava o assinante em PENDING", async () => {
    const data = input();
    const result = await subscribeNewsletter(deps, data);
    expect(result).toEqual({ ok: true });
    const sub = await getSubscriber(data.email);
    expect(sub).not.toBeNull();
    expect(sub?.status).toBe("PENDING");
    expect(sub?.confirm_token_hash).toBeTruthy();
    expect(sub?.confirm_expires_at).toBeTruthy();
  });

  it("idempotente: mesmo e-mail não cria duplicado se já ACTIVE", async () => {
    const data = input();
    await subscribeNewsletter(deps, data);
    // Simula confirmação manual
    await q(
      "update newsletter_subscribers set status = 'ACTIVE', confirmed_at = now(), confirm_token_hash = null, confirm_expires_at = null where email = $1",
      [data.email],
    );
    const second = await subscribeNewsletter(deps, { ...data, formToken: validToken() });
    expect(second).toEqual({ ok: true });
    expect(await countSubscribers(data.email)).toBe(1);
  });

  it("reativa assinante UNSUBSCRIBED com novo consentimento", async () => {
    const data = input();
    await subscribeNewsletter(deps, data);
    // Simula descadastro com created_at antigo o suficiente para passar no dedupe
    await q(
      "update newsletter_subscribers set status = 'UNSUBSCRIBED', unsubscribed_at = now(), created_at = now() - interval '10 minutes' where email = $1",
      [data.email],
    );
    const result = await subscribeNewsletter(deps, { ...data, formToken: validToken() });
    expect(result).toEqual({ ok: true });
    const sub = await getSubscriber(data.email);
    expect(sub?.status).toBe("PENDING");
    expect(sub?.confirm_token_hash).toBeTruthy();
  });

  it("reativa assinante BOUNCED com novo consentimento", async () => {
    const data = input();
    await subscribeNewsletter(deps, data);
    // Simula bounce
    await q(
      "update newsletter_subscribers set status = 'BOUNCED', created_at = now() - interval '10 minutes' where email = $1",
      [data.email],
    );
    const result = await subscribeNewsletter(deps, { ...data, formToken: validToken() });
    expect(result).toEqual({ ok: true });
    const sub = await getSubscriber(data.email);
    expect(sub?.status).toBe("PENDING");
  });

  it("rate limit por e-mail: 4ª tentativa na mesma janela é recusada", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    for (let i = 0; i < 3; i++) {
      await subscribeNewsletter(
        deps,
        input({
          email,
          ip: `203.0.113.${10 + i}`,
        }),
      );
    }
    await expect(
      subscribeNewsletter(deps, input({ email, ip: "203.0.113.13" })),
    ).rejects.toMatchObject({ code: "RATE_LIMITED" });
  });

  it("rate limit por IP: 6ª tentativa na mesma janela é recusada, mesmo com e-mails diferentes", async () => {
    const ip = "203.0.113.250";
    for (let i = 0; i < 5; i++) {
      await subscribeNewsletter(deps, input({ ip }));
    }
    await expect(subscribeNewsletter(deps, input({ ip }))).rejects.toMatchObject({
      code: "RATE_LIMITED",
    });
  });

  it("sem IP (nenhum cabeçalho de proxy): não quebra, só não aplica limite por IP", async () => {
    const result = await subscribeNewsletter(deps, input({ ip: null }));
    expect(result).toEqual({ ok: true });
  });
});

/** Assina e devolve o token que chegou no e-mail de confirmação para `email`. */
async function subscribeAndGetToken(email: string): Promise<string> {
  await subscribeNewsletter(deps, input({ email }));
  const message = sent.findLast((m) => m.to === email);
  const url = message?.text.match(/https?:\/\/\S+/)?.[0];
  expect(url, "o e-mail de confirmação deve trazer o link").toBeTruthy();
  const parsed = new URL(url!);
  expect(parsed.pathname).toBe("/newsletter/confirmacao");
  return parsed.searchParams.get("token")!;
}

describe("confirmNewsletter", () => {
  it("fluxo completo: o link do e-mail confirma a inscrição (PENDING → ACTIVE)", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    const token = await subscribeAndGetToken(email);
    await expect(confirmNewsletter(deps, token)).resolves.toEqual({ ok: true });
    const sub = await getSubscriber(email);
    expect(sub?.status).toBe("ACTIVE");
    expect(sub?.confirm_token_hash).toBeNull();
  });

  it("o mesmo link não confirma duas vezes (uso único)", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    const token = await subscribeAndGetToken(email);
    await confirmNewsletter(deps, token);
    await expect(confirmNewsletter(deps, token)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("token inválido → VALIDATION", async () => {
    await expect(confirmNewsletter(deps, "token-invalido")).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token assinado mas que não é o do e-mail → NOT_FOUND", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    await subscribeAndGetToken(email);
    // Assinatura válida, mas o hash não é o gravado para este assinante.
    const forged = await createNewsletterConfirmToken(email);
    await expect(confirmNewsletter(deps, forged)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("token de descadastro não serve para confirmar (propósito diferente) → VALIDATION", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    await subscribeAndGetToken(email);
    const wrongPurpose = await createNewsletterUnsubscribeToken(email);
    await expect(confirmNewsletter(deps, wrongPurpose)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("prazo vencido no banco → VALIDATION", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    const token = await subscribeAndGetToken(email);
    await q(
      "update newsletter_subscribers set confirm_expires_at = now() - interval '1 hour' where email = $1",
      [email],
    );
    await expect(confirmNewsletter(deps, token)).rejects.toMatchObject({ code: "VALIDATION" });
    expect((await getSubscriber(email))?.status).toBe("PENDING");
  });
});

describe("unsubscribeNewsletter", () => {
  it("assinante ativo sai da lista (ACTIVE → UNSUBSCRIBED)", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    await confirmNewsletter(deps, await subscribeAndGetToken(email));
    const token = await createNewsletterUnsubscribeToken(email);
    await expect(unsubscribeNewsletter(deps, token)).resolves.toEqual({ ok: true });
    expect((await getSubscriber(email))?.status).toBe("UNSUBSCRIBED");
  });

  it("token inválido → VALIDATION", async () => {
    await expect(unsubscribeNewsletter(deps, "token-invalido")).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token de confirmação não serve para descadastrar → VALIDATION", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    const confirmToken = await subscribeAndGetToken(email);
    await expect(unsubscribeNewsletter(deps, confirmToken)).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("token de assinante inexistente → NOT_FOUND", async () => {
    const token = await createNewsletterUnsubscribeToken("naoexiste@teste.test");
    await expect(unsubscribeNewsletter(deps, token)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("já descadastrado → DOMAIN_RULE", async () => {
    const email = `${uniq("news-")}@dom-it.example.test`;
    await confirmNewsletter(deps, await subscribeAndGetToken(email));
    const token = await createNewsletterUnsubscribeToken(email);
    await unsubscribeNewsletter(deps, token);
    await expect(unsubscribeNewsletter(deps, token)).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
  });
});
