"use client";

import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import { useId, useState } from "react";
import { Button, TextField } from "@/components/ui";
import { MediaPicker } from "@/components/admin/media/media-picker";
import { cn } from "@/lib/cn";
import { EMPTY_DOC, isAllowedHref, validateRichText } from "@/lib/rich-text";
import { richTextExtensions, toEditorContent } from "./extensions";

const EMPTY_TOOLBAR_STATE = {
  bold: false,
  italic: false,
  h2: false,
  h3: false,
  h4: false,
  bullet: false,
  ordered: false,
  quote: false,
  callout: false,
  link: false,
  canUndo: false,
  canRedo: false,
};

type Props = {
  label: string;
  /** Nome do campo escondido que leva o JSON no envio do formulário. */
  name?: string;
  initialValue?: unknown;
  hint?: string;
  error?: string;
  onChange?: (doc: unknown) => void;
};

function ToolButton({
  label,
  text,
  active = false,
  disabled = false,
  onClick,
}: {
  label: string;
  text: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-control border px-sm font-sans text-sm font-semibold transition-colors duration-150 ease-standard disabled:cursor-not-allowed disabled:bg-surface-disabled disabled:text-text-disabled",
        active
          ? "border-text bg-text text-surface"
          : "border-field-border bg-surface-raised text-text hover:border-text",
      )}
    >
      {text}
    </button>
  );
}

/**
 * Editor de texto rico do CMS (Tiptap). Só produz o que a lista de permissão aceita; o servidor
 * valida DE NOVO o que receber (este editor não é uma barreira de segurança, é conveniência).
 */
export function RichTextEditor({
  label,
  name = "body",
  initialValue,
  hint,
  error,
  onChange,
}: Props) {
  const labelId = useId();
  const hintId = useId();
  const errorId = useId();
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkHref, setLinkHref] = useState("");
  const [linkError, setLinkError] = useState<string | null>(null);

  const parsed = validateRichText(initialValue ?? EMPTY_DOC);
  const [json, setJson] = useState<unknown>(parsed.ok ? parsed.doc : EMPTY_DOC);

  const editor = useEditor({
    extensions: richTextExtensions(),
    content: toEditorContent(parsed.ok ? parsed.doc : EMPTY_DOC),
    // Next.js renderiza no servidor: o editor só nasce no navegador.
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": labelId,
        ...(hint ? { "aria-describedby": hintId } : {}),
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = current.getJSON();
      setJson(next);
      onChange?.(next);
    },
  });

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            h4: e.isActive("heading", { level: 4 }),
            bullet: e.isActive("bulletList"),
            ordered: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            callout: e.isActive("callout"),
            link: e.isActive("link"),
            canUndo: e.can().undo(),
            canRedo: e.can().redo(),
          }
        : null,
  });

  if (!editor) {
    return (
      <div>
        <p id={labelId} className="mb-xs font-sans text-sm font-semibold text-text">
          {label}
        </p>
        <div className="min-h-64 border border-field-border bg-surface-raised" aria-busy="true" />
      </div>
    );
  }

  const tool = state ?? EMPTY_TOOLBAR_STATE;
  const run = () => editor.chain().focus();

  function openLink() {
    setLinkHref((editor?.getAttributes("link").href as string | undefined) ?? "");
    setLinkError(null);
    setLinkOpen(true);
  }

  function applyLink() {
    const href = linkHref.trim();
    // A MESMA regra do servidor: se o editor aceita, o servidor também aceita.
    if (!isAllowedHref(href)) {
      setLinkError(
        "Endereço inválido. Use https://, http://, mailto:, tel: ou um caminho do site (/blog/...).",
      );
      return;
    }
    run().extendMarkRange("link").setLink({ href }).run();
    setLinkOpen(false);
  }

  return (
    <div className="rich-editor">
      <p id={labelId} className="mb-xs font-sans text-sm font-semibold text-text">
        {label}
      </p>

      <div role="toolbar" aria-label="Formatação do texto" className="mb-sm flex flex-wrap gap-xs">
        <ToolButton
          label="Negrito"
          text="N"
          active={tool.bold}
          onClick={() => run().toggleBold().run()}
        />
        <ToolButton
          label="Itálico"
          text="I"
          active={tool.italic}
          onClick={() => run().toggleItalic().run()}
        />
        <ToolButton
          label="Título de nível 2"
          text="T2"
          active={tool.h2}
          onClick={() => run().toggleHeading({ level: 2 }).run()}
        />
        <ToolButton
          label="Título de nível 3"
          text="T3"
          active={tool.h3}
          onClick={() => run().toggleHeading({ level: 3 }).run()}
        />
        <ToolButton
          label="Título de nível 4"
          text="T4"
          active={tool.h4}
          onClick={() => run().toggleHeading({ level: 4 }).run()}
        />
        <ToolButton
          label="Lista com marcadores"
          text="Lista"
          active={tool.bullet}
          onClick={() => run().toggleBulletList().run()}
        />
        <ToolButton
          label="Lista numerada"
          text="1. 2."
          active={tool.ordered}
          onClick={() => run().toggleOrderedList().run()}
        />
        <ToolButton
          label="Citação"
          text="Citação"
          active={tool.quote}
          onClick={() => run().toggleBlockquote().run()}
        />
        <ToolButton
          label="Destaque Aplicação na empresa"
          text="Destaque"
          active={tool.callout}
          onClick={() => run().toggleCallout().run()}
        />
        <ToolButton
          label="Linha divisória"
          text="Linha"
          onClick={() => run().setHorizontalRule().run()}
        />
        <ToolButton label="Link" text="Link" active={tool.link} onClick={openLink} />
        <MediaPicker
          onPick={({ mediaId, alt }) =>
            run()
              .insertContent({ type: "image", attrs: { mediaId, caption: alt || undefined } })
              .run()
          }
        />
        <ToolButton
          label="Desfazer"
          text="Desfazer"
          disabled={!tool.canUndo}
          onClick={() => run().undo().run()}
        />
        <ToolButton
          label="Refazer"
          text="Refazer"
          disabled={!tool.canRedo}
          onClick={() => run().redo().run()}
        />
      </div>

      {linkOpen ? (
        <div
          role="group"
          aria-label="Definir link"
          className="mb-sm space-y-sm border border-border p-md"
        >
          <TextField
            id={`${labelId}-href`}
            name={`${labelId}-href`}
            label="Endereço do link"
            value={linkHref}
            error={linkError ?? undefined}
            onChange={(event) => {
              setLinkHref(event.target.value);
              setLinkError(null);
            }}
            onKeyDown={(event) => {
              // Enter aplica o link e não envia o formulário em volta.
              if (event.key === "Enter") {
                event.preventDefault();
                applyLink();
              }
            }}
            autoComplete="off"
          />
          <div className="flex flex-wrap gap-xs">
            <Button type="button" size="sm" onClick={applyLink}>
              Aplicar link
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => {
                run().extendMarkRange("link").unsetLink().run();
                setLinkOpen(false);
              }}
            >
              Remover link
            </Button>
            <Button type="button" size="sm" variant="tertiary" onClick={() => setLinkOpen(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      ) : null}

      <EditorContent editor={editor} />
      <input type="hidden" name={name} value={JSON.stringify(json)} />

      {hint ? (
        <p id={hintId} className="mt-xs font-sans text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={errorId}
          role="alert"
          className="mt-xs font-sans text-caption font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
