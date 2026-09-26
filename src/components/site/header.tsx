"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@/components/ui";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";
import { cn } from "@/lib/cn";

/**
 * Cabeçalho público (Blueprint 2, seção 16; itens do Prompt 1 §6). Sem mega-menu: "Soluções"
 * leva direto ao índice e "Serviços" à visão filtrada.
 * O CTA é o único elemento de destaque e some do topo só para reaparecer fixo no painel mobile.
 */
const NAV = [
  { href: "/sobre", label: "Sobre" },
  { href: "/solucoes", label: "Soluções" },
  { href: "/servicos", label: "Serviços" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

function useScrolled(threshold = 80) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return scrolled;
}

export function Header() {
  const pathname = usePathname();
  const scrolled = useScrolled();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open) dialog.showModal();
    else if (dialog.open) dialog.close();
  }, [open]);

  // O <dialog> nativo já prende o foco e fecha com Esc; só precisamos sincronizar nosso estado
  // quando ele fecha por Esc (o evento "close" dispara nesse caso também).
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const onClose = () => setOpen(false);
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  function isActive(href: string) {
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex items-center border-b border-transparent bg-surface transition-[height,border-color] duration-200 ease-standard",
        scrolled ? "h-16 border-border" : "h-20",
      )}
    >
      <div className="mx-auto flex w-full max-w-wide items-center justify-between px-5 sm:px-6 md:px-8 lg:px-10">
        <Link href="/" className="font-serif text-h4 font-medium text-text">
          DM Empresarial
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-xl md:flex">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? "page" : undefined}
              className={cn(
                "font-sans text-body font-medium text-text-secondary transition-colors hover:text-text",
                isActive(item.href) && "text-text underline underline-offset-8",
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:block">
          <Button href="/contato" size="sm">
            Fale com a DM
          </Button>
        </div>

        <IconButton
          label="Abrir menu"
          aria-expanded={open}
          className="md:hidden"
          onClick={() => setOpen(true)}
        >
          <MenuIcon />
        </IconButton>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Menu"
        className="m-0 h-dvh max-h-none w-full max-w-none border-0 bg-surface p-0 backdrop:bg-tinta/40"
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-5 py-md sm:px-6">
            <span className="font-serif text-h4 font-medium text-text">DM Empresarial</span>
            <IconButton label="Fechar menu" onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </div>
          <nav aria-label="Principal" className="flex flex-1 flex-col gap-lg px-5 py-xl sm:px-6">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                onClick={() => setOpen(false)}
                className="font-serif text-h2 font-medium text-text"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-border px-5 py-lg sm:px-6">
            <Button href="/contato" size="lg" className="w-full" onClick={() => setOpen(false)}>
              Fale com a DM
            </Button>
          </div>
        </div>
      </dialog>
    </header>
  );
}
