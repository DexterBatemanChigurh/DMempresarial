import type { Metadata } from "next";
import { Heading, Text } from "@/components/ui";
import { listUsersForAdminForRoute } from "@/features/users/application/user-crud";
import { CreateUserForm } from "@/components/admin/users/create-user-form";
import { UserRowActions } from "@/components/admin/users/user-row-actions";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { createUserAction, setDisabledAction, setRoleAction } from "./actions";

export const metadata: Metadata = { title: "Usuários" };

export default async function UsersPage() {
  const { actor } = await requireAdminSession();
  const users = await listUsersForAdminForRoute(actor);

  return (
    <>
      <Heading as="h1" variant="h1">
        Usuários
      </Heading>
      <Text tone="secondary" className="mt-md mb-xl max-w-reading">
        Sem senha padrão: a temporária aparece uma única vez logo após criar. Contas nunca são
        apagadas, só desativadas (preserva autoria e auditoria).
      </Text>

      <div className="mb-xl max-w-reading">
        <CreateUserForm action={createUserAction} />
      </div>

      {users.length === 0 ? (
        <Text tone="secondary">Nenhum usuário ainda.</Text>
      ) : (
        <ul className="divide-y divide-border border-t border-b border-border">
          {users.map((user) => (
            <li key={user.id} className="flex flex-wrap items-center justify-between gap-sm py-sm">
              <div>
                <p className="font-sans font-semibold">{user.name}</p>
                <p className="font-sans text-caption text-text-secondary">
                  {user.email} · {user.role} · {user.disabledAt ? "Desativado" : "Ativo"}
                </p>
              </div>
              <UserRowActions
                userId={user.id}
                role={user.role}
                disabled={user.disabledAt !== null}
                isSelf={user.id === actor.id}
                setRoleAction={setRoleAction}
                setDisabledAction={setDisabledAction}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
