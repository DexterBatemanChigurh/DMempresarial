import "server-only";
import { desc, eq } from "drizzle-orm";
import type { Database } from "@/db/client";
import { redirects, users } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { assertCan, type Actor } from "@/server/permissions";
import { recordAudit } from "../infrastructure/audit";
import { findRedirect } from "../infrastructure/redirects";
import { validateManualRedirect } from "../domain/redirect-rules";

/**
 * Redirecionamentos no painel (`redirect:manage`: ADMIN e EDITOR). Os automáticos nascem quando
 * o slug de um artigo publicado muda; os manuais servem para aposentar ou mover um endereço.
 * Nunca há salto duplo: um destino que já redireciona é seguido até o fim, e o que apontava
 * para a nova origem passa a apontar direto para o destino final.
 */
type Deps = { db: Database };

export type RedirectRow = {
  id: string;
  fromPath: string;
  toPath: string;
  statusCode: number;
  origin: "AUTO" | "MANUAL";
  createdAt: Date;
  createdByName: string | null;
};

function authorize(actor: Actor | null | undefined): Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, "redirect:manage");
  return actor;
}

export async function listRedirects(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<RedirectRow[]> {
  authorize(actor);
  const rows = await db
    .select({
      id: redirects.id,
      fromPath: redirects.fromPath,
      toPath: redirects.toPath,
      statusCode: redirects.statusCode,
      origin: redirects.origin,
      createdAt: redirects.createdAt,
      createdByName: users.name,
    })
    .from(redirects)
    .leftJoin(users, eq(users.id, redirects.createdBy))
    .orderBy(desc(redirects.createdAt));
  return rows as RedirectRow[];
}

export async function createManualRedirect(
  { db }: Deps,
  input: { actor: Actor | null | undefined; fromPath: string; toPath: string },
): Promise<{ id: string; fromPath: string; toPath: string }> {
  const actor = authorize(input.actor);
  const { fromPath, toPath, errors } = validateManualRedirect(input);
  if (errors.fromPath || errors.toPath) {
    throw new AppError("VALIDATION", "Confira os campos.", {
      fieldErrors: errors as Record<string, string[]>,
    });
  }

  return db.transaction(async (tx) => {
    // Segue o destino se ele próprio já redireciona (no máximo alguns saltos: a tabela não tem
    // cadeias, por construção).
    let finalTo = toPath;
    for (let hop = 0; hop < 5; hop++) {
      const next = await findRedirect(tx, finalTo);
      if (!next) break;
      finalTo = next.toPath;
    }
    if (finalTo === fromPath) {
      throw new AppError("VALIDATION", "Confira os campos.", {
        fieldErrors: { toPath: ["Este destino já redireciona de volta para a origem (laço)."] },
      });
    }
    if (await findRedirect(tx, fromPath)) {
      throw new AppError("VALIDATION", "Confira os campos.", {
        fieldErrors: { fromPath: ["Já existe um redirecionamento saindo deste endereço."] },
      });
    }

    await tx.update(redirects).set({ toPath: finalTo }).where(eq(redirects.toPath, fromPath));
    const [row] = await tx
      .insert(redirects)
      .values({ fromPath, toPath: finalTo, origin: "MANUAL", createdBy: actor.id })
      .returning({ id: redirects.id });
    if (!row) throw new Error("Falha ao gravar o redirecionamento.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: "redirect.created",
      entityType: "redirect",
      entityId: row.id,
      metadata: { from: fromPath, to: finalTo },
    });
    return { id: row.id, fromPath, toPath: finalTo };
  });
}

export async function deleteRedirect(
  { db }: Deps,
  input: { actor: Actor | null | undefined; id: string },
): Promise<{ fromPath: string }> {
  const actor = authorize(input.actor);
  return db.transaction(async (tx) => {
    const [row] = await tx
      .delete(redirects)
      .where(eq(redirects.id, input.id))
      .returning({ fromPath: redirects.fromPath, toPath: redirects.toPath });
    if (!row) throw new AppError("NOT_FOUND", "Redirecionamento inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "redirect.deleted",
      entityType: "redirect",
      entityId: input.id,
      metadata: { from: row.fromPath, to: row.toPath },
    });
    return { fromPath: row.fromPath };
  });
}

// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

export const listRedirectsForRoute = (actor: Actor | null | undefined) =>
  listRedirects({ db: getDb() }, actor);
export const createManualRedirectForRoute = (input: {
  actor: Actor | null | undefined;
  fromPath: string;
  toPath: string;
}) => createManualRedirect({ db: getDb() }, input);
export const deleteRedirectForRoute = (input: { actor: Actor | null | undefined; id: string }) =>
  deleteRedirect({ db: getDb() }, input);
