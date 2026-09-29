import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { publicMetadata } from "@/components/site/seo";
import { PRIVACY } from "@/content/dm";

// Texto em src/content/dm.ts.
export const metadata: Metadata = publicMetadata({
  title: PRIVACY.title,
  path: "/politica-de-privacidade",
});

export default function PrivacyPage() {
  return <InstitutionalPage document={PRIVACY} />;
}
