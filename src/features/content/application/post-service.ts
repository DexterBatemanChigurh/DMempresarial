import "server-only";
import { and, eq, sql } from "drizzle-orm";
import type { Database } from "@/db/client";
import { posts } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { isReservedSlug, isValidSlug } from "@/lib/slug";
import { addAutoRedirect } from "@/features/platform/infrastructure/redirects";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, can, type Action, type Actor } from "@/server/permissions";
import { canTransition, requiresPublishChecks, type PostStatus } from "../domain/post-status";
import { postPublishBlockers } from "../domain/publish-rules";
import { loadPostForTransition } from "../infrastructure/post-repository";

/**
 * Serviços de artigo (docs/03, partes 9, 16 e 35). Independentes de Next e de UI: a Server
 * Action só chama estas funções e, com o resultado, invalida o cache (`invalidateTags`).
 *
 * Cada operação roda em UMA transação: trava a linha, autoriza, valida a máquina de estados e
 * os pré-requisitos, aplica com bloqueio otimista e registra a auditoria. Se qualquer passo
 * falhar, nada é gravado.
 */
type Deps = { db: Database };

export type PostMutationResult = {
  id: string;
  slug: string;
  status: PostStatus;
  version: number;
  publishedAt: Date | null;
  /** Tags de cache a invalidar depois do commit (o serviço não conhece o Next). */
  invalidateTags: string[];
};

function permissionFor(from: PostStatus, to: PostStatus): Action {
  if (to === "REVIEW") return "post:submit";
  if (to === "ARCHIVED" || from === "ARCHIVED") return "post:archive";
  // Publicar, agendar e devolver ao rascunho são decisões editoriais.
  return "post:publish";
}

/** Para quem não pode nem ver o artigo, a resposta é "não existe" (não revelar existência: BOLA). */
function mustHideExistence(actor: Actor, ownerId: string | null): boolean {
  return actor.role === "AUTHOR" && ownerId !== actor.id;
}

function tagsFor(slug: string): string[] {
  return [`post:${slug}`, "posts", "sitemap"];
}

function isUniqueViolation(error: unknown): boolean {
  for (let current: unknown = error, depth = 0; current && depth < 5; depth++) {
    if (typeof current === "object" && (current as { code?: unknown }).code === "23505")
      return true;
    current = (current as { cause?: unknown }).cause;
  }
  return false;
}

export type TransitionInput = {
  actor: Actor | null | undefined;
  postId: string;
  to: PostStatus;
  /** Versão que o editor viu. Se mudou, alguém alterou o artigo no meio: CONFLICT. */
  expectedVersion: number;
  scheduledFor?: Date | null;
  now?: Date;
  requestId?: string;
};

export async function transitionPost(
  { db }: Deps,
  input: TransitionInput,
): Promise<PostMutationResult> {
  const { actor, postId, to, expectedVersion } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  const now = input.now ?? new Date();

  return db.transaction(async (tx) => {
    const loaded = await loadPostForTransition(tx, postId);
    if (!loaded) throw new AppError("NOT_FOUND", "Artigo inexistente.");
    const { post } = loaded;
    const from = post.status as PostStatus;

    assertCan(
      actor,
      permissionFor(from, to),
      { ownerId: post.createdBy, status: from, hasBeenPublished: post.firstPublishedAt !== null },
      { hideExistence: mustHideExistence(actor, post.createdBy) },
    );

    if (post.version !== expectedVersion) {
      throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");
    }
    if (!canTransition(from, to)) {
      throw new AppError("DOMAIN_RULE", `Transição inválida: ${from} → ${to}.`);
    }

    if (requiresPublishChecks(to)) {
      const blockers = postPublishBlockers(
        {
          title: post.title,
          slug: post.slug,
          authorId: post.authorId,
          primaryCategoryId: loaded.primaryCategoryId,
          body: post.body,
          coverMediaId: post.coverMediaId,
          coverAltText: loaded.coverAltText,
        },
        { scheduling: to === "SCHEDULED", scheduledFor: input.scheduledFor, now },
      );
      if (blockers.length > 0) {
        throw new AppError("DOMAIN_RULE", "Pré-requisitos de publicação não atendidos.", {
          fieldErrors: { publish: blockers.map((b) => b.message) },
        });
      }
    }

    const values: Partial<typeof posts.$inferInsert> = { status: to, updatedBy: actor.id };
    if (to === "PUBLISHED") {
      values.publishedAt =
        post.publishedAt ?? (from === "SCHEDULED" ? post.scheduledFor : now) ?? now;
      values.firstPublishedAt = post.firstPublishedAt ?? values.publishedAt;
      values.scheduledFor = null;
      values.archivedAt = null;
    } else if (to === "SCHEDULED") {
      values.scheduledFor = input.scheduledFor ?? null;
    } else if (to === "ARCHIVED") {
      values.archivedAt = now;
    } else {
      // DRAFT ou REVIEW: sai de agendamento/arquivo.
      values.scheduledFor = null;
      values.archivedAt = null;
    }

    const [updated] = await tx
      .update(posts)
      .set({ ...values, version: sql`${posts.version} + 1` })
      // A versão também vai no WHERE: defesa extra além do FOR UPDATE.
      .where(and(eq(posts.id, postId), eq(posts.version, expectedVersion)))
      .returning({
        id: posts.id,
        slug: posts.slug,
        status: posts.status,
        version: posts.version,
        publishedAt: posts.publishedAt,
      });
    if (!updated) throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");

    await recordAudit(tx, {
      actorId: actor.id,
      action: `post.${to.toLowerCase()}`,
      entityType: "post",
      entityId: postId,
      metadata: { from, to },
      requestId: input.requestId,
    });

    return {
      ...updated,
      status: updated.status as PostStatus,
      invalidateTags: tagsFor(updated.slug),
    };
  });
}

export type ChangeSlugInput = {
  actor: Actor | null | undefined;
  postId: string;
  newSlug: string;
  expectedVersion: number;
  requestId?: string;
};

/**
 * Muda o slug. Se o artigo já foi público, cria o redirecionamento 301 do endereço antigo
 * na MESMA transação (nunca fica um link publicado quebrado).
 */
export async function changePostSlug(
  { db }: Deps,
  input: ChangeSlugInput,
): Promise<PostMutationResult> {
  const { actor, postId, newSlug, expectedVersion } = input;
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");

  if (!isValidSlug(newSlug)) {
    throw new AppError("VALIDATION", "Slug inválido.", {
      fieldErrors: { slug: ["Use minúsculas, números e hífens (até 80 caracteres)."] },
    });
  }
  if (isReservedSlug(newSlug)) {
    throw new AppError("VALIDATION", "Slug reservado.", {
      fieldErrors: { slug: ["Este endereço é reservado pelo site."] },
    });
  }

  return db.transaction(async (tx) => {
    const loaded = await loadPostForTransition(tx, postId);
    if (!loaded) throw new AppError("NOT_FOUND", "Artigo inexistente.");
    const { post } = loaded;

    assertCan(
      actor,
      "post:edit",
      {
        ownerId: post.createdBy,
        status: post.status as PostStatus,
        hasBeenPublished: post.firstPublishedAt !== null,
      },
      { hideExistence: mustHideExistence(actor, post.createdBy) },
    );
    if (post.version !== expectedVersion) {
      throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");
    }

    const oldSlug = post.slug;
    if (oldSlug === newSlug) {
      return {
        id: post.id,
        slug: oldSlug,
        status: post.status as PostStatus,
        version: post.version,
        publishedAt: post.publishedAt,
        invalidateTags: [],
      };
    }

    let updated;
    try {
      [updated] = await tx
        .update(posts)
        .set({ slug: newSlug, updatedBy: actor.id, version: sql`${posts.version} + 1` })
        .where(and(eq(posts.id, postId), eq(posts.version, expectedVersion)))
        .returning({
          id: posts.id,
          slug: posts.slug,
          status: posts.status,
          version: posts.version,
          publishedAt: posts.publishedAt,
        });
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new AppError("VALIDATION", "Slug já em uso.", {
          fieldErrors: { slug: ["Já existe um artigo com este endereço."] },
        });
      }
      throw error;
    }
    if (!updated) throw new AppError("CONFLICT", "O artigo foi alterado por outra pessoa.");

    // Só há link público a preservar se o artigo já foi publicado alguma vez.
    if (post.firstPublishedAt !== null) {
      await addAutoRedirect(tx, {
        from: `/blog/${oldSlug}`,
        to: `/blog/${newSlug}`,
        actorId: actor.id,
      });
    }

    await recordAudit(tx, {
      actorId: actor.id,
      action: "post.slug_changed",
      entityType: "post",
      entityId: postId,
      metadata: { from: oldSlug, to: newSlug },
      requestId: input.requestId,
    });

    return {
      ...updated,
      status: updated.status as PostStatus,
      invalidateTags: [...tagsFor(oldSlug), ...tagsFor(newSlug), "redirects"],
    };
  });
}

/** Útil para a UI decidir quais botões mostrar (a autorização real acontece nas funções acima). */
export function availableTransitions(
  actor: Actor | null | undefined,
  from: PostStatus,
  resource: { ownerId: string | null; hasBeenPublished: boolean },
  targets: readonly PostStatus[],
): PostStatus[] {
  return targets.filter(
    (to) =>
      canTransition(from, to) && can(actor, permissionFor(from, to), { ...resource, status: from }),
  );
}
