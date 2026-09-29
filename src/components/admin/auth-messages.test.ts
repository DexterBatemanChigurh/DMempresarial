import { describe, expect, it } from "vitest";
import { loginErrorMessage, passwordChangeErrorMessage } from "./auth-messages";

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

describe("passwordChangeErrorMessage", () => {
  it("distingue senha atual incorreta, senha curta e limite", () => {
    expect(passwordChangeErrorMessage({ code: "INVALID_PASSWORD" })).toMatch(/atual/);
    expect(passwordChangeErrorMessage({ code: "PASSWORD_TOO_SHORT" })).toMatch(/12/);
    expect(passwordChangeErrorMessage({ status: 429 })).toMatch(/Muitas/);
    expect(passwordChangeErrorMessage(undefined)).toMatch(/Não foi possível/);
  });
});
