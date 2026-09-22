import { AdminShell } from "@/components/admin/admin-shell";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

// Todo o painel exige sessão válida no servidor e, para ADMIN e EDITOR, o 2FA ativo.
export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const { actor, user } = await requireAdminSession();
  return (
    <AdminShell
      user={user}
      role={actor.role}
      nav={[
        { href: "/admin", label: "Início" },
        { href: "/admin/artigos", label: "Artigos" },
        // AUTHOR nunca gerencia categorias/tags/especialistas: sem link para uma tela que o
        // servidor sempre recusaria.
        ...(can(actor, "taxonomy:manage")
          ? [{ href: "/admin/categorias", label: "Categorias" }]
          : []),
        ...(can(actor, "specialist:manage")
          ? [{ href: "/admin/especialistas", label: "Especialistas" }]
          : []),
        ...(can(actor, "solution:manage") ? [{ href: "/admin/solucoes", label: "Soluções" }] : []),
        ...(can(actor, "page:manage") ? [{ href: "/admin/paginas", label: "Páginas" }] : []),
        ...(can(actor, "settings:manage")
          ? [{ href: "/admin/configuracoes", label: "Configurações" }]
          : []),
        { href: "/admin/midia", label: "Mídia" },
        { href: "/admin/seguranca", label: "Segurança" },
      ]}
    >
      {children}
    </AdminShell>
  );
}
