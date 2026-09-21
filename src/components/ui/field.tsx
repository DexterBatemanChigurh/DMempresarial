import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { AlertIcon } from "./icons";

/**
 * Campos de formulário (Blueprint 2, seção 15). Contrato de acessibilidade, igual em todos:
 *  - rótulo SEMPRE visível, acima do campo, associado por `for`/`id` (placeholder não é rótulo);
 *  - obrigatório indicado por TEXTO, não só por asterisco;
 *  - ajuda e erro ligados ao controle por `aria-describedby`; `aria-invalid` quando há erro;
 *  - erro com ícone + texto e `role="alert"` (nunca só cor).
 * Altura de 48 px (alvo de toque), raio de controle (4 px), borda de 3:1 sobre o fundo.
 */
type FieldBase = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

const CONTROL =
  "w-full rounded-control border border-field-border bg-surface-raised px-md font-sans text-base text-text placeholder:text-text-muted hover:border-text focus-visible:border-focus focus-visible:outline-2 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger disabled:cursor-not-allowed disabled:border-transparent disabled:bg-surface-disabled disabled:text-text-disabled";

function describedBy({ id, hint, error }: Pick<FieldBase, "id" | "hint" | "error">) {
  return (
    [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") ||
    undefined
  );
}

function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  children,
}: FieldBase & { children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-xs block font-sans text-sm font-semibold text-text">
        {label}
        {required ? (
          <span className="ml-xs font-normal text-text-secondary">(obrigatório)</span>
        ) : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-xs font-sans text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-xs flex items-start gap-xs font-sans text-caption font-medium text-danger"
        >
          <AlertIcon className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}

type InputProps = FieldBase &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "className" | "aria-invalid" | "aria-describedby"
  >;

export function TextField({ id, label, hint, error, required, ...input }: InputProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <input
        id={id}
        name={input.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cn(CONTROL, "h-12")}
        {...input}
      />
    </FieldShell>
  );
}

type TextareaProps = FieldBase &
  Omit<
    TextareaHTMLAttributes<HTMLTextAreaElement>,
    "id" | "className" | "aria-invalid" | "aria-describedby"
  >;

export function TextareaField({ id, label, hint, error, required, ...textarea }: TextareaProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      <textarea
        id={id}
        name={textarea.name ?? id}
        required={required}
        rows={textarea.rows ?? 6}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cn(CONTROL, "min-h-36 py-sm")}
        {...textarea}
      />
    </FieldShell>
  );
}

type SelectProps = FieldBase &
  Omit<
    SelectHTMLAttributes<HTMLSelectElement>,
    "id" | "className" | "aria-invalid" | "aria-describedby" | "children"
  > & {
    options: readonly { value: string; label: string }[];
    /** Primeira opção vazia (ex.: "Selecione"). Sem ela, o navegador escolhe a primeira da lista. */
    placeholder?: string;
  };

export function SelectField({
  id,
  label,
  hint,
  error,
  required,
  options,
  placeholder,
  ...select
}: SelectProps) {
  return (
    <FieldShell id={id} label={label} hint={hint} error={error} required={required}>
      {/* Lista nativa: comportamento e acessibilidade do navegador, sem lista customizada (v1). */}
      <select
        id={id}
        name={select.name ?? id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy({ id, hint, error })}
        className={cn(CONTROL, "h-12")}
        {...select}
      >
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type CheckboxProps = Omit<FieldBase, "label"> &
  Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "id" | "className" | "type" | "aria-invalid" | "aria-describedby" | "children"
  > & {
    /** Texto do rótulo; pode conter um link (ex.: Política de Privacidade). */
    children: ReactNode;
  };

/** Caixa de marcação com área de toque de 44 px. O rótulo envolve o controle. */
export function CheckboxField({ id, hint, error, required, children, ...input }: CheckboxProps) {
  return (
    <div>
      <label htmlFor={id} className="flex min-h-11 cursor-pointer items-start gap-md py-xs">
        <input
          id={id}
          name={input.name ?? id}
          type="checkbox"
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy({ id, hint, error })}
          className="mt-2xs size-6 shrink-0 cursor-pointer accent-link"
          {...input}
        />
        <span className="font-sans text-body-sm text-text">
          {children}
          {required ? <span className="ml-xs text-text-secondary">(obrigatório)</span> : null}
        </span>
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="font-sans text-caption text-text-secondary">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-xs flex items-start gap-xs font-sans text-caption font-medium text-danger"
        >
          <AlertIcon className="mt-px size-4 shrink-0" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
