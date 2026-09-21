import { describe, expect, it } from "vitest";
import {
  loginErrorMessage,
  passwordChangeErrorMessage,
  twoFactorErrorMessage,
} from "./auth-messages";

describe("loginErrorMessage", () => {
  it("senha errada e e-mail inexistente mostram a MESMA mensagem (sem enumeração)", () => {
    const wrong = loginErrorMessage({ status: 401, code: "INVALID_EMAIL_OR_PASSWORD" });
    const unknown = loginErrorMessage({ status: 401 });
    expect(wrong).toBe(unknown);
    expect(wrong).toBe("E-mail ou senha incorretos.");
  });

  it("limite de tentativas tem mensagem própria e não vaza detalhes técnicos", () => {
    expect(loginErrorMessage({ status: 429 })).toMatch(/Muitas tentativas/);
    const generic = loginErrorMessage({
      status: 500,
      message: "SQL: relation users does not exist",
    });
    expect(generic).not.toMatch(/SQL|relation|users/);
    expect(loginErrorMessage(null)).toBe(loginErrorMessage({ status: 500 }));
  });
});

describe("twoFactorErrorMessage", () => {
  it("bloqueio e limite dão a mesma orientação; código errado é específico", () => {
    for (const error of [
      { status: 429 },
      { code: "ACCOUNT_TEMPORARILY_LOCKED" },
      { code: "TOO_MANY_ATTEMPTS_REQUEST_NEW_CODE" },
    ]) {
      expect(twoFactorErrorMessage(error)).toMatch(/Muitas tentativas/);
    }
    expect(twoFactorErrorMessage({ code: "INVALID_CODE" })).toMatch(/Código incorreto/);
    expect(twoFactorErrorMessage({ code: "INVALID_BACKUP_CODE" }, "backup")).toMatch(/backup/);
  });

  it("cookie de verificação expirado orienta a recomeçar o login", () => {
    expect(twoFactorErrorMessage({ code: "INVALID_TWO_FACTOR_COOKIE" })).toMatch(/expirou/);
  });
});

describe("passwordChangeErrorMessage", () => {
  it("distingue senha atual incorreta, senha curta e limite", () => {
    expect(passwordChangeErrorMessage({ code: "INVALID_PASSWORD" })).toMatch(/atual/);
    expect(passwordChangeErrorMessage({ code: "PASSWORD_TOO_SHORT" })).toMatch(/12/);
    expect(passwordChangeErrorMessage({ status: 429 })).toMatch(/Muitas/);
    expect(passwordChangeErrorMessage(undefined)).toMatch(/Não foi possível/);
  });
});
