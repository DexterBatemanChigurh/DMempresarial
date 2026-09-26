import type { Metadata } from "next";
import { NewsletterTokenPage } from "@/components/site/newsletter-token-page";
import { unsubscribeNewsletterAction } from "../actions";

export const metadata: Metadata = {
  title: "Cancelar inscrição na newsletter",
  robots: { index: false, follow: false },
};

export default function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  return (
    <NewsletterTokenPage
      kind="unsubscribe"
      searchParams={searchParams}
      action={unsubscribeNewsletterAction}
    />
  );
}
