import { AppError } from "@/lib/errors";
import { extractPlainText, readingMinutes, validateRichText, type RichDoc } from "@/lib/rich-text";

/**
 * Prepara o texto rico de um artigo, solução, página ou especialista para ser GRAVADO. É a
 * porta de entrada obrigatória: todo serviço de salvamento chama esta função com o que veio do
 * cliente. Devolve o documento NORMALIZADO (só o que a lista de permissão aceita) e os valores
 * derivados que ficam no banco (texto plano para a busca e tempo de leitura). Se algo não estiver
 * na lista, recusa com os motivos (VALIDATION), sem gravar nada.
 */
export type PreparedBody = { doc: RichDoc; text: string; readingMinutes: number };

export function prepareRichBody(input: unknown, field = "body"): PreparedBody {
  const result = validateRichText(input);
  if (!result.ok) {
    throw new AppError("VALIDATION", "Texto rico inválido.", {
      fieldErrors: { [field]: result.errors.map((e) => e.message) },
    });
  }
  const text = extractPlainText(result.doc);
  return { doc: result.doc, text, readingMinutes: readingMinutes(text) };
}
