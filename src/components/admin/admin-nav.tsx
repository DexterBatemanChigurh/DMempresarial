"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType, type SVGProps } from "react";
import {
  ClipboardIcon,
  CloseIcon,
  FileTextIcon,
  HomeIcon,
  ImageIcon,
  InboxIcon,
  LockIcon,
  MenuIcon,
  SlidersIcon,
  TagIcon,
  UsersIcon,
} from "@/components/ui/icons";

type Icon = ComponentType<SVGProps<SVGSVGElement>>;

/** Ícone de cada tela do painel (a lista de itens vem do servidor, já filtrada por permissão). */
const ICONS: Record<string, Icon> = {
  "/admin": HomeIcon,
  "/admin/artigos": FileTextIcon,
  "/admin/categorias": TagIcon,
  "/admin/leads": InboxIcon,
  "/admin/configuracoes": SlidersIcon,
  "/admin/usuarios": UsersIcon,
  "/admin/auditoria": ClipboardIcon,
  "/admin/midia": ImageIcon,
  "/admin/seguranca": LockIcon,
};

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({ items }: { items: { href: string; label: string }[] }) {
  const pathname = usePathname();
  // Só no celular: a lista fica recolhida atrás do botão "Menu". No desktop ela é sempre visível.
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-controls="admin-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-xs rounded-control border-[1.5px] border-text px-md font-sans text-sm font-semibold text-text lg:hidden"
      >
        {open ? (
          <CloseIcon aria-hidden="true" className="size-5" />
        ) : (
          <MenuIcon aria-hidden="true" className="size-5" />
        )}
        Menu
      </button>

      <nav
        id="admin-menu"
        aria-label="Painel"
        className={`${open ? "block" : "hidden"} basis-full lg:block`}
      >
        <ul className="flex flex-col gap-2xs">
          {items.map((item) => {
            const Icon = ICONS[item.href];
            const active = isActive(pathname, item.href);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`flex min-h-11 items-center gap-sm rounded-control px-md font-sans text-sm font-semibold transition-colors duration-150 ease-standard focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                    active
                      ? "bg-surface text-text"
                      : "text-text-secondary hover:bg-surface hover:text-text"
                  }`}
                >
                  {Icon ? <Icon aria-hidden="true" className="size-5 shrink-0" /> : null}
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
