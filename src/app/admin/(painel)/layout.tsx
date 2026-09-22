import { AdminShell } from "@/components/admin/admin-shell";
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
        { href: "/admin/midia", label: "Mídia" },
        { href: "/admin/seguranca", label: "Segurança" },
      ]}
    >
      {children}
    </AdminShell>
  );
}
