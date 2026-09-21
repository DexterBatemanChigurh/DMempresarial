import { AdminShell } from "@/components/admin/admin-shell";
import { requireAdminSession } from "@/server/auth/admin-guard";

// Área de conta: exige sessão, mas NÃO exige o 2FA já ativo (é aqui que ele é cadastrado).
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const { actor, user } = await requireAdminSession({ allowSetup: true });
  return (
    <AdminShell
      user={user}
      role={actor.role}
      nav={
        user.twoFactorEnabled || !["ADMIN", "EDITOR"].includes(actor.role)
          ? [
              { href: "/admin", label: "Início" },
              { href: "/admin/seguranca", label: "Segurança" },
            ]
          : [{ href: "/admin/seguranca", label: "Segurança" }]
      }
    >
      {children}
    </AdminShell>
  );
}
