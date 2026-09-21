import "server-only";
import { and, asc, eq } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { specialists } from "@/db/schema";

/**
 * Leitura PÚBLICA de especialistas: só `PUBLISHED` e só da equipe (`TEAM`). Autor convidado
 * nunca tem página pública. Nada de `user_id`, versão ou criadores.
 */
const listed = and(eq(specialists.status, "PUBLISHED"), eq(specialists.kind, "TEAM"));

export async function listPublishedSpecialists(executor: Executor) {
  return executor
    .select({
      slug: specialists.slug,
      name: specialists.name,
      roleTitle: specialists.roleTitle,
      summary: specialists.summary,
      photoMediaId: specialists.photoMediaId,
    })
    .from(specialists)
    .where(listed)
    .orderBy(asc(specialists.position), asc(specialists.name));
}

export async function findPublishedSpecialistBySlug(executor: Executor, slug: string) {
  const [row] = await executor
    .select({
      slug: specialists.slug,
      name: specialists.name,
      roleTitle: specialists.roleTitle,
      summary: specialists.summary,
      bio: specialists.bio,
      photoMediaId: specialists.photoMediaId,
      seoTitle: specialists.seoTitle,
      seoDescription: specialists.seoDescription,
    })
    .from(specialists)
    .where(and(listed, eq(specialists.slug, slug)))
    .limit(1);
  return row ?? null;
}
