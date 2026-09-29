import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/server/auth/admin-guard";

// Área de conta (senha): exige sessão.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { actor, user } = await requireAdminSession();
  return (
    <AdminShell
      user={user}
      role={actor.role}
      nav={[
        { href: "/admin", label: "Início" },
        { href: "/admin/seguranca", label: "Segurança" },
      ]}
    >
      {children}
    </AdminShell>
  );
}
