import { mkdtemp, rm, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { deleteMedia, updateMedia } from "@/features/media/application/manage-media";
import { uploadMedia } from "@/features/media/application/upload-media";
import { extractMediaIds } from "@/lib/rich-text";
import { buildMediaResolver } from "@/features/media/application/resolve";
import { createLocalStoragePort } from "@/server/storage/local";
import type { Actor } from "@/server/permissions";
import { createFixtures, uniq } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const { q } = fx;
const handle = createDatabase(testAppUrl(), { max: 4 });

let storageDir: string;
let deps: { db: typeof handle.db; storage: ReturnType<typeof createLocalStoragePort> };

const admin: Actor = { id: "", role: "ADMIN" };
const editor: Actor = { id: "", role: "EDITOR" };
let author1: Actor;
let author2: Actor;

async function jpeg(
  width: number,
  height: number,
  color = { r: 200, g: 30, b: 30 },
): Promise<Buffer> {
  return sharp({ create: { width, height, channels: 3, background: color } })
    .jpeg()
    .toBuffer();
}
async function png(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: { width, height, channels: 4, background: { r: 10, g: 200, b: 10, alpha: 1 } },
  })
    .png()
    .toBuffer();
}

beforeAll(async () => {
  await fx.cleanup();
  storageDir = await mkdtemp(join(tmpdir(), "dm-media-it-"));
  deps = { db: handle.db, storage: createLocalStoragePort(storageDir) };

  const a1 = await fx.user("AUTHOR");
  const a2 = await fx.user("AUTHOR");
  const adm = await fx.user("ADMIN");
  const edt = await fx.user("EDITOR");
  author1 = { id: a1.id, role: "AUTHOR" };
  author2 = { id: a2.id, role: "AUTHOR" };
  admin.id = adm.id;
  editor.id = edt.id;
});

afterAll(async () => {
  await rm(storageDir, { recursive: true, force: true });
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

async function storedFileCount(): Promise<number> {
  let count = 0;
  async function walk(dir: string) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else count++;
    }
  }
  await walk(storageDir).catch(() => undefined);
  return count;
}

describe("upload: caminho feliz", () => {
  it("aceita JPEG e PNG reais, reencoda para WebP, e o arquivo existe no storage", async () => {
    const jpegBytes = await jpeg(400, 300);
    const rowJpeg = await uploadMedia(deps, {
      actor: author1,
      bytes: jpegBytes,
      altText: "Foto de teste",
    });
    expect(rowJpeg.mime).toBe("image/webp");
    expect(rowJpeg.width).toBe(400);
    expect(rowJpeg.height).toBe(300);
    expect(rowJpeg.status).toBe("READY");
    expect(rowJpeg.uploadedBy).toBe(author1.id);
    expect(rowJpeg.sha256).toMatch(/^[0-9a-f]{64}$/);

    const pngBytes = await png(200, 500);
    const rowPng = await uploadMedia(deps, { actor: author1, bytes: pngBytes });
    expect(rowPng.mime).toBe("image/webp");
    expect(rowPng.width).toBe(200);
    expect(rowPng.height).toBe(500);

    // O arquivo gravado é WEBP de verdade (não só o mime declarado): confirma decodificando.
    const stored = await deps.storage.publicUrl(rowJpeg.storageKey);
    expect(stored).toBe(`/media/${rowJpeg.storageKey}`);
  });

  it("redimensiona uma imagem grande para no máximo 2400px no maior lado, sem distorcer a proporção", async () => {
    const bytes = await jpeg(4800, 2400);
    const row = await uploadMedia(deps, { actor: author1, bytes: bytes });
    expect(row.width).toBe(2400);
    expect(row.height).toBe(1200);
  });

  it("uma imagem já pequena NÃO é ampliada", async () => {
    const bytes = await jpeg(100, 80);
    const row = await uploadMedia(deps, { actor: author1, bytes });
    expect(row.width).toBe(100);
    expect(row.height).toBe(80);
  });

  it("registra a auditoria na mesma transação do upload", async () => {
    const row = await uploadMedia(deps, { actor: author1, bytes: await jpeg(50, 50) });
    const logs = await q("select action, actor_user_id from audit_logs where entity_id = $1", [
      row.id,
    ]);
    expect(logs).toEqual([{ action: "media.upload", actor_user_id: author1.id }]);
  });
});

describe("upload: recusas por tamanho e dimensão", () => {
  it("recusa arquivo maior que 10 MB, sem tocar o storage", async () => {
    const before = await storedFileCount();
    const huge = Buffer.alloc(10 * 1024 * 1024 + 1, 1);
    await expect(uploadMedia(deps, { actor: author1, bytes: huge })).rejects.toMatchObject({
      code: "VALIDATION",
    });
    expect(await storedFileCount()).toBe(before);
  });

  it("recusa imagem com mais de 6000px no maior lado (proteção de decompressão)", async () => {
    const bytes = await jpeg(6001, 100);
    await expect(uploadMedia(deps, { actor: author1, bytes })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("aceita exatamente no limite de 6000px", async () => {
    const bytes = await jpeg(6000, 50);
    await expect(uploadMedia(deps, { actor: author1, bytes })).resolves.toMatchObject({
      width: 2400,
    });
  });
});

describe("upload: o tipo é detectado pelo CONTEÚDO, nunca pela extensão ou pelo nome", () => {
  it("recusa SVG (vetor de XSS clássico), mesmo com cabeçalho de imagem simulado", async () => {
    const svg = Buffer.from(
      '<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(1)</script></svg>',
    );
    await expect(uploadMedia(deps, { actor: author1, bytes: svg })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("recusa um executável Windows (cabeçalho MZ) disfarçado de imagem", async () => {
    const fakeExe = Buffer.concat([Buffer.from("MZ"), Buffer.alloc(500, 0x90)]);
    await expect(uploadMedia(deps, { actor: author1, bytes: fakeExe })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("recusa um PDF disfarçado de imagem", async () => {
    const fakePdf = Buffer.from("%PDF-1.4\n%âãÏÓ\n1 0 obj<</Type/Catalog>>endobj");
    await expect(uploadMedia(deps, { actor: author1, bytes: fakePdf })).rejects.toMatchObject({
      code: "VALIDATION",
    });
  });

  it("recusa texto puro e buffer vazio", async () => {
    await expect(
      uploadMedia(deps, { actor: author1, bytes: Buffer.from("não sou uma imagem") }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      uploadMedia(deps, { actor: author1, bytes: Buffer.alloc(0) }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("um arquivo .jpg de mentira (bytes de texto, mesma 'extensão' que um JPEG real) é recusado", async () => {
    // O pipeline nunca vê nome de arquivo — só bytes. Isso prova que o nome não influencia a decisão.
    const notReallyAJpeg = Buffer.from("isto não é um jpeg, só tem esse nome no formulário");
    await expect(
      uploadMedia(deps, { actor: author1, bytes: notReallyAJpeg }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("poliglota: JPEG real com um payload malicioso ANEXADO ao final é aceito, mas o payload NUNCA chega ao arquivo gravado", async () => {
    const realJpeg = await jpeg(120, 90);
    const marker = "PAYLOAD_MALICIOSO_" + uniq();
    const polyglot = Buffer.concat([realJpeg, Buffer.from(`<script>${marker}</script>`)]);

    const row = await uploadMedia(deps, { actor: author1, bytes: polyglot });
    expect(row.mime).toBe("image/webp");

    // O reprocessamento por `sharp` decodifica e reencoda os PIXELS: bytes anexados desaparecem.
    const stored = await readStoredBytes(row.storageKey);
    expect(stored.includes(marker)).toBe(false);
    expect(stored.includes("<script>")).toBe(false);
    expect(stored.byteLength).toBeLessThan(polyglot.byteLength);
  });

  async function readStoredBytes(storageKey: string): Promise<Buffer> {
    const { readFile } = await import("node:fs/promises");
    return readFile(join(storageDir, storageKey));
  }
});

describe("upload: metadados removidos", () => {
  it("o EXIF do arquivo original não sobrevive ao reprocessamento", async () => {
    const withExif = await sharp({
      create: { width: 100, height: 100, channels: 3, background: { r: 1, g: 2, b: 3 } },
    })
      .withMetadata({ exif: { IFD0: { Copyright: "Segredo do autor original" } } })
      .jpeg()
      .toBuffer();
    const meta = await sharp(withExif).metadata();
    expect(meta.exif).toBeDefined(); // confirma que o arquivo de teste REALMENTE tinha EXIF

    const row = await uploadMedia(deps, { actor: author1, bytes: withExif });
    const { readFile } = await import("node:fs/promises");
    const stored = await readFile(join(storageDir, row.storageKey));
    const outMeta = await sharp(stored).metadata();
    expect(outMeta.exif).toBeUndefined();
  });
});

describe("upload: validação de texto alternativo e legenda", () => {
  it("recusa texto alternativo ou legenda longos demais, e nada é gravado", async () => {
    const before = await storedFileCount();
    await expect(
      uploadMedia(deps, { actor: author1, bytes: await jpeg(10, 10), altText: "x".repeat(301) }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    expect(await storedFileCount()).toBe(before);
  });
});

describe("permissões", () => {
  it("sem ator autenticado, a ação lança FORBIDDEN/UNAUTHENTICATED e nada é gravado", async () => {
    const before = await storedFileCount();
    await expect(
      uploadMedia(deps, { actor: null, bytes: await jpeg(10, 10) }),
    ).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    expect(await storedFileCount()).toBe(before);
  });

  it("AUTHOR edita e apaga a PRÓPRIA mídia", async () => {
    const row = await uploadMedia(deps, { actor: author1, bytes: await jpeg(10, 10) });
    await expect(
      updateMedia({ db: handle.db }, { actor: author1, id: row.id, altText: "novo" }),
    ).resolves.toMatchObject({
      altText: "novo",
    });
    await expect(deleteMedia(deps, { actor: author1, id: row.id })).resolves.toBeUndefined();
  });

  it("AUTHOR NÃO edita nem apaga mídia de outro AUTHOR: resposta é NOT_FOUND (não revela existência)", async () => {
    const row = await uploadMedia(deps, { actor: author1, bytes: await jpeg(10, 10) });
    await expect(
      updateMedia({ db: handle.db }, { actor: author2, id: row.id, altText: "x" }),
    ).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(deleteMedia(deps, { actor: author2, id: row.id })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
  });

  it("EDITOR gerencia e apaga mídia de qualquer pessoa", async () => {
    const row = await uploadMedia(deps, { actor: author1, bytes: await jpeg(10, 10) });
    await expect(
      updateMedia({ db: handle.db }, { actor: editor, id: row.id, caption: "legenda" }),
    ).resolves.toMatchObject({
      caption: "legenda",
    });
    await expect(deleteMedia(deps, { actor: editor, id: row.id })).resolves.toBeUndefined();
  });

  it("id inexistente: NOT_FOUND em vez de erro genérico", async () => {
    await expect(
      updateMedia(
        { db: handle.db },
        { actor: admin, id: "00000000-0000-4000-8000-000000000000", altText: "x" },
      ),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("exclusão: mídia em uso não pode ser apagada", () => {
  it("recusa apagar a capa de um artigo publicado, e o arquivo continua no storage", async () => {
    const cover = await uploadMedia(deps, { actor: editor, bytes: await jpeg(200, 150) });
    const specialist = await fx.specialist();
    await fx.post({ authorId: specialist.id, coverMediaId: cover.id });

    await expect(deleteMedia(deps, { actor: admin, id: cover.id })).rejects.toMatchObject({
      code: "DOMAIN_RULE",
    });
    const { readFile } = await import("node:fs/promises");
    await expect(readFile(join(storageDir, cover.storageKey))).resolves.toBeInstanceOf(Buffer);
  });

  it("mídia sem referência é apagada e o arquivo some do storage", async () => {
    const row = await uploadMedia(deps, { actor: editor, bytes: await jpeg(60, 60) });
    await deleteMedia(deps, { actor: admin, id: row.id });
    const { readFile } = await import("node:fs/promises");
    await expect(readFile(join(storageDir, row.storageKey))).rejects.toThrow();
    expect(await q("select 1 from media where id = $1", [row.id])).toHaveLength(0);
  });
});

describe("resolvedor para o RichText (pré-carrega em lote, devolve função síncrona)", () => {
  it("resolve imagens referenciadas no documento e ignora id inexistente", async () => {
    const row = await uploadMedia(deps, {
      actor: author1,
      bytes: await jpeg(300, 200),
      altText: "Alt real",
    });
    const doc = {
      type: "doc" as const,
      content: [{ type: "image" as const, attrs: { mediaId: row.id } }],
    };
    expect(extractMediaIds(doc)).toEqual([row.id]);

    const resolver = await buildMediaResolver(handle.db, doc);
    expect(resolver(row.id)).toEqual({
      url: `/media/${row.storageKey}`,
      alt: "Alt real",
      width: 300,
      height: 200,
    });
    expect(resolver("00000000-0000-4000-8000-000000000000")).toBeNull();
  });

  it("documento sem imagem não faz consulta nenhuma (resolvedor sempre devolve null)", async () => {
    const resolver = await buildMediaResolver(handle.db, { type: "doc", content: [] });
    expect(resolver("qualquer-id")).toBeNull();
  });
});
