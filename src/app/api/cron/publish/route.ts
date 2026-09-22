import "server-only";
import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { publishDuePostsForRoute } from "@/features/content/application/post-service";
import { env } from "@/server/env";

/**
 * Publica os artigos `SCHEDULED` vencidos (docs/03, incremento 5). Chamada pelo agendador da
 * hospedagem (ex.: Vercel Cron), nunca por uma pessoa: a autorização é o segredo no cabeçalho,
 * comparado em tempo constante (evita vazar o segredo por diferença de tempo de resposta).
 */
function isAuthorized(request: Request): boolean {
  const secret = env().CRON_SECRET;
  if (!secret) return false;

  const header = request.headers.get("authorization") ?? "";
  const provided = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expected = Buffer.from(secret);
  const actual = Buffer.from(provided);
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await publishDuePostsForRoute({});
  for (const tag of result.invalidateTags) revalidateTag(tag, "max");

  return Response.json(
    { published: result.publishedIds.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
