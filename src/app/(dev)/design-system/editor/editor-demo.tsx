"use client";

import { useState } from "react";
import { RichTextEditor } from "@/components/admin/rich-text/rich-text-editor";
import { RichText } from "@/components/content/rich-text";
import { Heading, SectionLabel } from "@/components/ui";
import { validateRichText } from "@/lib/rich-text";

/** Demonstração do editor: o que ele produz, se o validador do servidor aceita e como fica publicado. */
export function EditorDemo() {
  const [doc, setDoc] = useState<unknown>(null);
  const result = doc ? validateRichText(doc) : null;

  return (
    <div className="grid gap-2xl lg:grid-cols-2">
      <RichTextEditor
        label="Texto do artigo"
        hint="Selecione um trecho e use a barra de ferramentas."
        onChange={setDoc}
      />
      <div className="space-y-xl">
        <section aria-labelledby="demo-validacao">
          <SectionLabel>Validação do servidor</SectionLabel>
          <p id="demo-validacao" data-testid="validation" className="mt-sm font-sans text-body-sm">
            {result === null
              ? "Aguardando edição…"
              : result.ok
                ? "VÁLIDO: o servidor aceitaria este texto."
                : `INVÁLIDO: ${result.errors.map((e) => e.message).join(" | ")}`}
          </p>
        </section>
        <section aria-labelledby="demo-json">
          <SectionLabel>JSON produzido</SectionLabel>
          <pre
            id="demo-json"
            data-testid="json"
            className="mt-sm max-h-64 overflow-auto bg-surface-muted p-md font-mono text-caption"
          >
            {JSON.stringify(doc, null, 1)}
          </pre>
        </section>
        <section aria-labelledby="demo-previa">
          <Heading as="h2" variant="h3" id="demo-previa">
            Como fica publicado
          </Heading>
          <div data-testid="preview" className="mt-md">
            <RichText value={doc} />
          </div>
        </section>
      </div>
    </div>
  );
}
