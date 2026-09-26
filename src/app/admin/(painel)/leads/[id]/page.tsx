import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormMessage, Heading, Text } from "@/components/ui";
import { LeadActions } from "@/components/admin/leads/lead-actions";
import { getLeadForAdminForRoute } from "@/features/conversion/application/conversion-admin";
import { AppError } from "@/lib/errors";
import { can } from "@/server/permissions";
import { requireAdminSession } from "@/server/auth/admin-guard";

export const metadata: Metadata = { title: "Lead" };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  if (children === null || children === undefined || children === "") return null;
  return (
    <div className="grid gap-2xs border-b border-border py-sm sm:grid-cols-[200px_1fr]">
      <dt className="font-sans text-sm font-semibold text-text-secondary">{label}</dt>
      <dd className="font-sans text-body text-text">{children}</dd>
    </div>
  );
}

export default async function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { actor } = await requireAdminSession();
  const { id } = await params;

  let data;
  try {
    data = await getLeadForAdminForRoute(actor, id);
  } catch (error) {
    if (error instanceof AppError && error.code === "NOT_FOUND") notFound();
    if (error instanceof AppError) {
      return (
        <>
          <Heading as="h1" variant="h1">
            Lead
          </Heading>
          <FormMessage tone="error" className="mt-xl">
            {error.publicMessage}
          </FormMessage>
        </>
      );
    }
    throw error;
  }
  const { lead, transitions } = data;
  const hasAttribution = Boolean(
    lead.source || lead.medium || lead.campaign || lead.landingPath || lead.referrerHost,
  );

  return (
    <>
      <Text size="sm">
        <Link href="/admin/leads" className="text-link underline underline-offset-4">
          ← Todos os leads
        </Link>
      </Text>
      <Heading as="h1" variant="h1" className="mt-md">
        {lead.name}
      </Heading>
      <Text tone="secondary" className="mt-xs">
        Recebido em {dateTime.format(lead.createdAt)}
      </Text>

      <div className="mt-xl grid gap-2xl lg:grid-cols-[1fr_320px]">
        <div className="max-w-reading">
          <dl className="border-t border-border">
            <Row label="E-mail">
              <a href={`mailto:${lead.email}`} className="text-link underline underline-offset-4">
                {lead.email}
              </a>
            </Row>
            <Row label="Telefone">{lead.phone}</Row>
            <Row label="Empresa">{lead.company}</Row>
            <Row label="Cargo">{lead.jobTitle}</Row>
            <Row label="Segmento">{lead.segment}</Row>
            <Row label="Site">{lead.website}</Row>
            <Row label="Solução de interesse">{lead.interestSolutionTitle}</Row>
            <Row label="Artigo de origem">{lead.originPostTitle}</Row>
          </dl>

          <Heading as="h2" variant="h3" className="mt-2xl">
            Mensagem
          </Heading>
          {/* Texto puro vindo do formulário público: renderizado como texto, nunca como HTML. */}
          <p className="mt-sm font-sans text-body whitespace-pre-wrap text-text">{lead.message}</p>

          {hasAttribution ? (
            <>
              <Heading as="h2" variant="h3" className="mt-2xl">
                Origem
              </Heading>
              <dl className="mt-sm border-t border-border">
                <Row label="Origem">{lead.source}</Row>
                <Row label="Mídia">{lead.medium}</Row>
                <Row label="Campanha">{lead.campaign}</Row>
                <Row label="Página de entrada">{lead.landingPath}</Row>
                <Row label="Site de referência">{lead.referrerHost}</Row>
              </dl>
            </>
          ) : null}

          <Heading as="h2" variant="h3" className="mt-2xl">
            Consentimento
          </Heading>
          <dl className="mt-sm border-t border-border">
            <Row label="Aceito em">{dateTime.format(lead.consentAt)}</Row>
            <Row label="Versão do texto">{lead.consentVersion}</Row>
            <Row label="Aviso por e-mail">
              {lead.notifiedAt ? `Enviado em ${dateTime.format(lead.notifiedAt)}` : "Não enviado"}
            </Row>
          </dl>
        </div>
        <div>
          <LeadActions
            id={lead.id}
            status={lead.status}
            transitions={transitions}
            canErase={can(actor, "lead:erase")}
          />
        </div>
      </div>
    </>
  );
}
