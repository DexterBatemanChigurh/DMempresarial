import { describe, expect, it } from "vitest";
import { ROLES } from "@/server/permissions";
import { decideAdminAccess, requiresTwoFactor } from "./two-factor-policy";

describe("requiresTwoFactor", () => {
  it("ADMIN e EDITOR exigem; AUTHOR não", () => {
    expect(requiresTwoFactor("ADMIN")).toBe(true);
    expect(requiresTwoFactor("EDITOR")).toBe(true);
    expect(requiresTwoFactor("AUTHOR")).toBe(false);
  });
});

describe("decideAdminAccess", () => {
  it("papel que exige e sem 2FA ativo → precisa configurar (não entra no painel)", () => {
    for (const role of ["ADMIN", "EDITOR"] as const) {
      expect(decideAdminAccess({ role, twoFactorEnabled: false, enforce: true })).toBe("setup-2fa");
    }
  });

  it("com 2FA ativo, todos os papéis entram", () => {
    for (const role of ROLES) {
      expect(decideAdminAccess({ role, twoFactorEnabled: true, enforce: true })).toBe("allow");
    }
  });

  it("AUTHOR entra sem 2FA", () => {
    expect(decideAdminAccess({ role: "AUTHOR", twoFactorEnabled: false, enforce: true })).toBe(
      "allow",
    );
  });

  it("com a exigência desligada (só desenvolvimento local), entra sem 2FA", () => {
    expect(decideAdminAccess({ role: "ADMIN", twoFactorEnabled: false, enforce: false })).toBe(
      "allow",
    );
  });

  it("nenhuma combinação de papel/2FA/enforce deixa passar quem deveria configurar", () => {
    for (const role of ROLES) {
      for (const twoFactorEnabled of [true, false]) {
        const decision = decideAdminAccess({ role, twoFactorEnabled, enforce: true });
        const mustSetup = requiresTwoFactor(role) && !twoFactorEnabled;
        expect(decision === "setup-2fa", `${role}/${twoFactorEnabled}`).toBe(mustSetup);
      }
    }
  });
});
