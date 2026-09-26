import { createHash, createHmac } from "node:crypto";

/**
 * Assinatura AWS Signature Version 4 (cabeçalho `Authorization`), o suficiente para o adaptador
 * S3-compatível (AWS S3, Cloudflare R2, MinIO, Backblaze B2...). Sem SDK: três operações
 * (PUT/GET/DELETE de um objeto) não justificam uma dependência de vários megabytes.
 * Conferido contra os exemplos publicados na documentação da AWS (ver `sigv4.test.ts`).
 */

export type SigV4Credentials = {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service?: string;
};

export type SigV4Request = {
  method: string;
  url: URL;
  /** Cabeçalhos que entram na assinatura (além de `host`, que vem da URL). */
  headers: Record<string, string>;
  /** Hash hex do corpo, ou `UNSIGNED-PAYLOAD`. */
  payloadHash: string;
  now?: Date;
};

export const EMPTY_PAYLOAD_HASH = sha256Hex("");

export function sha256Hex(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmac(key: string | Buffer, data: string): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

/** RFC 3986, como a AWS exige: só `A-Za-z0-9-._~` ficam sem codificar. */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** No S3 cada segmento do caminho é codificado uma única vez; as barras ficam. */
function canonicalPath(pathname: string): string {
  return pathname
    .split("/")
    .map((segment) => encodeRfc3986(decodeURIComponent(segment)))
    .join("/");
}

function canonicalQuery(params: URLSearchParams): string {
  return [...params.entries()]
    .map(([k, v]) => [encodeRfc3986(k), encodeRfc3986(v)] as const)
    .sort(([a, av], [b, bv]) => (a === b ? (av < bv ? -1 : 1) : a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
}

/** `20130524T000000Z` */
export function amzDate(now: Date): string {
  return now.toISOString().replace(/[:-]|\.\d{3}/g, "");
}

/**
 * Devolve os cabeçalhos a enviar: os recebidos + `host`, `x-amz-date`, `x-amz-content-sha256` e
 * `authorization`.
 */
export function signRequest(
  request: SigV4Request,
  credentials: SigV4Credentials,
): Record<string, string> {
  const service = credentials.service ?? "s3";
  const timestamp = amzDate(request.now ?? new Date());
  const day = timestamp.slice(0, 8);

  const headers: Record<string, string> = {};
  for (const [name, value] of Object.entries(request.headers)) {
    headers[name.toLowerCase()] = value.trim().replace(/\s+/g, " ");
  }
  headers.host = request.url.host;
  headers["x-amz-date"] = timestamp;
  headers["x-amz-content-sha256"] = request.payloadHash;

  const names = Object.keys(headers).sort();
  const signedHeaders = names.join(";");
  const canonicalHeaders = names.map((name) => `${name}:${headers[name]}\n`).join("");

  const canonicalRequest = [
    request.method.toUpperCase(),
    canonicalPath(request.url.pathname),
    canonicalQuery(request.url.searchParams),
    canonicalHeaders,
    signedHeaders,
    request.payloadHash,
  ].join("\n");

  const scope = `${day}/${credentials.region}/${service}/aws4_request`;
  const stringToSign = ["AWS4-HMAC-SHA256", timestamp, scope, sha256Hex(canonicalRequest)].join(
    "\n",
  );

  const signingKey = hmac(
    hmac(hmac(hmac(`AWS4${credentials.secretAccessKey}`, day), credentials.region), service),
    "aws4_request",
  );
  const signature = createHmac("sha256", signingKey).update(stringToSign).digest("hex");

  return {
    ...headers,
    authorization: `AWS4-HMAC-SHA256 Credential=${credentials.accessKeyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
  };
}
