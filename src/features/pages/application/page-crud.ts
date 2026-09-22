import "server-only";
import { eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { pages } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug } from "@/lib/slug";
import { prepareRichBody } from "@/features/content/application/rich-body";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Actor } from "@/server/permissions";
import { dataSchemaFor, RICH_FIELDS, type PageTemplate } from "../domain/page-schemas";
import {
  findPageForEdit,
  listPagesForAdmin as listPagesForAdminQuery,
  type Page,
  type PageSummaryForAdmin,
} from "../infrastructure/page-repository";

/**
 * CRUD de página institucional (docs/03, parte 9). Só ADMIN/EDITOR (`page:manage`); sem conceito
 * de dono. `template` é escolhido na criação e nunca muda depois — a forma de `data` depende
 * dele, então trocar o template órfãos os dados já gravados. Estado muda só por
 * `transitionPage`.
 */
type Deps = { db: Database };

const TITLE_LIMIT = 160;
const SEO_LIMITS = { seoTitle: 70, seoDescription: 160 };

function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && (current as { code?: unknown }).code === "23505")
      return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

/** Valida a FORMA de `data` contra o schema do template e normaliza cada campo de texto rico
 * através do único portão de gravação de texto rico do projeto (`prepareRichBody`). */
function prepareData(
  template: PageTemplate,
  rawData: Record<string, unknown>,
): Record<string, unknown> {
  const schema = dataSchemaFor(template);
  const parsed = schema.safeParse(rawData);
  if (!parsed.success) {
    throw new AppError("VALIDATION", "Confira os campos desta página.", {
      fieldErrors: { data: ["O formato dos campos não corresponde ao template escolhido."] },
    });
  }
  const richFields = RICH_FIELDS[template];
  const data: Record<string, unknown> = { ...parsed.data };
  for (const field of richFields) {
    data[field] = prepareRichBody(data[field], field).doc;
  }
  return data;
}

function assertTitleAndSeo(input: {
  title: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
}): void {
  const fieldErrors: Record<string, string[]> = {};
  if (input.title.trim() === "") fieldErrors.title = ["Título obrigatório."];
  if (input.title.length > TITLE_LIMIT)
    fieldErrors.title = [`No máximo ${TITLE_LIMIT} caracteres.`];
  if ((input.seoTitle?.length ?? 0) > SEO_LIMITS.seoTitle) {
    fieldErrors.seoTitle = [`No máximo ${SEO_LIMITS.seoTitle} caracteres.`];
  }
  if ((input.seoDescription?.length ?? 0) > SEO_LIMITS.seoDescription) {
    fieldErrors.seoDescription = [`No máximo ${SEO_LIMITS.seoDescription} caracteres.`];
  }
  if (Object.keys(fieldErrors).length > 0) {
    throw new AppError("VALIDATION", "Confira os campos.", { fieldErrors });
  }
}

export type CreatePageInput = {
  actor: Actor | null | undefined;
  key: string;
  template: PageTemplate;
  title: string;
  data: Record<string, unknown>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogMediaId?: string | null;
  requestId?: string;
};

export async function createPage(
  { db }: Deps,
  input: CreatePageInput,
): Promise<{ id: string; key: string }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "page:manage");
  assertTitleAndSeo(input);

  const key = input.key.trim();
  if (!isValidSlug(key)) {
    throw new AppError("VALIDATION", "Identificador inválido.", {
      fieldErrors: { key: ["Use minúsculas, números e hífens (até 80 caracteres)."] },
    });
  }
  if (isReservedSlug(key)) {
    throw new AppError("VALIDATION", "Identificador reservado.", {
      fieldErrors: { key: ["Este identificador é reservado pelo site."] },
    });
  }

  const data = prepareData(input.template, input.data);

  try {
    return await db.transaction(async (tx) => {
      const [row] = await tx
        .insert(pages)
        .values({
          key,
          template: input.template,
          title: input.title.trim(),
          data,
          seoTitle: input.seoTitle?.trim() || null,
          seoDescription: input.seoDescription?.trim() || null,
          ogMediaId: input.ogMediaId ?? null,
          createdBy: actor.id,
          updatedBy: actor.id,
        })
        .returning({ id: pages.id, key: pages.key });
      if (!row) throw new Error("Falha ao gravar a página.");
      await recordAudit(tx, {
        actorId: actor.id,
        action: "page.created",
        entityType: "page",
        entityId: row.id,
        requestId: input.requestId,
      });
      return row;
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new AppError("VALIDATION", "Identificador já em uso.", {
        fieldErrors: { key: ["Já existe uma página com este identificador."] },
      });
    }
    throw error;
  }
}

export type UpdatePageInput = {
  actor: Actor | null | undefined;
  id: string;
  title: string;
  data: Record<string, unknown>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  ogMediaId?: string | null;
  expectedVersion: number;
  requestId?: string;
};

export async function updatePage(
  { db }: Deps,
  input: UpdatePageInput,
): Promise<{ id: string; key: string; version: number }> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "page:manage");
  assertTitleAndSeo(input);

  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(pages)
      .where(eq(pages.id, input.id))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Página inexistente.");
    if (existing.version !== input.expectedVersion) {
      throw new AppError("CONFLICT", "A página foi alterada por outra pessoa.");
    }

    const data = prepareData(existing.template as PageTemplate, input.data);

    const [updated] = await tx
      .update(pages)
      .set({
        title: input.title.trim(),
        data,
        seoTitle: input.seoTitle?.trim() || null,
        seoDescription: input.seoDescription?.trim() || null,
        ogMediaId: input.ogMediaId ?? null,
        updatedBy: actor.id,
        version: existing.version + 1,
      })
      .where(eq(pages.id, input.id))
      .returning({ id: pages.id, key: pages.key, version: pages.version });
    if (!updated) throw new AppError("CONFLICT", "A página foi alterada por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: "page.updated",
      entityType: "page",
      entityId: input.id,
      requestId: input.requestId,
    });
    return updated;
  });
}

export type DeletePageInput = { actor: Actor | null | undefined; id: string; requestId?: string };

/** Só rascunho NUNCA publicado (mesma regra de "excluir" das demais entidades). Uma página
 * publicada alguma vez só se arquiva — nunca se apaga (docs/03, parte 7.3). */
export async function deletePage({ db }: Deps, input: DeletePageInput): Promise<void> {
  const actor = input.actor;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "page:manage");

  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(pages)
      .where(eq(pages.id, input.id))
      .limit(1)
      .for("update");
    if (!existing) throw new AppError("NOT_FOUND", "Página inexistente.");
    if (existing.status !== "DRAFT" || existing.publishedAt !== null) {
      throw new AppError("DOMAIN_RULE", "Só um rascunho nunca publicado pode ser excluído.");
    }
    await tx.delete(pages).where(eq(pages.id, input.id));
    await recordAudit(tx, {
      actorId: actor.id,
      action: "page.deleted",
      entityType: "page",
      entityId: input.id,
      requestId: input.requestId,
    });
  });
}

export async function getPageForEdit(
  { db }: Deps,
  actor: Actor | null | undefined,
  id: string,
): Promise<typeof pages.$inferSelect> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "page:manage");
  const found = await findPageForEdit(db, id);
  if (!found) throw new AppError("NOT_FOUND", "Página inexistente.");
  return found;
}

export async function listPagesForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  options: { page?: number } = {},
): Promise<Page<PageSummaryForAdmin>> {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "page:manage");
  return listPagesForAdminQuery(db, options);
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const createPageForRoute = (input: CreatePageInput) => createPage({ db: getDb() }, input);
export const updatePageForRoute = (input: UpdatePageInput) => updatePage({ db: getDb() }, input);
export const deletePageForRoute = (input: DeletePageInput) => deletePage({ db: getDb() }, input);
export const getPageForEditForRoute = (actor: Actor | null | undefined, id: string) =>
  getPageForEdit({ db: getDb() }, actor, id);
export const listPagesForAdminForRoute = (
  actor: Actor | null | undefined,
  options?: { page?: number },
) => listPagesForAdmin({ db: getDb() }, actor, options);
