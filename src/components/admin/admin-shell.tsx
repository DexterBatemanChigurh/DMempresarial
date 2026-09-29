import Link from "next/link";
import type { ReactNode } from "react";
import { Text } from "@/components/ui";
import { AdminNav } from "./admin-nav";
import { LogoutButton } from "./logout-button";

/**
 * Moldura do painel: barra lateral com a navegação (no celular, recolhida atrás de "Menu"),
 * quem está logado e "Sair"; o conteúdo da tela fica à direita. Componente de servidor; só o
 * menu e o botão de sair são do navegador. Só lista páginas que existem.
 */
const ROLE_LABEL = { ADMIN: "Administrador", EDITOR: "Editor", AUTHOR: "Autor" } as const;

export function AdminShell({
  user,
  role,
  nav,
  children,
}: {
  user: { name: string };
  role: keyof typeof ROLE_LABEL;
  nav: { href: string; label: string }[];
  children: ReactNode;
}) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <header className="border-b border-border bg-surface-muted lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col lg:border-r lg:border-b-0">
        <div className="flex flex-wrap items-center justify-between gap-md px-lg py-md lg:block lg:px-md lg:py-lg">
          <Link
            href="/admin"
            className="inline-flex min-h-11 flex-col justify-center px-md font-serif text-h4 leading-tight font-medium whitespace-nowrap text-text"
          >
            DM Empresarial
            <span className="font-sans text-caption font-normal text-text-secondary">Painel</span>
          </Link>
          <div className="contents lg:mt-lg lg:block">
            <AdminNav items={nav} />
          </div>
        </div>

        <div className="hidden border-t border-border px-lg py-md lg:mt-auto lg:block">
          <Text size="caption" className="font-semibold">
            {user.name}
          </Text>
          <Text size="caption" tone="secondary">
            {ROLE_LABEL[role]}
          </Text>
          <div className="mt-sm">
            <LogoutButton />
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="min-w-0 bg-surface outline-none">
        {/* No celular, quem está logado e "Sair" ficam no topo do conteúdo. */}
        <div className="flex flex-wrap items-center justify-between gap-md border-b border-border px-lg py-sm lg:hidden">
          <Text as="span" size="caption" tone="secondary">
            {user.name} · {ROLE_LABEL[role]}
          </Text>
          <LogoutButton />
        </div>
        <div className="mx-auto max-w-[1120px] px-lg py-2xl md:px-2xl lg:px-3xl">{children}</div>
      </main>
    </div>
  );
}
