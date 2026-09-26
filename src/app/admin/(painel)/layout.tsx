import { AdminShell } from "@/components/admin/admin-shell";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

// Área autenticada: `requireAdminSession` lê `cookies()` (sessão) no servidor. Com Cache
// Components, esse acesso a dado de requisição bloqueia o static shell — e o painel não
// precisa de shell estático (nenhum SEO, conteúdo 100% dependente de sessão). `instant = false`
// marca o segmento como "permitido a bloquear" e desativa a validação (docs do Next 16).
export const instant = false;

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
        ...(can(actor, "testimonial:manage")
          ? [{ href: "/admin/depoimentos", label: "Depoimentos" }]
          : []),
        ...(can(actor, "lead:view") ? [{ href: "/admin/leads", label: "Leads" }] : []),
        ...(can(actor, "subscriber:view")
          ? [{ href: "/admin/newsletter", label: "Newsletter" }]
          : []),
        ...(can(actor, "redirect:manage")
          ? [{ href: "/admin/redirecionamentos", label: "Redirecionamentos" }]
          : []),
        ...(can(actor, "settings:manage")
          ? [{ href: "/admin/configuracoes", label: "Configurações" }]
          : []),
        ...(can(actor, "user:manage") ? [{ href: "/admin/usuarios", label: "Usuários" }] : []),
        ...(can(actor, "audit:view") ? [{ href: "/admin/auditoria", label: "Auditoria" }] : []),
        { href: "/admin/midia", label: "Mídia" },
        { href: "/admin/seguranca", label: "Segurança" },
      ]}
    >
      {children}
    </AdminShell>
  );
}
