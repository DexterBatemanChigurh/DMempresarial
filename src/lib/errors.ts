/**
 * Modelo de erros da aplicação (Prompt 3, §28).
 * Puro e isomórfico: o domínio pode lançar `AppError` sem conhecer Next, banco ou servidor.
 */

export type ErrorCode =
  | "VALIDATION"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "DOMAIN_RULE"
  | "RATE_LIMITED"
  | "EXTERNAL_SERVICE"
  | "UNEXPECTED";

export type FieldErrors = Record<string, string[]>;

/** Forma segura de um erro para o cliente: nunca carrega stack, SQL nem detalhes internos. */
export type ActionError = {
  code: ErrorCode;
  message: string;
  fieldErrors?: FieldErrors;
  retryAfterSeconds?: number;
};

const HTTP_STATUS: Record<ErrorCode, number> = {
  VALIDATION: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  DOMAIN_RULE: 422,
  RATE_LIMITED: 429,
  EXTERNAL_SERVICE: 502,
  UNEXPECTED: 500,
};

// Mensagens públicas em pt-BR. Nada aqui pode expor estrutura interna.
const PUBLIC_MESSAGE: Record<ErrorCode, string> = {
  VALIDATION: "Confira os campos e tente novamente.",
  UNAUTHENTICATED: "Entre para continuar.",
  FORBIDDEN: "Você não tem permissão para esta ação.",
  NOT_FOUND: "Não encontramos o que você procura.",
  CONFLICT: "Este conteúdo foi alterado por outra pessoa. Recarregue a página e tente de novo.",
  DOMAIN_RULE: "Esta ação não é permitida no estado atual.",
  RATE_LIMITED: "Muitas tentativas. Aguarde um pouco e tente de novo.",
  EXTERNAL_SERVICE: "Não conseguimos concluir agora. Tente novamente em instantes.",
  UNEXPECTED: "Algo deu errado. Tente novamente em instantes.",
};

type AppErrorOptions = {
  cause?: unknown;
  fieldErrors?: FieldErrors;
  retryAfterSeconds?: number;
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly fieldErrors: FieldErrors | undefined;
  readonly retryAfterSeconds: number | undefined;

  /** `message` é para logs e desenvolvedores; o que o usuário vê é `publicMessage`. */
  constructor(code: ErrorCode, message: string, options: AppErrorOptions = {}) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = "AppError";
    this.code = code;
    this.fieldErrors = options.fieldErrors;
    this.retryAfterSeconds = options.retryAfterSeconds;
  }

  get httpStatus(): number {
    return HTTP_STATUS[this.code];
  }

  get publicMessage(): string {
    return PUBLIC_MESSAGE[this.code];
  }
}

export function publicMessageFor(code: ErrorCode): string {
  return PUBLIC_MESSAGE[code];
}

/**
 * Converte qualquer erro em algo seguro para devolver ao cliente.
 * Erros que não são `AppError` viram `UNEXPECTED`, sem nenhum detalhe.
 */
export function toActionError(error: unknown): ActionError {
  if (error instanceof AppError) {
    const result: ActionError = { code: error.code, message: error.publicMessage };
    if (error.fieldErrors) result.fieldErrors = error.fieldErrors;
    if (error.retryAfterSeconds !== undefined) result.retryAfterSeconds = error.retryAfterSeconds;
    return result;
  }
  return { code: "UNEXPECTED", message: PUBLIC_MESSAGE.UNEXPECTED };
}
