import "server-only";
import { EMPTY_PAYLOAD_HASH, sha256Hex, signRequest, type SigV4Credentials } from "./sigv4";
import { isValidStorageKey, type StoragePort } from "./port";

/**
 * Adaptador S3-compatível (AWS S3, Cloudflare R2, MinIO, Backblaze B2...). Endereçamento por
 * caminho (`<endpoint>/<bucket>/<chave>`), aceito por todos esses provedores. O bucket pode (e
 * deve) ser PRIVADO: os arquivos continuam sendo servidos por `/media/[...key]`, que só entrega
 * mídia `READY` — então nem a CSP nem as URLs já gravadas no conteúdo mudam com o provedor.
 */
export type S3Config = SigV4Credentials & { endpoint: string; bucket: string };

const TIMEOUT_MS = 15_000;

export class StorageRequestError extends Error {
  constructor(
    readonly operation: string,
    readonly status: number,
  ) {
    super(`Storage S3: ${operation} respondeu ${status}.`);
    this.name = "StorageRequestError";
  }
}

export function createS3StoragePort(
  config: S3Config,
  fetchImpl: typeof fetch = fetch,
): StoragePort {
  const base = config.endpoint.replace(/\/+$/, "");

  function objectUrl(key: string): URL {
    if (!isValidStorageKey(key)) throw new Error(`Chave de storage inválida: ${key}`);
    return new URL(`${base}/${encodeURIComponent(config.bucket)}/${key}`);
  }

  async function send(
    method: "PUT" | "GET" | "DELETE",
    key: string,
    body?: Buffer,
    contentType?: string,
  ): Promise<Response> {
    const url = objectUrl(key);
    const headers = signRequest(
      {
        method,
        url,
        headers: contentType ? { "content-type": contentType } : {},
        payloadHash: body ? sha256Hex(body) : EMPTY_PAYLOAD_HASH,
      },
      config,
    );
    // `host` é calculado pelo próprio fetch a partir da URL.
    delete headers.host;
    return fetchImpl(url, {
      method,
      headers,
      body: body ? new Uint8Array(body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  }

  return {
    async put(key, bytes, contentType) {
      const response = await send("PUT", key, bytes, contentType);
      if (!response.ok) throw new StorageRequestError("put", response.status);
    },
    async remove(key) {
      const response = await send("DELETE", key);
      // 404: já não existia — remoção é idempotente.
      if (!response.ok && response.status !== 404) {
        throw new StorageRequestError("remove", response.status);
      }
    },
    async read(key) {
      const response = await send("GET", key);
      if (!response.ok) throw new StorageRequestError("read", response.status);
      return Buffer.from(await response.arrayBuffer());
    },
    publicUrl(key) {
      return `/media/${key}`;
    },
  };
}
