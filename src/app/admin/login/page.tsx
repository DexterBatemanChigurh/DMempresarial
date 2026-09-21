import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Container, Heading, Section, Text } from "@/components/ui";
import { LoginForm } from "@/components/admin/login-form";
import { getActor } from "@/server/auth/session";
import { safeNextPath } from "@/server/auth/session-cookie";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const next = safeNextPath((await searchParams).next);
  // Quem já tem sessão válida vai direto ao painel (o layout do painel cobra o 2FA).
  if (await getActor()) redirect(next);

  return (
    <Section spacing="loose">
      <Container size="narrow">
        <Heading as="h1" variant="h1">
          Entrar no painel
        </Heading>
        <Text tone="secondary" className="mt-md mb-xl">
          Acesso restrito à equipe da DM Empresarial.
        </Text>
        <LoginForm next={next} />
      </Container>
    </Section>
  );
}
