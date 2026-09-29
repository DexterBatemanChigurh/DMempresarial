import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { Heading, Text } from "@/components/ui";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Segurança" };

// Lê a sessão (`requireAdminSession` → cookies) no servidor: dado de requisição. O grupo
// `(conta)` não herda o `instant = false` do layout do painel, então marca aqui.
export const instant = false;

export default async function SecurityPage() {
  await requireAdminSession();

  return (
    <>
      <Heading as="h1" variant="h1">
        Segurança da conta
      </Heading>

      <section aria-labelledby="senha" className="mt-2xl space-y-lg">
        <Heading as="h2" variant="h2" id="senha">
          Alterar senha
        </Heading>
        <Text tone="secondary" className="max-w-reading">
          Ao alterar a senha, as sessões abertas em outros aparelhos são encerradas.
        </Text>
        <ChangePasswordForm />
      </section>
    </>
  );
}
