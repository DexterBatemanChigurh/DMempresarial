import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("next.config", () => {
  it("não anuncia o framework", () => {
    expect(nextConfig.poweredByHeader).toBe(false);
  });

  it("aplica os cabeçalhos de segurança de base em todas as rotas", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const all = rules.find((rule) => rule.source === "/(.*)");
    const headers = Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]));

    expect(headers).toMatchObject({
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "Referrer-Policy": "strict-origin-when-cross-origin",
    });
    expect(headers["Permissions-Policy"]).toContain("camera=()");
  });

  it("manda HSTS por 2 anos, incluindo subdomínios, sem preload", async () => {
    const rules = (await nextConfig.headers?.()) ?? [];
    const all = rules.find((rule) => rule.source === "/(.*)");
    const headers = Object.fromEntries((all?.headers ?? []).map((h) => [h.key, h.value]));

    expect(headers["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
  });
});
