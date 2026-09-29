import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Button, Heading, Text } from "@/components/ui";
import { getAuditLogForRoute } from "@/features/audit/application/audit-query";
import { getPostCounts, getUpcomingScheduled } from "@/features/content/application/dashboard";
import { listLeadsForAdminForRoute } from "@/features/conversion/application/conversion-admin";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Início" };

const TZ = "America/Sao_Paulo";

const CONTENT_ROWS = [
  ["DRAFT", "Rascunhos"],
  ["REVIEW", "Em revisão"],
  ["SCHEDULED", "Agendados"],
  ["PUBLISHED", "Publicados"],
  ["ARCHIVED", "Arquivados"],
] as const;

/** Rótulos legíveis das ações da auditoria; o que não estiver aqui aparece como veio. */
const ACTIVITY_LABEL: Record<string, string> = {
  "post.created": "Artigo criado",
  "post.updated": "Artigo atualizado",
  "post.published": "Artigo publicado",
  "post.deleted": "Artigo excluído",
  "post.slug_changed": "Endereço de artigo alterado",
  "lead.status_changed": "Estado de contato alterado",
  "lead.erased": "Contato excluído",
  "lead.exported": "Contatos exportados",
  "category.created": "Categoria criada",
  "category.updated": "Categoria atualizada",
  "category.deleted": "Categoria excluída",
  "category.merged": "Categorias unificadas",
  "tag.created": "Tag criada",
  "tag.deleted": "Tag excluída",
  "tag.merged": "Tags unificadas",
  "media.upload": "Imagem enviada",
  "media.update": "Imagem atualizada",
  "media.delete": "Imagem excluída",
  "redirect.created": "Redirecionamento criado",
  "redirect.deleted": "Redirecionamento excluído",
  "settings.updated": "Configurações salvas",
  "user.bootstrap_admin": "Administrador inicial criado",
  "user.created": "Usuário criado",
  "user.deleted": "Usuário excluído",
  "user.disabled": "Usuário desativado",
  "user.reactivated": "Usuário reativado",
  "user.role_changed": "Papel de usuário alterado",
};

function greeting(now: Date): string {
  const hour = Number(
    new Intl.DateTimeFormat("pt-BR", { hour: "numeric", hourCycle: "h23", timeZone: TZ }).format(
      now,
    ),
  );
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function timeAgo(date: Date, now: Date): string {
  const rtf = new Intl.RelativeTimeFormat("pt-BR", { numeric: "auto" });
  const minutes = Math.round((date.getTime() - now.getTime()) / 60_000);
  if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return rtf.format(hours, "hour");
  return rtf.format(Math.round(hours / 24), "day");
}

const dayMonth = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", timeZone: TZ })
    .format(d)
    .replace(".", "")
    .replace(" de ", " ")
    .toUpperCase();
const hourMinute = (d: Date) =>
  new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(d);

function Panel({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="py-xl">
      <h2
        id={id}
        className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase"
      >
        {title}
      </h2>
      <div className="mt-md">{children}</div>
    </section>
  );
}

function Dot({ tone }: { tone: "danger" | "warning" | "neutral" }) {
  const color = { danger: "bg-danger", warning: "bg-warning", neutral: "bg-text-secondary" }[tone];
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${color}`} />;
}

export default async function DashboardPage() {
  // A autorização é revalidada aqui (não só no layout): cada página decide por si.
  const { actor, user } = await requireAdminSession();
  const canLeads = can(actor, "lead:view");
  const canAudit = can(actor, "audit:view");
  const [counts, upcoming, leads, activity] = await Promise.all([
    getPostCounts(actor),
    getUpcomingScheduled(actor, 5),
    canLeads ? listLeadsForAdminForRoute(actor, {}, { page: 1 }) : Promise.resolve(null),
    canAudit ? getAuditLogForRoute(actor, {}, { page: 1 }) : Promise.resolve(null),
  ]);

  const now = new Date();
  const newLeads = leads?.counts.NEW ?? 0;
  const totalLeads = leads ? Object.values(leads.counts).reduce((a, b) => a + b, 0) : 0;
  const next24h = upcoming.filter(
    (p) => p.scheduledFor.getTime() - now.getTime() < 24 * 60 * 60 * 1000,
  ).length;

  const stats: [string, number][] = [
    ["Artigos", counts.PUBLISHED],
    ...(leads
      ? ([
          ["Leads novos", newLeads],
          ["Contatos", totalLeads],
        ] as [string, number][])
      : []),
    ["Agendados", counts.SCHEDULED],
  ];

  const attention: { tone: "danger" | "warning"; text: string; href: string }[] = [];
  if (newLeads > 0)
    attention.push({
      tone: "danger",
      text: newLeads === 1 ? "1 contato novo" : `${newLeads} contatos novos`,
      href: "/admin/leads?estado=NEW",
    });
  if (counts.REVIEW > 0)
    attention.push({
      tone: "warning",
      text: counts.REVIEW === 1 ? "1 artigo em revisão" : `${counts.REVIEW} artigos em revisão`,
      href: "/admin/artigos?status=REVIEW",
    });
  if (next24h > 0)
    attention.push({
      tone: "warning",
      text:
        next24h === 1
          ? "1 publicação nas próximas 24 h"
          : `${next24h} publicações nas próximas 24 h`,
      href: "/admin/artigos?status=SCHEDULED",
    });

  const recentLeads = leads?.page.items.slice(0, 5) ?? [];
  const recentActivity = activity?.items.slice(0, 6) ?? [];

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Heading as="h1" variant="h1">
            {greeting(now)}, {user.name}
          </Heading>
          <Text tone="secondary" className="mt-sm">
            {actor.role === "AUTHOR" ? "Resumo dos seus artigos" : "Resumo do DM Empresarial"}
          </Text>
        </div>
        <Button href="/admin/artigos/novo" size="sm">
          + Novo artigo
        </Button>
      </div>

      <dl className="mt-2xl grid grid-cols-2 gap-lg border-y border-border py-xl sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label}>
            <dt className="font-sans text-label font-semibold tracking-[0.04em] text-text-secondary uppercase">
              {label}
            </dt>
            <dd className="mt-xs font-serif text-display-m text-text">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="grid border-b border-border md:grid-cols-2 md:divide-x md:divide-border">
        <div className="md:pr-xl">
          <Panel id="atencao" title="Precisa da sua atenção">
            {attention.length === 0 ? (
              <Text size="sm" tone="secondary">
                Nada pendente. Tudo em dia.
              </Text>
            ) : (
              <ul className="space-y-xs">
                {attention.map((item) => (
                  <li key={item.text}>
                    <Link
                      href={item.href}
                      className="flex min-h-11 items-center gap-sm font-sans text-body-sm text-text underline-offset-4 hover:underline"
                    >
                      <Dot tone={item.tone} />
                      {item.text}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
        <div className="border-t border-border md:border-t-0 md:pl-xl">
          <Panel id="conteudo-resumo" title="Conteúdo">
            <dl>
              {CONTENT_ROWS.map(([status, label]) => (
                <div
                  key={status}
                  className="flex items-center justify-between border-b border-border py-xs last:border-b-0"
                >
                  <dt className="font-sans text-body-sm text-text-secondary">{label}</dt>
                  <dd className="font-sans text-body-sm font-semibold text-text tabular-nums">
                    {counts[status]}
                  </dd>
                </div>
              ))}
            </dl>
          </Panel>
        </div>
      </div>

      {leads ? (
        <div className="border-b border-border">
          <Panel id="contatos-recentes" title="Contatos recentes">
            {recentLeads.length === 0 ? (
              <Text size="sm" tone="secondary">
                Nenhum contato ainda.
              </Text>
            ) : (
              <ul>
                {recentLeads.map((lead) => (
                  <li
                    key={lead.id}
                    className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-md gap-y-2xs border-b border-border py-sm last:border-b-0 sm:grid-cols-[minmax(0,2fr)_minmax(0,2fr)_auto_auto]"
                  >
                    <span className="truncate font-sans text-body-sm font-semibold text-text">
                      {lead.name}
                    </span>
                    <span className="order-3 col-span-2 truncate font-sans text-body-sm text-text-secondary sm:order-none sm:col-span-1">
                      {lead.company ? `${lead.company} · ` : ""}
                      {timeAgo(lead.createdAt, now)}
                    </span>
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="inline-flex min-h-11 items-center font-sans text-body-sm font-semibold text-link underline-offset-4 hover:underline"
                    >
                      Ver <span aria-hidden="true">&nbsp;→</span>
                      <span className="sr-only"> contato de {lead.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      ) : null}

      <div className={activity ? "border-b border-border" : undefined}>
        <Panel id="proximas" title="Próximas publicações">
          {upcoming.length === 0 ? (
            <Text size="sm" tone="secondary">
              Nenhum artigo agendado.
            </Text>
          ) : (
            <ul>
              {upcoming.map((post) => (
                <li key={post.id} className="border-b border-border last:border-b-0">
                  <Link
                    href={`/admin/artigos/${post.id}`}
                    className="grid min-h-11 grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-md py-sm font-sans text-body-sm hover:underline underline-offset-4"
                  >
                    <span className="font-semibold text-text-secondary tabular-nums">
                      {dayMonth(post.scheduledFor)}
                    </span>
                    <span className="truncate text-text">{post.title}</span>
                    <span className="text-text-secondary tabular-nums">
                      {hourMinute(post.scheduledFor)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      {activity ? (
        <Panel id="atividade" title="Atividade recente">
          {recentActivity.length === 0 ? (
            <Text size="sm" tone="secondary">
              Nenhuma atividade registrada.
            </Text>
          ) : (
            <ul className="space-y-sm">
              {recentActivity.map((entry) => (
                <li key={entry.id} className="flex items-center gap-sm font-sans text-body-sm">
                  <Dot tone="neutral" />
                  <span className="text-text">{ACTIVITY_LABEL[entry.action] ?? entry.action}</span>
                  <span className="text-text-secondary">
                    · {entry.actorName ?? "sistema"} · {timeAgo(entry.at, now)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      ) : null}
    </>
  );
}
