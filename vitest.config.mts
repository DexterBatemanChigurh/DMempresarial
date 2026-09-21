import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": src,
      // `server-only` lança fora do runtime do React Server; nos testes é um no-op.
      "server-only": serverOnlyStub,
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}", "tests/**/*.test.{ts,tsx}"],
    // Integração usa Postgres real: `npm run test:integration`.
    exclude: [...configDefaults.exclude, "tests/integration/**"],
  },
});
