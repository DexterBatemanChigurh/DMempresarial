import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// Fronteiras de camada (Prompt 3, §5 e §38): a UI não fala com banco nem com infraestrutura,
// e o domínio puro não conhece framework, ORM nem servidor.
const serverOnlyPatterns = [
  { group: ["@/server/*", "@/server/**"], message: "UI não importa infraestrutura de servidor." },
  { group: ["pg", "drizzle-orm", "drizzle-orm/*"], message: "UI não acessa o banco diretamente." },
];

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "coverage/**", "next-env.d.ts", "node_modules/**"]),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "no-console": "error",
    },
  },
  {
    // Componentes: sem servidor, sem banco.
    files: ["src/components/**/*.{ts,tsx}"],
    rules: { "no-restricted-imports": ["error", { patterns: serverOnlyPatterns }] },
  },
  {
    // Domínio puro e utilitários isomórficos: sem Next, React, ORM, banco ou servidor.
    files: ["src/lib/**/*.{ts,tsx}", "src/modules/**/domain/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...serverOnlyPatterns,
            { group: ["next", "next/*"], message: "Domínio puro não conhece o Next." },
            {
              group: ["react", "react-dom", "react/*"],
              message: "Domínio puro não conhece o React.",
            },
          ],
        },
      ],
    },
  },
  {
    // O logger é a única saída permitida para console.
    files: ["src/server/logging/**/*.ts", "scripts/**/*.mts"],
    rules: { "no-console": "off" },
  },
]);
