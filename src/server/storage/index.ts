import "server-only";
import { env } from "@/server/env";
import { createLocalStoragePort } from "./local";
import { createS3StoragePort } from "./s3";
import type { StoragePort } from "./port";

export type { StoragePort } from "./port";
export { isValidStorageKey, STORAGE_KEY_PATTERN } from "./port";

const globalForStorage = globalThis as unknown as { __dmStorage?: StoragePort };

/** Storage configurado para este ambiente: bucket S3-compatível ou disco local. */
export function getStorage(): StoragePort {
  if (!globalForStorage.__dmStorage) {
    const config = env().STORAGE;
    globalForStorage.__dmStorage =
      config.driver === "s3" ? createS3StoragePort(config) : createLocalStoragePort(config.dir);
  }
  return globalForStorage.__dmStorage;
}
