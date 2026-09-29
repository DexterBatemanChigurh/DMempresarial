import type { Metadata } from "next";
import { NotFoundContent } from "@/components/site/not-found-content";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: false },
};

// `notFound()` lançado nas páginas do grupo: já está dentro do layout (cabeçalho e rodapé).
export default function NotFound() {
  return <NotFoundContent />;
}
