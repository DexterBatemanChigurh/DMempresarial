"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { toActionError } from "@/lib/errors";
import { fail, ok, type ActionResult } from "@/lib/result";
import {
  createSolutionForRoute,
  deleteSolutionForRoute,
  updateSolutionForRoute,
  type SolutionItemInput,
} from "@/features/catalog/application/solution-crud";
import {
  transitionSolutionForRoute,
  type SolutionStatus,
} from "@/features/catalog/application/solution-service";
import { requireAdminSession } from "@/server/auth/admin-guard";

/**
 * Server Actions do CRUD de soluções (docs/03, parte 9). Mesma convenção das demais telas.
 */
export type SolutionMutated = { id: string; slug: string; version?: number };

function str(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}
function optionalStr(formData: FormData, name: string): string | null {
  const value = str(formData, name);
  return value === "" ? null : value;
}

/** Lê uma lista de itens de um `kind` a partir de campos paralelos (`<prefix>Title`/`<prefix>Body`,
 * um input por item, casados por posição — mesma convenção de `categoryIds`/`tagIds`). */
function readItems(
  formData: FormData,
  prefix: string,
  kind: SolutionItemInput["kind"],
): SolutionItemInput[] {
  const titles = formData.getAll(`${prefix}Title`);
  const bodies = formData.getAll(`${prefix}Body`);
  const items: SolutionItemInput[] = [];
  for (let i = 0; i < titles.length; i++) {
    const title = typeof titles[i] === "string" ? (titles[i] as string).trim() : "";
    if (title === "") continue;
    const body = typeof bodies[i] === "string" ? (bodies[i] as string).trim() : "";
    items.push({ kind, title, body: body === "" ? null : body });
  }
  return items;
}

function readSolutionForm(formData: FormData) {
  const typeRaw = str(formData, "type");
  return {
    type: typeRaw === "SERVICO" ? ("SERVICO" as const) : ("CONSULTORIA" as const),
    title: str(formData, "title"),
    summary: str(formData, "summary"),
    context: JSON.parse(str(formData, "context") || "null"),
    approach: JSON.parse(str(formData, "approach") || "null"),
    isFeatured: str(formData, "isFeatured") === "on",
    seoTitle: optionalStr(formData, "seoTitle"),
    seoDescription: optionalStr(formData, "seoDescription"),
    ogMediaId: null,
    items: [
      ...readItems(formData, "situation", "SITUATION"),
      ...readItems(formData, "step", "STEP"),
      ...readItems(formData, "goal", "GOAL"),
    ],
  };
}

function invalidate(tags: string[]) {
  revalidatePath("/admin/solucoes");
  revalidatePath("/admin/solucoes/[id]", "page");
  for (const tag of tags) revalidateTag(tag, "max");
}

export async function createSolutionAction(
  _prevState: ActionResult<SolutionMutated> | null,
  formData: FormData,
): Promise<ActionResult<SolutionMutated>> {
  let created: { id: string; slug: string };
  try {
    const { actor } = await requireAdminSession();
    created = await createSolutionForRoute({
      actor,
      slug: optionalStr(formData, "slug") ?? undefined,
      ...readSolutionForm(formData),
    });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["solutions"]);
  redirect(`/admin/solucoes/${created.id}`);
}

export async function updateSolutionAction(
  _prevState: ActionResult<SolutionMutated> | null,
  formData: FormData,
): Promise<ActionResult<SolutionMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const id = str(formData, "id");
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const updated = await updateSolutionForRoute({
      actor,
      id,
      expectedVersion,
      ...readSolutionForm(formData),
    });
    invalidate([`solution:${updated.slug}`, "solutions"]);
    return ok(updated);
  } catch (error) {
    return fail(toActionError(error));
  }
}

export async function deleteSolutionAction(
  _prevState: ActionResult<{ id: string }> | null,
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  let id: string;
  try {
    const { actor } = await requireAdminSession();
    id = str(formData, "id");
    await deleteSolutionForRoute({ actor, id });
  } catch (error) {
    return fail(toActionError(error));
  }
  invalidate(["solutions"]);
  redirect("/admin/solucoes");
}

export async function transitionSolutionAction(
  _prevState: ActionResult<SolutionMutated> | null,
  formData: FormData,
): Promise<ActionResult<SolutionMutated>> {
  try {
    const { actor } = await requireAdminSession();
    const solutionId = str(formData, "solutionId");
    const to = str(formData, "to") as SolutionStatus;
    const expectedVersion = Number(str(formData, "expectedVersion"));
    const result = await transitionSolutionForRoute({ actor, solutionId, to, expectedVersion });
    invalidate(result.invalidateTags);
    return ok(result);
  } catch (error) {
    return fail(toActionError(error));
  }
}
