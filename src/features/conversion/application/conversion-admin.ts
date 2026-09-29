import "server-only";
import type { Database } from "@/db/client";
import { AppError } from "@/lib/errors";
import { toCsv } from "@/lib/csv";
import { recordAudit } from "@/features/platform/infrastructure/audit";
import { assertCan, type Action, type Actor } from "@/server/permissions";
import {
  canTransitionLead,
  LEAD_STATUSES,
  LEAD_TRANSITIONS,
  type LeadStatus,
} from "../domain/lead";
import {
  countLeadsByStatus,
  deleteLead,
  findLeadDetail,
  listLeads,
  listLeadsForExport,
  setLeadStatus,
  type LeadDetail,
  type LeadSummary,
  type Page,
} from "../infrastructure/conversion-admin-repository";

/**
 * Painel de leads (docs/03 §14 e §16; prompt 4 §43: "leads são dados privados").
 * Toda leitura, exportação, alteração e exclusão passa por `assertCan` — hoje só ADMIN (T-04).
 * A auditoria registra QUEM fez O QUÊ em QUAL registro, nunca o conteúdo (nome, e-mail, mensagem).
 * Exclusão é definitiva (direito de eliminação, LGPD art. 18): some a linha, fica o rastro.
 */
type Deps = { db: Database };

const PAGE_SIZE = 25;

function authorize(actor: Actor | null | undefined, action: Action): Actor {
  if (!actor) throw new AppError("UNAUTHENTICATED", "Sem sessão válida.");
  assertCan(actor, action);
  return actor;
}

export function parseLeadStatus(value: string | undefined): LeadStatus | undefined {
  return (LEAD_STATUSES as readonly string[]).includes(value ?? "")
    ? (value as LeadStatus)
    : undefined;
}

export async function listLeadsForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  filter: { status?: LeadStatus },
  options: { page?: number } = {},
): Promise<{ page: Page<LeadSummary>; counts: Record<LeadStatus, number> }> {
  authorize(actor, "lead:view");
  const [page, counts] = await Promise.all([
    listLeads(db, filter, { page: Math.max(1, options.page ?? 1), pageSize: PAGE_SIZE }),
    countLeadsByStatus(db),
  ]);
  return { page, counts };
}

/** Contagem por estado para a tela inicial do painel (só quem pode ver leads). */
export async function countLeadsForDashboard(
  { db }: Deps,
  actor: Actor | null | undefined,
): Promise<Record<LeadStatus, number>> {
  authorize(actor, "lead:view");
  return countLeadsByStatus(db);
}

export async function getLeadForAdmin(
  { db }: Deps,
  actor: Actor | null | undefined,
  id: string,
): Promise<{ lead: LeadDetail; transitions: readonly LeadStatus[] }> {
  authorize(actor, "lead:view");
  if (!/^[0-9a-f-]{36}$/i.test(id)) throw new AppError("NOT_FOUND", "Lead inexistente.");
  const lead = await findLeadDetail(db, id);
  if (!lead) throw new AppError("NOT_FOUND", "Lead inexistente.");
  return { lead, transitions: LEAD_TRANSITIONS[lead.status] };
}

export async function transitionLead(
  { db }: Deps,
  input: { actor: Actor | null | undefined; id: string; from: LeadStatus; to: LeadStatus },
): Promise<void> {
  const actor = authorize(input.actor, "lead:update");
  if (!canTransitionLead(input.from, input.to)) {
    throw new AppError("DOMAIN_RULE", `Transição inválida: ${input.from} → ${input.to}.`);
  }
  await db.transaction(async (tx) => {
    if (!(await setLeadStatus(tx, input.id, input.from, input.to))) {
      throw new AppError("CONFLICT", "O lead foi alterado por outra pessoa. Recarregue a página.");
    }
    await recordAudit(tx, {
      actorId: actor.id,
      action: "lead.status_changed",
      entityType: "lead",
      entityId: input.id,
      metadata: { from: input.from, to: input.to },
    });
  });
}

export async function eraseLead(
  { db }: Deps,
  input: { actor: Actor | null | undefined; id: string },
): Promise<void> {
  const actor = authorize(input.actor, "lead:erase");
  await db.transaction(async (tx) => {
    if (!(await deleteLead(tx, input.id))) throw new AppError("NOT_FOUND", "Lead inexistente.");
    await recordAudit(tx, {
      actorId: actor.id,
      action: "lead.erased",
      entityType: "lead",
      entityId: input.id,
    });
  });
}

const LEAD_CSV_HEADER = [
  "recebido_em",
  "estado",
  "nome",
  "email",
  "telefone",
  "empresa",
  "cargo",
  "segmento",
  "site",
  "mensagem",
  "artigo_de_origem",
  "origem",
  "midia",
  "campanha",
  "pagina_de_entrada",
  "site_de_referencia",
  "consentimento_em",
  "versao_do_consentimento",
] as const;

export async function exportLeadsCsv(
  { db }: Deps,
  actor: Actor | null | undefined,
  filter: { status?: LeadStatus },
): Promise<{ csv: string; count: number }> {
  const who = authorize(actor, "lead:export");
  const rows = await listLeadsForExport(db, filter);
  await db.transaction((tx) =>
    recordAudit(tx, {
      actorId: who.id,
      action: "lead.exported",
      entityType: "lead",
      metadata: { count: rows.length, status: filter.status ?? "ALL" },
    }),
  );
  const csv = toCsv(
    LEAD_CSV_HEADER,
    rows.map((l) => [
      l.createdAt,
      l.status,
      l.name,
      l.email,
      l.phone,
      l.company,
      l.jobTitle,
      l.segment,
      l.website,
      l.message,
      l.originPostTitle,
      l.source,
      l.medium,
      l.campaign,
      l.landingPath,
      l.referrerHost,
      l.consentAt,
      l.consentVersion,
    ]),
  );
  return { csv, count: rows.length };
}

// -----------------------------------------------------------------------------------------------
// Wrappers para Server Actions e páginas (`src/app/**` não importa `@/db`).
// -----------------------------------------------------------------------------------------------
import { getDb } from "@/db/client";

type A = Actor | null | undefined;

export const listLeadsForAdminForRoute = (
  actor: A,
  filter: { status?: LeadStatus },
  options?: { page?: number },
) => listLeadsForAdmin({ db: getDb() }, actor, filter, options);
export const countLeadsForDashboardForRoute = (actor: A) =>
  countLeadsForDashboard({ db: getDb() }, actor);
export const getLeadForAdminForRoute = (actor: A, id: string) =>
  getLeadForAdmin({ db: getDb() }, actor, id);
export const transitionLeadForRoute = (input: {
  actor: A;
  id: string;
  from: LeadStatus;
  to: LeadStatus;
}) => transitionLead({ db: getDb() }, input);
export const eraseLeadForRoute = (input: { actor: A; id: string }) =>
  eraseLead({ db: getDb() }, input);
export const exportLeadsCsvForRoute = (actor: A, filter: { status?: LeadStatus }) =>
  exportLeadsCsv({ db: getDb() }, actor, filter);
