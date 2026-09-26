import "server-only";
import { readServableMedia } from "@/features/media/application/serve";
import { isValidStorageKey } from "@/server/storage/port";

// Rota pública que serve os binários de mídia (docs/03, parte 21). Só devolve arquivo cuja chave
// bate com o formato esperado E que exista em `media` com `status = READY` (nunca serve um
// upload pendente/incompleto, nem qualquer coisa fora do que o pipeline de upload gravou). Os
// bytes vêm do adaptador de storage configurado (disco local ou bucket S3-compatível privado).
export async function GET(_request: Request, { params }: { params: Promise<{ key: string[] }> }) {
  const key = (await params).key.join("/");
  if (!isValidStorageKey(key)) {
    return new Response("Chave inválida.", { status: 400 });
  }

  const found = await readServableMedia(key);
  if (!found) {
    return new Response("Não encontrado.", { status: 404 });
  }

  return new Response(new Uint8Array(found.bytes), {
    headers: {
      "Content-Type": found.mime,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
