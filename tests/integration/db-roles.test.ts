import pg from "pg";
import { afterAll, describe, expect, it } from "vitest";
import { createDatabase } from "@/db/client";
import { bootstrapRoles, runMigrations } from "../../scripts/lib/db-admin.mts";
import { testAdminUrl, testAppUrl } from "./helpers";

const owner = new pg.Pool({ connectionString: testAdminUrl(), max: 2 });
const app = createDatabase(testAppUrl(), { max: 2 });

afterAll(async () => {
  await owner.end();
  await app.close();
});

const appQuery = (text: string) => app.pool.query(text);

describe("role de aplicação (dm_app)", () => {
  it("conecta como dm_app e não é superusuário", async () => {
    const { rows } = await appQuery(
      "select current_user as u, (select rolsuper from pg_roles where rolname = current_user) as su",
    );
    expect(rows[0]).toEqual({ u: "dm_app", su: false });
  });

  it("consegue executar consultas pelo Drizzle", async () => {
    const { rows } = await app.pool.query("select 1 as ok");
    expect(rows[0]).toEqual({ ok: 1 });
  });

  it("NÃO cria tabelas (sem DDL)", async () => {
    await expect(appQuery("create table dm_should_not_exist (id int)")).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("tabelas criadas depois pelo dono herdam DML, mas não DDL nem TRUNCATE", async () => {
    const table = `it_tmp_${Date.now()}`;
    await owner.query(`create table ${table} (id int primary key, v text)`);
    try {
      await appQuery(`insert into ${table} values (1, 'a')`);
      await appQuery(`update ${table} set v = 'b' where id = 1`);
      const { rows } = await appQuery(`select v from ${table} where id = 1`);
      expect(rows[0]).toEqual({ v: "b" });
      await appQuery(`delete from ${table} where id = 1`);

      await expect(appQuery(`truncate ${table}`)).rejects.toThrow(/permission denied/i);
      await expect(appQuery(`drop table ${table}`)).rejects.toThrow(/must be owner/i);
      await expect(appQuery(`alter table ${table} add column x int`)).rejects.toThrow(
        /must be owner/i,
      );
    } finally {
      await owner.query(`drop table if exists ${table}`);
    }
  });

  it("não acessa o schema das migrations", async () => {
    await expect(appQuery("select * from drizzle.__drizzle_migrations")).rejects.toThrow(
      /permission denied/i,
    );
  });
});

describe("bootstrap", () => {
  it("é idempotente e RETIRA privilégio excedente (mínimo privilégio autocorretivo)", async () => {
    const password = process.env.DM_APP_DB_PASSWORD ?? "";
    await owner.query("grant create on schema public to dm_app");
    await expect(appQuery("create table dm_drift_probe (id int)")).resolves.toBeDefined();
    await owner.query("drop table dm_drift_probe");

    await bootstrapRoles(testAdminUrl(), password);
    await bootstrapRoles(testAdminUrl(), password);

    await expect(appQuery("create table dm_drift_probe (id int)")).rejects.toThrow(
      /permission denied/i,
    );
  });

  it("devolve ao mínimo um role que ganhou atributos a mais (CREATEDB/CREATEROLE)", async () => {
    const password = process.env.DM_APP_DB_PASSWORD ?? "";
    await owner.query("alter role dm_app createdb createrole");
    const before = await owner.query(
      "select rolcreatedb, rolcreaterole from pg_roles where rolname = 'dm_app'",
    );
    expect(before.rows[0]).toEqual({ rolcreatedb: true, rolcreaterole: true });

    await bootstrapRoles(testAdminUrl(), password);
    const after = await owner.query(
      "select rolsuper, rolcreatedb, rolcreaterole from pg_roles where rolname = 'dm_app'",
    );
    expect(after.rows[0]).toEqual({ rolsuper: false, rolcreatedb: false, rolcreaterole: false });
  });

  it("numa segunda execução só troca a senha (o que um dono sem superusuário consegue fazer)", async () => {
    const password = process.env.DM_APP_DB_PASSWORD ?? "";
    await bootstrapRoles(testAdminUrl(), password);
    const login = new pg.Client({ connectionString: testAppUrl() });
    await login.connect();
    await login.end();
  });

  it("recusa senha curta de aplicação", async () => {
    await expect(bootstrapRoles(testAdminUrl(), "curta")).rejects.toThrow(/16 caracteres/);
  });
});

describe("migrations", () => {
  it("aplicam as extensões exigidas pelo modelo de dados (citext, unaccent)", async () => {
    const { rows } = await owner.query<{ extname: string }>(
      "select extname from pg_extension where extname in ('citext','unaccent') order by 1",
    );
    expect(rows.map((r) => r.extname)).toEqual(["citext", "unaccent"]);
  });

  it("são idempotentes: rodar de novo não falha nem duplica", async () => {
    await expect(runMigrations(testAdminUrl())).resolves.toBeUndefined();
    await expect(runMigrations(testAdminUrl())).resolves.toBeUndefined();
  });
});
