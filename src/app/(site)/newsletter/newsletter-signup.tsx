import { connection } from "next/server";
import { Heading, Text } from "@/components/ui";
import { NewsletterForm } from "@/components/site/newsletter-form";
import { mintFormToken } from "@/server/security/form-token";
import { subscribeNewsletterAction } from "./actions";

/**
 * Bloco "Receba conteúdos da DM" (docs/01 §23). Componente de servidor que cunha o token de
 * tempo mínimo a cada requisição: fica dentro de um `<Suspense>` na página, então o resto dela
 * continua em cache e só este trecho renderiza por requisição.
 */
export async function NewsletterSignup({ source }: { source: string }) {
  await connection();
  return (
    <div className="max-w-reading">
      <Heading as="h2" variant="h2">
        Receba conteúdos da DM
      </Heading>
      <Text tone="secondary" className="mt-sm mb-lg">
        Os novos artigos do blog da DM no seu e-mail.
      </Text>
      <NewsletterForm
        action={subscribeNewsletterAction}
        formToken={mintFormToken()}
        source={source}
      />
    </div>
  );
}
