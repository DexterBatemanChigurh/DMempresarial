"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  changePostSlugAction,
  deletePostAction,
  transitionPostAction,
  type PostMutated,
} from "@/app/admin/(painel)/artigos/actions";
import { Button, FormMessage, TextField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";
import type { PostStatus } from "@/features/content/domain/post-status";

const STATUS_LABEL: Record<PostStatus, string> = {
  DRAFT: "Rascunho",
  REVIEW: "Em revisão",
  SCHEDULED: "Agendado",
  PUBLISHED: "Publicado",
  ARCHIVED: "Arquivado",
};

const TRANSITION_LABEL: Record<PostStatus, string> = {
  DRAFT: "Voltar para rascunho",
  REVIEW: "Enviar para revisão",
  SCHEDULED: "Agendar",
  PUBLISHED: "Publicar",
  ARCHIVED: "Arquivar",
};

type Props = {
  postId: string;
  status: PostStatus;
  version: number;
  slug: string;
  scheduledFor: string | null;
  /** Calculado no servidor por `availableTransitions`, a partir do estado atual e de quem está
   * vendo a tela. Depois de qualquer mutação, `router.refresh()` busca este prop de novo: ele
   * nunca é recalculado no navegador (a autorização real também não é). */
  targets: PostStatus[];
  canDelete: boolean;
  canChangeSlug: boolean;
};

export function PostStatusPanel({
  postId,
  status,
  version,
  slug,
  scheduledFor,
  targets,
  canDelete,
  canChangeSlug,
}: Props) {
  const router = useRouter();

  const [transitionState, transitionFormAction, transitionPending] = useActionState<
    ActionResult<PostMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await transitionPostAction(prevState, formData);
    if (result.ok) router.refresh();
    return result;
  }, null);

  const [slugState, slugFormAction, slugPending] = useActionState<
    ActionResult<PostMutated> | null,
    FormData
  >(async (prevState, formData) => {
    const result = await changePostSlugAction(prevState, formData);
    if (result.ok) router.refresh();
    return result;
  }, null);

  const [deleteState, deleteFormAction, deletePending] = useActionState<
    ActionResult<{ id: string }> | null,
    FormData
  >(deletePostAction, null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const transitionFieldErrors =
    transitionState && !transitionState.ok ? transitionState.error.fieldErrors : undefined;

  return (
    <div className="space-y-lg border border-border p-lg">
      <p className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
        Status: {STATUS_LABEL[status]}
      </p>

      {transitionState && !transitionState.ok ? (
        <FormMessage tone="error">{transitionState.error.message}</FormMessage>
      ) : null}
      {transitionFieldErrors?.publish ? (
        <FormMessage tone="error" title="Faltam requisitos para publicar">
          <ul className="list-disc pl-lg">
            {transitionFieldErrors.publish.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </FormMessage>
      ) : null}

      {targets.length > 0 ? (
        <form action={transitionFormAction} className="space-y-sm">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="expectedVersion" value={version} />
          {targets.includes("SCHEDULED") ? (
            <TextField
              id="scheduledFor"
              name="scheduledFor"
              label="Data e hora de publicação (para agendar)"
              type="datetime-local"
              defaultValue={scheduledFor ?? ""}
            />
          ) : null}
          <div className="flex flex-wrap gap-sm">
            {targets.map((to) => (
              <Button
                key={to}
                type="submit"
                name="to"
                value={to}
                variant={to === "PUBLISHED" ? "primary" : "secondary"}
                size="sm"
                loading={transitionPending}
                loadingLabel="Aplicando…"
              >
                {TRANSITION_LABEL[to]}
              </Button>
            ))}
          </div>
        </form>
      ) : (
        <p className="font-sans text-caption text-text-secondary">
          Nenhuma transição de estado disponível para você agora.
        </p>
      )}

      {/* Preview Button - only for non-published statuses */}
      {status !== "PUBLISHED" && status !== "ARCHIVED" ? (
        <div className="border-t border-border pt-lg">
          <form
            action={`/api/preview?postId=${postId}&slug=${encodeURIComponent(slug)}`}
            target="_blank"
            className="mt-lg"
          >
            <Button type="submit" variant="secondary" size="sm">
              Visualizar rascunho
            </Button>
          </form>
        </div>
      ) : null}

      {canChangeSlug ? (
        <form action={slugFormAction} className="space-y-sm border-t border-border pt-lg">
          <input type="hidden" name="postId" value={postId} />
          <input type="hidden" name="expectedVersion" value={version} />
          {slugState && !slugState.ok ? (
            <FormMessage tone="error">{slugState.error.message}</FormMessage>
          ) : null}
          <TextField
            id="newSlug"
            name="newSlug"
            label="Mudar endereço (slug)"
            defaultValue={slug}
            error={slugState && !slugState.ok ? slugState.error.fieldErrors?.slug?.[0] : undefined}
            hint="Se o artigo já foi publicado, o endereço antigo passa a redirecionar para o novo."
          />
          <Button
            type="submit"
            variant="secondary"
            size="sm"
            loading={slugPending}
            loadingLabel="Salvando…"
          >
            Salvar endereço
          </Button>
        </form>
      ) : null}

      {canDelete ? (
        <div className="border-t border-border pt-lg">
          {deleteState && !deleteState.ok ? (
            <FormMessage tone="error" className="mb-sm">
              {deleteState.error.message}
            </FormMessage>
          ) : null}
          {confirmingDelete ? (
            <form action={deleteFormAction} className="flex items-center gap-sm">
              <input type="hidden" name="postId" value={postId} />
              <span className="font-sans text-caption text-text-secondary">Excluir de vez?</span>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                loading={deletePending}
                loadingLabel="Excluindo…"
              >
                Confirmar exclusão
              </Button>
              <Button
                type="button"
                size="sm"
                variant="tertiary"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancelar
              </Button>
            </form>
          ) : (
            <Button
              type="button"
              size="sm"
              variant="tertiary"
              onClick={() => setConfirmingDelete(true)}
            >
              Excluir rascunho
            </Button>
          )}
        </div>
      ) : null}
    </div>
  );
}
