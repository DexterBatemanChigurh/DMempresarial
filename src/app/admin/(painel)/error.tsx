"use client";

import { Button, Heading, Text } from "@/components/ui";

export default function AdminError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <div className="max-w-reading py-xl">
      <Heading as="h1" variant="h2">
        Não foi possível carregar esta tela
      </Heading>
      <Text tone="secondary" className="mt-md">
        Tente de novo. Se o erro continuar, anote o código abaixo e repasse ao suporte técnico.
      </Text>
      <div className="mt-lg flex flex-wrap gap-md">
        <Button onClick={() => retry()}>Tentar de novo</Button>
        <Button href="/admin" variant="secondary">
          Voltar ao painel
        </Button>
      </div>
      {error.digest ? (
        <Text size="caption" tone="muted" className="mt-lg">
          Código: {error.digest}
        </Text>
      ) : null}
    </div>
  );
}
