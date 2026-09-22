"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createPageForRoute,
  deletePageForRoute,
  updatePageForRoute,
} from "@/features/pages/application/page-crud";
import { transitionPageForRoute, type PageStatus } from "@/features/pages/application/page-service";
import { PAGE_TEMPLATES, type PageTemplate } from "@/features/pages/domain/page-schemas";
import { requireAdminSession } from "@/server/auth/admin-guard";

/**
 * Server Actions do CRUD de páginas institucionais (docs/03, parte 9). Mesma convenção das
 * demais telas.
 */
export type PageMutated = { id: string; key: string; version?: number };

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function optionalStr(formData: FormData, name: string): string | null {
  const value = str(formData, name);
  return value === "" ? null : value;
}
function json(formData: FormData, name: string): unknown {
  const raw = formData.get(name);
  return typeof raw === "string" && raw !== "" ? JSON.parse(raw) : null;
}

function parseTemplate(value: string): PageTemplate {
  return (PAGE_TEMPLATES as readonly string[]).includes(value) ? (value as PageTemplate) : "HOME";
}

/** Lê `data` de acordo com o template — cada template tem seu próprio conjunto de campos
 * (docs/03, parte 9: "template em código + data validado por schema"). */
function readData(formData: FormData, template: PageTemplate): Record<string, unknown> {
  switch (template) {
    case "HOME":
      return {
        headline: str(formData, "headline"),
        description: json(formData, "description"),
        howWeThink: json(formData, "howWeThink"),
      };
    case "ABOUT": {
      const names = formData.getAll("valueName");
      const practices = formData.getAll("valuePractice");
      const values = [];
      for (let i = 0; i < names.length; i++) {
        const name = typeof names[i] === "string" ? (names[i] as string).trim() : "";
        if (name === "") continue;
        const practice = typeof practices[i] === "string" ? (practices[i] as string).trim() : "";
        values.push({ name, practice });
      }
      return {
        whoWeAre: json(formData, "whoWeAre"),
        howWeThink: json(formData, "howWeThink"),
        howWeWork: json(formData, "howWeWork"),
        values,
      };
    }
    case "CONTACT":
      return { intro: json(formData, "intro") };
    case "LEGAL":
      return { body: json(formData, "body") };
  }
}

function invalidate(tags: string[]) {
  revalidatePath("/admin/paginas");
  revalidatePath("/admin/paginas/[id]", "page");
  for (const tag of tags) revalidateTag(tag, "max");
}

export async function createPageAction(
  _prevState: ActionResult<PageMutated> | null,
  formData: FormData,
): Promise<ActionResult<PageMutated>> {
  let created: { id: string; key: string };
  try {
    const { actor } = await requireAdminSession();
    const template = parseTemplate(str(formData, "template"));
    created = await createPageForRoute({
      actor,
      key: str(formData, "key"),
      template,
      title: str(formData, "title"),
      data: readData(formData, template),
      seoTitle: optionalStr(formData, "seoTitle"),
      seoDescription: optionalStr(formData, "seoDescription"),
      ogMediaId: null,
    });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["pages"]);
  redirect(`/admin/paginas/${created.id}`);
}

export async function updatePageAction(
  _prevState: ActionResult<PageMutated> | null,
  formData: FormData,
): Promise<ActionResult<PageMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    const template = parseTemplate(str(formData, "template"));
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const updated = await updatePageForRoute({
      actor,
      id,
      expectedVersion,
      title: str(formData, "title"),
      data: readData(formData, template),
      seoTitle: optionalStr(formData, "seoTitle"),
      seoDescription: optionalStr(formData, "seoDescription"),
      ogMediaId: null,
    });
    invalidate([`page:${updated.key}`, "pages"]);
    return ok(updated);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deletePageAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let id: string;
  try {
    const { actor } = await requireAdminSession();
    id = str(formData, "id");
    await deletePageForRoute({ actor, id });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["pages"]);
  redirect("/admin/paginas");
}

export async function transitionPageAction(
  _prevState: ActionResult<PageMutated> | null,
  formData: FormData,
): Promise<ActionResult<PageMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const pageId = str(formData, "pageId");
    const to = str(formData, "to") as PageStatus;
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const result = await transitionPageForRoute({ actor, pageId, to, expectedVersion });
    invalidate(result.invalidateTags);
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}
