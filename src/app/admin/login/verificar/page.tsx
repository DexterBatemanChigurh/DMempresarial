import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Container, Heading, Section, Text } from "@/components/ui";
import { TwoFactorVerifyForm } from "@/components/admin/two-factor-verify-form";
import { getActor } from "@/server/auth/session";
import { safeNextPath } from "@/server/auth/session-cookie";

export const metadata: Metadata = { title: "Verificação em duas etapas" };

// Lê `searchParams` e `cookies` no servidor: dado de requisição. `instant = false` (ver login).
export const instant = false;

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  if (await getActor()) redirect(next);

  // Sem o cookie temporário da etapa anterior não há o que verificar: recomeça o login.
  const jar = await cookies();
  if (!jar.has("dm.two_factor") && !jar.has("__Secure-dm.two_factor")) redirect("/admin/login");

  return (
    <Section spacing="loose">
      <Container size="narrow">
        <Heading as="h1" variant="h1">
          Verificação em duas etapas
        </Heading>
        <Text tone="secondary" className="mt-md mb-xl">
          Informe o código do seu app autenticador para concluir a entrada.
        </Text>
        <TwoFactorVerifyForm next={next} />
      </Container>
    </Section>
  );
}
