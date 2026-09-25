"use client";

import { useActionState } from "react";
import { Button, FormMessage, SelectField } from "@/components/ui";
import type { ActionResult } from "@/lib/result";

type RowResult = ActionResult<{ userId: string }>;
type RowAction = (prevState: RowResult | null, formData: FormData) => Promise<RowResult>;

type Props = {
  userId: string;
  role: "ADMIN" | "EDITOR" | "AUTHOR";
  disabled: boolean;
  isSelf: boolean;
  setRoleAction: RowAction;
  setDisabledAction: RowAction;
  deleteAction: RowAction;
};

export function UserRowActions({
  userId,
  role,
  disabled,
  isSelf,
  setRoleAction,
  setDisabledAction,
  deleteAction,
}: Props) {
  const [roleState, roleFormAction, rolePending] = useActionState<RowResult | null, FormData>(
    setRoleAction,
    null,
  );
  const [disabledState, disabledFormAction, disabledPending] = useActionState<
    RowResult | null,
    FormData
  >(setDisabledAction, null);
  const [deleteState, deleteFormAction, deletePending] = useActionState<RowResult | null, FormData>(
    deleteAction,
    null,
  );

  if (isSelf) {
    return <span>(você)</span>;
  }

  return (
    <div className="flex items-center gap-sm">
      <form action={roleFormAction} className="flex items-center gap-xs">
        <input type="hidden" name="userId" value={userId} />
        <SelectField
          id={`role-${userId}`}
          name="role"
          label="Papel"
          defaultValue={role}
          options={[
            { value: "ADMIN", label: "ADMIN" },
            { value: "EDITOR", label: "EDITOR" },
            { value: "AUTHOR", label: "AUTHOR" },
          ]}
        />
        <Button type="submit" variant="secondary" loading={rolePending}>
          Salvar papel
        </Button>
      </form>
      <form action={disabledFormAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="disabled" value={disabled ? "false" : "true"} />
        <Button type="submit" variant="secondary" loading={disabledPending}>
          {disabled ? "Reativar" : "Desativar"}
        </Button>
      </form>
      <form
        action={deleteFormAction}
        onSubmit={(e) => {
          if (!confirm("Excluir este usuário? A ação é irreversível.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="userId" value={userId} />
        <Button
          type="submit"
          variant="secondary"
          loading={deletePending}
          className="text-error hover:bg-error/10"
        >
          Excluir
        </Button>
      </form>
      {roleState && !roleState.ok ? (
        <FormMessage tone="error">{roleState.error.message}</FormMessage>
      ) : null}
      {disabledState && !disabledState.ok ? (
        <FormMessage tone="error">{disabledState.error.message}</FormMessage>
      ) : null}
      {deleteState && !deleteState.ok ? (
        <FormMessage tone="error">{deleteState.error.message}</FormMessage>
      ) : null}
    </div>
  );
}
