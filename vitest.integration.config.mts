import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const src = fileURLToPath(new URL("./src", import.meta.url));
const serverOnlyStub = fileURLToPath(new URL("./tests/stubs/server-only.ts", import.meta.url));

// Testes que usam Postgres real (banco `dm_empresarial_test`, nunca o de desenvolvimento).
// Rodam com `npm run test:integration`; `npm test` continua sem depender de banco.
export default defineConfig({
  resolve: { alias: { "@": src, "server-only": serverOnlyStub } },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["./tests/integration/global-setup.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
    hookTimeout: 60_000,
  },
});
