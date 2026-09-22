import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import {
  getSettingsForEdit,
  updateSettings,
  type UpdateSettingsInput,
} from "@/features/settings/application/settings-crud";
import type { Actor } from "@/server/permissions";
import { createFixtures } from "./fixtures";
import { testAppUrl } from "./helpers";

const fx = createFixtures();
const handle = createDatabase(testAppUrl(), { max: 6 });
const deps = { db: handle.db };
const { q } = fx;

let admin: Actor, editor: Actor;
let originalRow: Record<string, unknown> | undefined;

beforeAll(async () => {
  await fx.cleanup();
  const users = await Promise.all([fx.user("ADMIN"), fx.user("EDITOR")]);
  [admin, editor] = users as [Actor, Actor];
  // A tabela é uma linha única (id = 1, semeada com o endereço real): guarda o estado para
  // restaurar depois, nunca apaga.
  [originalRow] = await q("select * from site_settings where id = 1");
});
afterAll(async () => {
  if (originalRow) {
    await q(
      `update site_settings set legal_name = $1, cnpj = $2, address = $3, phone = $4, email = $5,
        whatsapp = $6, social = $7::jsonb, updated_by = $8 where id = 1`,
      [
        originalRow.legal_name,
        originalRow.cnpj,
        originalRow.address,
        originalRow.phone,
        originalRow.email,
        originalRow.whatsapp,
        JSON.stringify(originalRow.social),
        originalRow.updated_by,
      ],
    );
  }
  await fx.cleanup();
  await fx.close();
  await handle.close();
});

const input = (over: Partial<UpdateSettingsInput> = {}): UpdateSettingsInput => ({
  actor: admin,
  legalName: "DM Empresarial Consultoria Ltda.",
  cnpj: "12.345.678/0001-90",
  address: "Rua Exemplo, 123, Frutal/MG",
  phone: "(34) 3000-0000",
  email: "contato@dmempresarial.example",
  whatsapp: "(34) 90000-0000",
  social: { instagram: "https://instagram.com/dm" },
  ...over,
});

describe("updateSettings", () => {
  it("sem sessão → UNAUTHENTICATED; EDITOR → FORBIDDEN", async () => {
    await expect(updateSettings(deps, input({ actor: null }))).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(updateSettings(deps, input({ actor: editor }))).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("ADMIN grava; campos em branco viram null (some da tela pública)", async () => {
    const row = await updateSettings(deps, input());
    expect(row.legalName).toBe("DM Empresarial Consultoria Ltda.");
    expect(row.social).toMatchObject({ instagram: "https://instagram.com/dm" });

    const cleared = await updateSettings(
      deps,
      input({ phone: "", email: "", whatsapp: "", social: {} }),
    );
    expect(cleared.phone).toBeNull();
    expect(cleared.email).toBeNull();
    expect(cleared.whatsapp).toBeNull();
    expect(cleared.social).toEqual({});
  });

  it("e-mail inválido → VALIDATION", async () => {
    await expect(updateSettings(deps, input({ email: "não-é-um-email" }))).rejects.toMatchObject({
      code: "VALIDATION",
      fieldErrors: { email: expect.any(Array) },
    });
  });

  it("URL de rede social inválida → VALIDATION", async () => {
    await expect(
      updateSettings(deps, input({ social: { instagram: "não-é-uma-url" } })),
    ).rejects.toMatchObject({ code: "VALIDATION", fieldErrors: { social: expect.any(Array) } });
  });

  it("grava auditoria a cada alteração", async () => {
    await updateSettings(deps, input());
    const log = await q<{ action: string }>(
      "select action from audit_logs where entity_type = 'site_settings' and entity_id = '1' order by at desc limit 1",
    );
    expect(log[0]?.action).toBe("settings.updated");
  });
});

describe("getSettingsForEdit", () => {
  it("sem sessão → UNAUTHENTICATED; EDITOR → FORBIDDEN; ADMIN lê", async () => {
    await expect(getSettingsForEdit(deps, null)).rejects.toMatchObject({
      code: "UNAUTHENTICATED",
    });
    await expect(getSettingsForEdit(deps, editor)).rejects.toMatchObject({ code: "FORBIDDEN" });
    const row = await getSettingsForEdit(deps, admin);
    expect(row).not.toBeNull();
  });
});
