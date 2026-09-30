"use client";

import { usePathname } from "next/navigation";
import { WhatsAppIcon } from "@/components/ui/icons";

/**
 * Botão flutuante do WhatsApp. Some nas páginas de contato (`/contato` e filhas): ali o mesmo
 * canal já aparece no corpo da página, e o botão cobria o texto no canto do celular.
 */
export function WhatsAppFloat({ number }: { number: string }) {
  const pathname = usePathname();
  if (pathname === "/contato" || pathname.startsWith("/contato/")) return null;
  return (
    <a
      href={`https://wa.me/${number}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Conversar com a DM pelo WhatsApp (abre em nova aba)"
      className="fixed right-lg bottom-lg z-40 flex size-14 items-center justify-center rounded-full bg-whatsapp text-papel shadow-overlay transition-colors duration-150 ease-standard hover:bg-whatsapp-texto"
    >
      <WhatsAppIcon className="size-8" />
    </a>
  );
}
