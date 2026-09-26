/**
 * Interface de storage de arquivos (docs/03, parte 21). O binário nunca fica no Postgres; o
 * banco guarda só os metadados (tabela `media`). Adaptadores: disco local (`local.ts`) e
 * S3-compatível (`s3.ts`); a escolha vem da configuração (`storage/index.ts`).
 */
export type StoragePort = {
  /** Grava os bytes sob `key`. A chave já vem pronta (gerada pelo chamador); nunca aceita `../`. */
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  /** Remove o arquivo. Idempotente: arquivo já ausente não é erro. */
  remove(key: string): Promise<void>;
  /** Lê os bytes (a rota `/media/[...key]` serve a partir daqui). Lança se não existir. */
  read(key: string): Promise<Buffer>;
  /** Caminho público (relativo) pelo qual o arquivo é servido. */
  publicUrl(key: string): string;
};

/** Formato de chave aceito por todo adaptador: `aaaa/mm/<uuid>.webp` (sharp sempre reencoda para webp). */
export const STORAGE_KEY_PATTERN = /^\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f-]{36}\.webp$/;

export function isValidStorageKey(key: string): boolean {
  return STORAGE_KEY_PATTERN.test(key);
}
