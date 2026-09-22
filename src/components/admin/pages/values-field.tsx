"use client";

import { useId, useRef, useState } from "react";
import { Button, TextField } from "@/components/ui";

type ValueRow = { key: number; name: string; practice: string };

/**
 * Lista reordenável dos valores da DM, cada um com uma frase de "como se vê na prática" (docs/01,
 * seção 10). Mesma convenção de `SolutionItemsField`: chave estável (contador, não índice), para
 * que remover um item do meio não faça um campo não controlado abaixo herdar texto do vizinho.
 */
export function ValuesField({ initial }: { initial: { name: string; practice: string }[] }) {
  const nextKey = useRef(initial.length);
  const [values, setValues] = useState<ValueRow[]>(() =>
    initial.map((value, index) => ({ key: index, name: value.name, practice: value.practice })),
  );
  const legendId = useId();

  return (
    <fieldset className="space-y-md" aria-labelledby={legendId}>
      <legend id={legendId} className="mb-xs font-sans text-sm font-semibold text-text">
        Valores
      </legend>
      <p className="font-sans text-caption text-text-secondary">
        No máximo 5, os mesmos já confirmados pela DM. Cada um pode ganhar uma frase de como se vê
        na prática.
      </p>
      {values.map((value, index) => (
        <div key={value.key} className="space-y-sm border border-border p-md">
          <TextField
            id={`value-name-${value.key}`}
            name="valueName"
            label={`Valor (item ${index + 1})`}
            defaultValue={value.name}
          />
          <TextField
            id={`value-practice-${value.key}`}
            name="valuePractice"
            label="Como se vê na prática"
            defaultValue={value.practice}
          />
          <Button
            type="button"
            size="sm"
            variant="tertiary"
            onClick={() => setValues((current) => current.filter((v) => v.key !== value.key))}
          >
            Remover valor
          </Button>
        </div>
      ))}
      {values.length < 5 ? (
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() =>
            setValues((current) => [...current, { key: nextKey.current++, name: "", practice: "" }])
          }
        >
          Adicionar valor
        </Button>
      ) : null}
    </fieldset>
  );
}
