import Link from "next/link";
import type { ReactNode } from "react";
import { Container, Text } from "@/components/ui";
import { LogoutButton } from "./logout-button";

/**
 * Moldura do painel: cabeçalho com navegação, quem está logado e "Sair". Componente de servidor;
 * só o botão de sair é do navegador. Só lista páginas que existem.
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
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <Container size="wide" className="flex flex-wrap items-center justify-between gap-md py-md">
          <div className="flex flex-wrap items-center gap-xl">
            <Link href="/admin" className="font-serif text-h4 font-medium text-text">
              DM Empresarial{" "}
              <span className="font-sans text-caption text-text-secondary">Painel</span>
            </Link>
            <nav aria-label="Painel">
              <ul className="flex flex-wrap gap-lg font-sans text-sm font-semibold">
                {nav.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="inline-flex min-h-11 items-center text-link underline-offset-4 hover:underline"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-md">
            <Text as="span" size="caption" tone="secondary">
              {user.name} · {ROLE_LABEL[role]}
            </Text>
            <LogoutButton />
          </div>
        </Container>
      </header>
      <div className="bg-surface">
        <Container size="wide" className="py-2xl">
          {children}
        </Container>
      </div>
    </div>
  );
}
