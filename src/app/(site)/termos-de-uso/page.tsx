import type { Metadata } from "next";
import { InstitutionalPage } from "@/components/site/institutional-page";
import { publicMetadata } from "@/components/site/seo";
import { TERMS } from "@/content/dm";

// Texto em src/content/dm.ts.
export const metadata: Metadata = publicMetadata({ title: TERMS.title, path: "/termos-de-uso" });

export default function TermsPage() {
  return <InstitutionalPage document={TERMS} />;
}
