import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Regra do projeto (docs/03, parte 9): nenhum HTML em string chega ao navegador. O texto rico é
 * renderizado como elementos React a partir do JSON validado. Este teste falha se alguém
 * introduzir `dangerouslySetInnerHTML` ou atribuir `innerHTML` em qualquer arquivo do código.
 */
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx|mts)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry) ? [path] : [];
  });
}

describe("nenhum HTML bruto chega ao navegador", () => {
  it("não há dangerouslySetInnerHTML, innerHTML nem insertAdjacentHTML no código", () => {
    const offenders = files("src").filter((file) =>
      /dangerouslySetInnerHTML|\.innerHTML\s*=|insertAdjacentHTML|document\.write\(/.test(
        readFileSync(file, "utf8"),
      ),
    );
    expect(offenders).toEqual([]);
  });
});
