import { describe, expect, it } from "vitest";
import { EMPTY_PAYLOAD_HASH, sha256Hex, signRequest } from "./sigv4";

// Credenciais e resultados dos exemplos da documentação da AWS ("Signature Calculations for the
// Authorization Header: Transferring Payload in a Single Chunk", S3 API Reference).
const credentials = {
  accessKeyId: "AKIAIOSFODNN7EXAMPLE",
  secretAccessKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
  region: "us-east-1",
};
const now = new Date("2013-05-24T00:00:00Z");

function signatureOf(authorization: string | undefined): string | undefined {
  return authorization?.match(/Signature=([0-9a-f]{64})$/)?.[1];
}

describe("signRequest (AWS SigV4)", () => {
  it("GET Object — confere com o exemplo oficial", () => {
    const headers = signRequest(
      {
        method: "GET",
        url: new URL("https://examplebucket.s3.amazonaws.com/test.txt"),
        headers: { Range: "bytes=0-9" },
        payloadHash: EMPTY_PAYLOAD_HASH,
        now,
      },
      credentials,
    );
    expect(headers.authorization).toContain(
      "Credential=AKIAIOSFODNN7EXAMPLE/20130524/us-east-1/s3/aws4_request",
    );
    expect(headers.authorization).toContain(
      "SignedHeaders=host;range;x-amz-content-sha256;x-amz-date",
    );
    expect(signatureOf(headers.authorization)).toBe(
      "f0e8bdb87c964420e857bd35b5d6ed310bd44f0170aba48dd91039c6036bdb41",
    );
  });

  it("PUT Object — confere com o exemplo oficial (inclui `$` codificado no caminho)", () => {
    const body = "Welcome to Amazon S3.";
    const payloadHash = sha256Hex(body);
    expect(payloadHash).toBe("44ce7dd67c959e0d3524ffac1771dfbba87d2b6b4b4e99e42034a8b803f8b072");
    const headers = signRequest(
      {
        method: "PUT",
        url: new URL("https://examplebucket.s3.amazonaws.com/test$file.text"),
        headers: {
          Date: "Fri, 24 May 2013 00:00:00 GMT",
          "x-amz-storage-class": "REDUCED_REDUNDANCY",
        },
        payloadHash,
        now,
      },
      credentials,
    );
    expect(headers.authorization).toContain(
      "SignedHeaders=date;host;x-amz-content-sha256;x-amz-date;x-amz-storage-class",
    );
    expect(signatureOf(headers.authorization)).toBe(
      "98ad721746da40c64f1a55b78f14c238d841ea1380cd77a1b5971af0ece108bd",
    );
  });

  it("devolve os cabeçalhos que precisam ir na requisição", () => {
    const headers = signRequest(
      {
        method: "DELETE",
        url: new URL("https://s3.example.test/bucket/2026/09/a.webp"),
        headers: {},
        payloadHash: EMPTY_PAYLOAD_HASH,
        now,
      },
      credentials,
    );
    expect(headers.host).toBe("s3.example.test");
    expect(headers["x-amz-date"]).toBe("20130524T000000Z");
    expect(headers["x-amz-content-sha256"]).toBe(EMPTY_PAYLOAD_HASH);
  });
});
