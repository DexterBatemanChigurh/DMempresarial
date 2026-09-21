import { toNextJsHandler } from "better-auth/next-js";
import { publicMessageFor } from "@/lib/errors";
import { getAuth } from "@/server/auth/auth";
import { isTrustedOriginRequest } from "@/server/auth/origin";
import { env } from "@/server/env";

// Endpoints da biblioteca (login, logout, sessão). Instância criada por requisição, de forma
// preguiçosa, para o build não depender das variáveis de autenticação.
const handlers = () => toNextJsHandler(getAuth());

export function GET(request: Request) {
  return handlers().GET(request);
}

export function POST(request: Request) {
  // Antes da biblioteca: origem confiável mesmo em login sem cookie (login CSRF).
  if (!isTrustedOriginRequest(request, env().BETTER_AUTH_URL)) {
    return Response.json(
      { error: { code: "FORBIDDEN", message: publicMessageFor("FORBIDDEN") } },
      { status: 403 },
    );
  }
  return handlers().POST(request);
}
