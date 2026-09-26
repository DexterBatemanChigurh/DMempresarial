import type { Metadata } from "next";
import { NewsletterTokenPage } from "@/components/site/newsletter-token-page";
import { confirmNewsletterAction } from "../actions";

export const metadata: Metadata = {
  title: "Confirmação da newsletter",
  robots: { index: false, follow: false },
};

export default function NewsletterConfirmPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; status?: string }>;
}) {
  return (
    <NewsletterTokenPage
      kind="confirm"
      searchParams={searchParams}
      action={confirmNewsletterAction}
    />
  );
}
