import { describe, expect, it } from "vitest";
import { createS3StoragePort, StorageRequestError } from "./s3";

const KEY = "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp";
const config = {
  endpoint: "https://conta.r2.cloudflarestorage.com/",
  bucket: "dm-midia",
  accessKeyId: "id",
  secretAccessKey: "segredo",
  region: "auto",
};

type Call = { url: string; method: string; headers: Record<string, string>; body?: Uint8Array };

function fakeFetch(status = 200, body = "") {
  const calls: Call[] = [];
  const impl = (async (input: URL | RequestInfo, init?: RequestInit) => {
    calls.push({
      url: String(input),
      method: init?.method ?? "GET",
      headers: init?.headers as Record<string, string>,
      body: init?.body as Uint8Array | undefined,
    });
    return new Response(status === 204 ? null : body, { status });
  }) as typeof fetch;
  return { calls, impl };
}

describe("createS3StoragePort", () => {
  it("PUT assinado no endereço <endpoint>/<bucket>/<chave>, com o tipo e o hash do corpo", async () => {
    const { calls, impl } = fakeFetch();
    await createS3StoragePort(config, impl).put(KEY, Buffer.from("abc"), "image/webp");
    const [call] = calls;
    expect(call?.method).toBe("PUT");
    expect(call?.url).toBe(`https://conta.r2.cloudflarestorage.com/dm-midia/${KEY}`);
    expect(call?.headers["content-type"]).toBe("image/webp");
    expect(call?.headers["x-amz-content-sha256"]).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(call?.headers.authorization).toMatch(
      /^AWS4-HMAC-SHA256 Credential=id\/\d{8}\/auto\/s3\/aws4_request, SignedHeaders=content-type;host;x-amz-content-sha256;x-amz-date, Signature=[0-9a-f]{64}$/,
    );
    // O segredo nunca viaja: só a assinatura derivada dele.
    expect(JSON.stringify(call?.headers)).not.toContain("segredo");
  });

  it("GET devolve os bytes; erro do provedor vira StorageRequestError", async () => {
    const ok = fakeFetch(200, "conteudo");
    expect((await createS3StoragePort(config, ok.impl).read(KEY)).toString()).toBe("conteudo");
    const missing = fakeFetch(404);
    await expect(createS3StoragePort(config, missing.impl).read(KEY)).rejects.toBeInstanceOf(
      StorageRequestError,
    );
  });

  it("DELETE é idempotente (404 não é erro), mas 403 é", async () => {
    await expect(createS3StoragePort(config, fakeFetch(404).impl).remove(KEY)).resolves.toBe(
      undefined,
    );
    await expect(createS3StoragePort(config, fakeFetch(403).impl).remove(KEY)).rejects.toThrow(
      /403/,
    );
  });

  it("recusa chave fora do formato antes de qualquer requisição", async () => {
    const { calls, impl } = fakeFetch();
    const port = createS3StoragePort(config, impl);
    for (const key of ["../etc/passwd", "2026/09/x.webp?acl", "2026/09/../../x.webp"]) {
      await expect(port.put(key, Buffer.from("x"), "image/webp")).rejects.toThrow(/inválida/);
      await expect(port.read(key)).rejects.toThrow(/inválida/);
    }
    expect(calls).toHaveLength(0);
  });

  it("a URL pública continua sendo a rota do próprio site (bucket pode ser privado)", () => {
    expect(createS3StoragePort(config, fakeFetch().impl).publicUrl(KEY)).toBe(`/media/${KEY}`);
  });
});
