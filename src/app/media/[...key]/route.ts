import "server-only";
import { findServableMedia } from "@/features/media/application/serve";
import { readLocalStorageFile } from "@/server/storage/local";
import { isValidStorageKey } from "@/server/storage/port";
import { env } from "@/server/env";

// Rota pública que serve os binários de mídia (docs/03, parte 21). Só devolve arquivo cuja chave
// bate com o formato esperado E que exista em `media` com `status = READY` (nunca serve um
// upload pendente/incompleto, nem qualquer coisa fora do que o pipeline de upload gravou).
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!isValidStorageKey(key)) {
    return new Response("Chave inválida.", { status: 400 });
  }

  const found = await findServableMedia(key);
  if (!found) {
    return new Response("Não encontrado.", { status: 404 });
  }

  try {
    const bytes = await readLocalStorageFile(env().STORAGE_LOCAL_DIR, key);
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": found.mime,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Não encontrado.", { status: 404 });
  }
}
