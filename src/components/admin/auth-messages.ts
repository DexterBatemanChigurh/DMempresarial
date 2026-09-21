/**
 * Mensagens de erro de autenticação em português. Genéricas de propósito: nunca dizem se o
 * e-mail existe, nem detalham por que o código falhou além do necessário (sem enumeração de contas).
 */
export type AuthErrorLike = { status?: number; code?: string; message?: string } | null | undefined;

const GENERIC = "Não foi possível entrar agora. Tente novamente em instantes.";

export function loginErrorMessage(error: AuthErrorLike): string {
  if (!error) return GENERIC;
  if (error.status === 429) return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  if (error.status === 401 || error.code === "INVALID_EMAIL_OR_PASSWORD") {
    return "E-mail ou senha incorretos.";
  }
  return GENERIC;
}

export function twoFactorErrorMessage(
  error: AuthErrorLike,
  kind: "totp" | "backup" = "totp",
): string {
  if (!error) return GENERIC;
  if (
    error.status === 429 ||
    error.code === "ACCOUNT_TEMPORARILY_LOCKED" ||
    error.code === "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE"
  ) {
    return "Muitas tentativas. Aguarde alguns minutos e tente de novo.";
  }
  if (error.code === "INVALID_TWO_FACTOR_COOKIE") {
    return "A verificação expirou. Volte e entre com e-mail e senha de novo.";
  }
  if (kind === "backup") return "Código de backup inválido ou já usado.";
  return "Código incorreto. Confira o app autenticador e tente de novo.";
}

export function passwordChangeErrorMessage(error: AuthErrorLike): string {
  if (!error) return "Não foi possível alterar a senha agora.";
  if (error.status === 429) return "Muitas tentativas. Aguarde alguns minutos.";
  if (error.code === "INVALID_PASSWORD") return "A senha atual está incorreta.";
  if (error.code === "PASSWORD_TOO_SHORT")
    return "A nova senha precisa ter pelo menos 12 caracteres.";
  return "Não foi possível alterar a senha agora.";
}
