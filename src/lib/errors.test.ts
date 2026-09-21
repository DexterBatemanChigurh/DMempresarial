import { describe, expect, it } from "vitest";
import { AppError, publicMessageFor, toActionError } from "./errors";

describe("AppError", () => {
  it("mapeia o código para o status HTTP", () => {
    expect(new AppError("VALIDATION", "x").httpStatus).toBe(400);
    expect(new AppError("UNAUTHENTICATED", "x").httpStatus).toBe(401);
    expect(new AppError("FORBIDDEN", "x").httpStatus).toBe(403);
    expect(new AppError("NOT_FOUND", "x").httpStatus).toBe(404);
    expect(new AppError("CONFLICT", "x").httpStatus).toBe(409);
    expect(new AppError("DOMAIN_RULE", "x").httpStatus).toBe(422);
    expect(new AppError("RATE_LIMITED", "x").httpStatus).toBe(429);
    expect(new AppError("EXTERNAL_SERVICE", "x").httpStatus).toBe(502);
    expect(new AppError("UNEXPECTED", "x").httpStatus).toBe(500);
  });

  it("preserva a causa original para logs", () => {
    const cause = new Error("falha original");
    expect(new AppError("EXTERNAL_SERVICE", "x", { cause }).cause).toBe(cause);
  });
});

describe("toActionError", () => {
  it("não vaza a mensagem interna: o usuário vê só a mensagem pública", () => {
    const error = new AppError("DOMAIN_RULE", "post 42 em REVIEW não pode ir a ARCHIVED (interno)");
    const result = toActionError(error);
    expect(result.message).toBe(publicMessageFor("DOMAIN_RULE"));
    expect(JSON.stringify(result)).not.toContain("post 42");
  });

  it("repassa erros por campo e tempo de espera", () => {
    const result = toActionError(
      new AppError("VALIDATION", "x", { fieldErrors: { email: ["Informe um e-mail válido."] } }),
    );
    expect(result.fieldErrors).toEqual({ email: ["Informe um e-mail válido."] });

    const limited = toActionError(new AppError("RATE_LIMITED", "x", { retryAfterSeconds: 60 }));
    expect(limited.retryAfterSeconds).toBe(60);
  });

  it("transforma erro desconhecido em UNEXPECTED, sem nenhum detalhe", () => {
    const result = toActionError(new Error('relation "leads" does not exist (SQL interno)'));
    expect(result).toEqual({ code: "UNEXPECTED", message: publicMessageFor("UNEXPECTED") });
    expect(JSON.stringify(result)).not.toContain("leads");
  });

  it("aceita valores que nem são Error (throw de string, null)", () => {
    expect(toActionError("boom").code).toBe("UNEXPECTED");
    expect(toActionError(null).code).toBe("UNEXPECTED");
    expect(toActionError(undefined).code).toBe("UNEXPECTED");
  });
});
