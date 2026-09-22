"use client";

import { useId, useRef, useState } from "react";
import { Button, TextField, TextareaField } from "@/components/ui";

type Item = { key: number; title: string; body: string };

/**
 * Lista reordenável de itens (situações, etapas ou objetivos — docs/03, parte 6). Cada item vira
 * um par de campos com o MESMO nome (`<prefix>Title`/`<prefix>Body`), casados por posição no
 * envio — mesma convenção de `categoryIds`/`tagIds` em outros formulários. A chave de cada linha
 * é um contador estável (não o índice): removendo um item do meio, os campos não-controlados dos
 * itens abaixo não "herdam" o texto do vizinho que ocupou a posição antiga.
 */
export function SolutionItemsField({
  legend,
  hint,
  prefix,
  initial,
}: {
  legend: string;
  hint?: string;
  prefix: string;
  initial: { title: string; body: string | null }[];
}) {
  // Chaves iniciais são os próprios índices (computados uma vez, sem ler a ref durante a
  // renderização); itens adicionados depois (só em manipuladores de evento) pegam daqui em diante.
  const nextKey = useRef(initial.length);
  const [items, setItems] = useState<Item[]>(() =>
    initial.map((item, index) => ({ key: index, title: item.title, body: item.body ?? "" })),
  );
  const legendId = useId();

  return (
    <fieldset className="space-y-md" aria-labelledby={legendId}>
      <legend id={legendId} className="mb-xs font-sans text-sm font-semibold text-text">
        {legend}
      </legend>
      {hint ? <p className="font-sans text-caption text-text-secondary">{hint}</p> : null}
      {items.map((item, index) => (
        <div key={item.key} className="space-y-sm border border-border p-md">
          <TextField
            id={`${prefix}-title-${item.key}`}
            name={`${prefix}Title`}
            label={`Título (item ${index + 1})`}
            defaultValue={item.title}
          />
          <TextareaField
            id={`${prefix}-body-${item.key}`}
            name={`${prefix}Body`}
            label="Texto"
            defaultValue={item.body}
          />
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            onClick={() => setItems((current) => current.filter((i) => i.key !== item.key))}
          >
            Remover item
          </Button>
        </div>
      ))}
      <Button
        type="button"
        size="sm"
        variant="secondary"
        onClick={() =>
          setItems((current) => [...current, { key: nextKey.current++, title: "", body: "" }])
        }
      >
        Adicionar item
      </Button>
    </fieldset>
  );
}
