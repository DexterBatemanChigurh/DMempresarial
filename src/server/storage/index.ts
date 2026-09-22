import "server-only";
import { env } from "@/server/env";
import { createLocalStoragePort } from "./local";
import type { StoragePort } from "./port";

export type { StoragePort } from "./port";
export { isValidStorageKey, STORAGE_KEY_PATTERN } from "./port";

const globalForStorage = globalThis as unknown as { __dmStorage?: StoragePort };

/** Storage configurado para este ambiente. Hoje sempre o adaptador local. */
export function getStorage(): StoragePort {
  globalForStorage.__dmStorage ??= createLocalStoragePort(env().STORAGE_LOCAL_DIR);
  return globalForStorage.__dmStorage;
}
