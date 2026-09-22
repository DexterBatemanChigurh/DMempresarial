import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createLocalStoragePort, readLocalStorageFile } from "./local";

const VALID_KEY = "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp";

let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "dm-storage-"));
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe("createLocalStoragePort: caminho feliz", () => {
  it("grava, lê de volta (via readLocalStorageFile) e remove", async () => {
    const storage = createLocalStoragePort(dir);
    const bytes = Buffer.from("conteúdo de teste");
    await storage.put(VALID_KEY, bytes, "image/webp");

    expect(await readLocalStorageFile(dir, VALID_KEY)).toEqual(bytes);
    await storage.remove(VALID_KEY);
    await expect(readLocalStorageFile(dir, VALID_KEY)).rejects.toThrow();
  });

  it("cria os subdiretórios de ano/mês automaticamente", async () => {
    const storage = createLocalStoragePort(dir);
    await storage.put(VALID_KEY, Buffer.from("x"), "image/webp");
    expect(
      await readFile(join(dir, "2026", "09", "0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp")),
    ).toEqual(Buffer.from("x"));
  });

  it("publicUrl é só /media/<chave>", () => {
    expect(createLocalStoragePort(dir).publicUrl(VALID_KEY)).toBe(`/media/${VALID_KEY}`);
  });

  it("remover arquivo inexistente não é erro (idempotente)", async () => {
    await expect(createLocalStoragePort(dir).remove(VALID_KEY)).resolves.toBeUndefined();
  });
});

describe("createLocalStoragePort: chaves recusadas (nunca tocam o disco fora de `dir`)", () => {
  const storage = () => createLocalStoragePort(dir);

  const hostileKeys = [
    "../../../etc/passwd",
    "../../etc/passwd.webp",
    "2026/09/../../../etc/passwd.webp",
    "/etc/passwd",
    "2026/09/arquivo.webp/../../../etc/passwd",
    "2026/13/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp", // mês inválido
    "2026/00/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp", // mês inválido
    "26/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp", // ano com 2 dígitos
    "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.jpg", // extensão errada
    "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp.jpg",
    "2026/09/script.php.webp",
    "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.WEBP", // caixa alta
    "",
    "2026/09/",
    "2026/09/0f3c5a1e-8b2d-4c6f-9a17-2d4e6f8a0b1c.webp\u0000.php",
  ];

  for (const key of hostileKeys) {
    it(`recusa put() com chave: ${JSON.stringify(key)}`, async () => {
      await expect(storage().put(key, Buffer.from("x"), "image/webp")).rejects.toThrow(/inválida/);
    });

    it(`recusa remove() com chave: ${JSON.stringify(key)}`, async () => {
      await expect(storage().remove(key)).rejects.toThrow(/inválida/);
    });

    it(`readLocalStorageFile recusa a mesma chave: ${JSON.stringify(key)}`, async () => {
      await expect(readLocalStorageFile(dir, key)).rejects.toThrow(/inválida/);
    });
  }

  it("nenhum arquivo hostil vaza para fora do diretório de armazenamento", async () => {
    const parentMarker = join(dir, "..", "PROVA-DE-VAZAMENTO.txt");
    await rm(parentMarker, { force: true });
    for (const key of hostileKeys) {
      await storage()
        .put(key, Buffer.from("vazou"), "image/webp")
        .catch(() => undefined);
    }
    await expect(readFile(parentMarker)).rejects.toThrow();
  });
});
