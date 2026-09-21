// Verificação de vida para monitor externo. Não toca no banco e não expõe nada interno.
export function GET() {
  return Response.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
}
