/**
 * Interface de storage de arquivos (docs/03, parte 21). O binário nunca fica no Postgres; o
 * banco guarda só os metadados (tabela `media`). Hoje só existe o adaptador de disco local; um
 * adaptador S3-compatível entra quando houver um bucket real para testar contra ele.
 */
export type StoragePort = {
  /** Grava os bytes sob `key`. A chave já vem pronta (gerada pelo chamador); nunca aceita `../`. */
  put(key: string, bytes: Buffer, contentType: string): Promise<void>;
  /** Remove o arquivo. Idempotente: arquivo já ausente não é erro. */
  remove(key: string): Promise<void>;
  /** Caminho público (relativo) pelo qual o arquivo é servido. */
  publicUrl(key: string): string;
};

/** Formato de chave aceito por todo adaptador: `aaaa/mm/<uuid>.webp` (sharp sempre reencoda para webp). */
export const STORAGE_KEY_PATTERN = /^\d{4}\/(0[1-9]|1[0-2])\/[0-9a-f-]{36}\.webp$/;

export function isValidStorageKey(key: string): boolean {
  return STORAGE_KEY_PATTERN.test(key);
}
