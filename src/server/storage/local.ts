import "server-only";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { isValidStorageKey, type StoragePort } from "./port";

/**
 * Adaptador de disco local (desenvolvimento e, se a infraestrutura de deploy tiver disco
 * persistente, produção). Toda chave é validada contra `STORAGE_KEY_PATTERN` antes de tocar o
 * sistema de arquivos, e o caminho resolvido é conferido contra `root`: como a chave nunca contém
 * `..` nem barra inicial, isso nunca deveria falhar, mas é defesa em profundidade — se algum dia
 * a validação de formato mudar, o escape de diretório ainda é barrado aqui.
 */
function resolveWithin(root: string, key: string): string {
  if (!isValidStorageKey(key)) throw new Error(`Chave de storage inválida: ${key}`);
  const full = resolve(root, key);
  if (full !== root && !full.startsWith(root + sep)) {
    throw new Error(`Chave de storage fora do diretório de armazenamento: ${key}`);
  }
  return full;
}

export function createLocalStoragePort(baseDir: string): StoragePort {
  const root = resolve(baseDir);
  return {
    async put(key, bytes) {
      const filePath = resolveWithin(root, key);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, bytes);
    },
    async remove(key) {
      await rm(resolveWithin(root, key), { force: true });
    },
    publicUrl(key) {
      return `/media/${key}`;
    },
  };
}

/**
 * Leitura direta, para o Route Handler que serve `/media/[...key]`. Fora do `StoragePort` porque
 * a interface pública não precisa de leitura (o servidor lê para responder à requisição, não
 * para reenviar bytes a outra camada da aplicação).
 */
export async function readLocalStorageFile(baseDir: string, key: string): Promise<Buffer> {
  // `async` é essencial aqui: sem ele, uma chave inválida lançaria de forma SÍNCRONA em vez de
  // devolver uma promise rejeitada, e o chamador (Route Handler) precisa poder usar `await`/`catch`.
  return readFile(resolveWithin(resolve(baseDir), key));
}
