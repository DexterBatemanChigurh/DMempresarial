import type { Metadata } from "next";
import { ChangePasswordForm } from "@/components/admin/change-password-form";
import { TwoFactorSetup } from "@/components/admin/two-factor-setup";
import { FormMessage, Heading, Text } from "@/components/ui";
import { requireAdminSession } from "@/server/auth/admin-guard";
import { requiresTwoFactor } from "@/server/auth/two-factor-policy";

export const metadata: Metadata = { title: "Segurança" };

// Lê a sessão (`requireAdminSession` → cookies) no servidor: dado de requisição. O grupo
// `(conta)` não herda o `instant = false` do layout do painel, então marca aqui.
export const instant = false;

export default async function SecurityPage() {
  const { actor, user } = await requireAdminSession({ allowSetup: true });
  const mustSetup = requiresTwoFactor(actor.role) && !user.twoFactorEnabled;

  return (
    <>
      <Heading as="h1" variant="h1">
        Segurança da conta
      </Heading>

      {mustSetup ? (
        <FormMessage
          tone="info"
          title="Ative a verificação em duas etapas para continuar."
          className="mt-lg max-w-narrow"
        >
          Ela é obrigatória para o seu perfil. Enquanto não for ativada, o restante do painel fica
          indisponível.
        </FormMessage>
      ) : null}

      <div className="mt-2xl space-y-3xl">
        <section aria-labelledby="dois-fatores" className="space-y-lg">
          <Heading as="h2" variant="h2" id="dois-fatores">
            Verificação em duas etapas
          </Heading>
          <TwoFactorSetup enabled={user.twoFactorEnabled} next="/admin" />
        </section>

        <section aria-labelledby="senha" className="space-y-lg">
          <Heading as="h2" variant="h2" id="senha">
            Alterar senha
          </Heading>
          <Text tone="secondary" className="max-w-reading">
            Ao alterar a senha, as sessões abertas em outros aparelhos são encerradas.
          </Text>
          <ChangePasswordForm />
        </section>
      </div>
    </>
  );
}
