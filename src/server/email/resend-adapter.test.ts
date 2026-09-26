import { describe, expect, it } from "vitest";
import { createResendEmailPort, EmailDeliveryError } from "./resend-adapter";

function fakeFetch(status: number) {
  const calls: { url: string; init: RequestInit }[] = [];
  const impl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({ url: String(input), init: init ?? {} });
    return new Response("{}", { status });
  }) as typeof fetch;
  return { calls, impl };
}

const config = { apiKey: "re_chave", from: "DM Empresarial <site@exemplo.test>" };

describe("createResendEmailPort", () => {
  it("envia pela API com remetente, destinatário, resposta e cabeçalhos", async () => {
    const { calls, impl } = fakeFetch(200);
    await createResendEmailPort(config, impl).send({
      to: "pessoa@exemplo.test",
      subject: "Assunto",
      text: "Corpo",
      replyTo: "lead@exemplo.test",
      headers: { "List-Unsubscribe": "<https://exemplo.test/x>" },
    });
    const [call] = calls;
    expect(call?.url).toBe("https://api.resend.com/emails");
    expect((call?.init.headers as Record<string, string>).authorization).toBe("Bearer re_chave");
    expect(JSON.parse(String(call?.init.body))).toEqual({
      from: config.from,
      to: ["pessoa@exemplo.test"],
      subject: "Assunto",
      text: "Corpo",
      reply_to: "lead@exemplo.test",
      headers: { "List-Unsubscribe": "<https://exemplo.test/x>" },
    });
  });

  it("resposta de erro vira EmailDeliveryError sem o corpo da mensagem", async () => {
    const port = createResendEmailPort(config, fakeFetch(422).impl);
    const error = await port
      .send({ to: "a@b.test", subject: "s", text: "mensagem pessoal do lead" })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(EmailDeliveryError);
    expect(String((error as Error).message)).not.toContain("mensagem pessoal");
  });
});
