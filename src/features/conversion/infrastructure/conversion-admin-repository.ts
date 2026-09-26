import "server-only";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import type { Executor } from "@/db/client";
import { leads, newsletterSubscribers, posts, solutions } from "@/db/schema";
import type { LeadStatus, SubscriberStatus } from "../domain/lead";

/** Leituras e escritas do painel (dados pessoais: só chamadas depois de `assertCan`). */

export type Page<T> = { items: T[]; total: number; page: number; pageSize: number };

export type LeadSummary = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  status: LeadStatus;
  createdAt: Date;
};

export type LeadDetail = LeadSummary & {
  message: string;
  phone: string | null;
  jobTitle: string | null;
  segment: string | null;
  website: string | null;
  interestSolutionTitle: string | null;
  originPostTitle: string | null;
  source: string | null;
  medium: string | null;
  campaign: string | null;
  landingPath: string | null;
  referrerHost: string | null;
  consentAt: Date;
  consentVersion: string;
  statusChangedAt: Date | null;
  notifiedAt: Date | null;
};

export async function listLeads(
  executor: Executor,
  filter: { status?: LeadStatus },
  options: { page: number; pageSize: number },
): Promise<Page<LeadSummary>> {
  const where = filter.status ? eq(leads.status, filter.status) : undefined;
  const [items, [totals]] = await Promise.all([
    executor
      .select({
        id: leads.id,
        name: leads.name,
        email: leads.email,
        company: leads.company,
        status: leads.status,
        createdAt: leads.createdAt,
      })
      .from(leads)
      .where(where)
      .orderBy(desc(leads.createdAt))
      .limit(options.pageSize)
      .offset((options.page - 1) * options.pageSize),
    executor.select({ n: count() }).from(leads).where(where),
  ]);
  return { items, total: totals?.n ?? 0, ...options };
}

export async function countLeadsByStatus(executor: Executor): Promise<Record<LeadStatus, number>> {
  const rows = await executor
    .select({ status: leads.status, n: count() })
    .from(leads)
    .groupBy(leads.status);
  const out: Record<LeadStatus, number> = {
    NEW: 0,
    CONTACTED: 0,
    QUALIFIED: 0,
    DISCARDED: 0,
    SPAM: 0,
  };
  for (const row of rows) out[row.status] = row.n;
  return out;
}

export async function findLeadDetail(executor: Executor, id: string): Promise<LeadDetail | null> {
  const [row] = await executor
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      company: leads.company,
      status: leads.status,
      createdAt: leads.createdAt,
      message: leads.message,
      phone: leads.phone,
      jobTitle: leads.jobTitle,
      segment: leads.segment,
      website: leads.website,
      interestSolutionTitle: solutions.title,
      originPostTitle: posts.title,
      source: leads.source,
      medium: leads.medium,
      campaign: leads.campaign,
      landingPath: leads.landingPath,
      referrerHost: leads.referrerHost,
      consentAt: leads.consentAt,
      consentVersion: leads.consentVersion,
      statusChangedAt: leads.statusChangedAt,
      notifiedAt: leads.notifiedAt,
    })
    .from(leads)
    .leftJoin(solutions, eq(solutions.id, leads.interestSolutionId))
    .leftJoin(posts, eq(posts.id, leads.originPostId))
    .where(eq(leads.id, id))
    .limit(1);
  return row ?? null;
}

/** Troca o estado só se ainda estiver em `from` (duas pessoas no mesmo lead: a segunda perde). */
export async function setLeadStatus(
  executor: Executor,
  id: string,
  from: LeadStatus,
  to: LeadStatus,
): Promise<boolean> {
  const rows = await executor
    .update(leads)
    .set({ status: to, statusChangedAt: new Date() })
    .where(and(eq(leads.id, id), eq(leads.status, from)))
    .returning({ id: leads.id });
  return rows.length > 0;
}

export async function deleteLead(executor: Executor, id: string): Promise<boolean> {
  const rows = await executor.delete(leads).where(eq(leads.id, id)).returning({ id: leads.id });
  return rows.length > 0;
}

export async function listLeadsForExport(
  executor: Executor,
  filter: { status?: LeadStatus },
): Promise<LeadDetail[]> {
  const where: SQL | undefined = filter.status ? eq(leads.status, filter.status) : undefined;
  return executor
    .select({
      id: leads.id,
      name: leads.name,
      email: leads.email,
      company: leads.company,
      status: leads.status,
      createdAt: leads.createdAt,
      message: leads.message,
      phone: leads.phone,
      jobTitle: leads.jobTitle,
      segment: leads.segment,
      website: leads.website,
      interestSolutionTitle: solutions.title,
      originPostTitle: posts.title,
      source: leads.source,
      medium: leads.medium,
      campaign: leads.campaign,
      landingPath: leads.landingPath,
      referrerHost: leads.referrerHost,
      consentAt: leads.consentAt,
      consentVersion: leads.consentVersion,
      statusChangedAt: leads.statusChangedAt,
      notifiedAt: leads.notifiedAt,
    })
    .from(leads)
    .leftJoin(solutions, eq(solutions.id, leads.interestSolutionId))
    .leftJoin(posts, eq(posts.id, leads.originPostId))
    .where(where)
    .orderBy(desc(leads.createdAt));
}

// ------------------------------------------------------------------------------ assinantes

export type SubscriberSummary = {
  id: string;
  email: string;
  name: string | null;
  status: SubscriberStatus;
  source: string | null;
  consentAt: Date;
  confirmedAt: Date | null;
  unsubscribedAt: Date | null;
  createdAt: Date;
};

const subscriberColumns = {
  id: newsletterSubscribers.id,
  email: newsletterSubscribers.email,
  name: newsletterSubscribers.name,
  status: newsletterSubscribers.status,
  source: newsletterSubscribers.source,
  consentAt: newsletterSubscribers.consentAt,
  confirmedAt: newsletterSubscribers.confirmedAt,
  unsubscribedAt: newsletterSubscribers.unsubscribedAt,
  createdAt: newsletterSubscribers.createdAt,
};

export async function listSubscribers(
  executor: Executor,
  filter: { status?: SubscriberStatus },
  options: { page: number; pageSize: number },
): Promise<Page<SubscriberSummary>> {
  const where = filter.status ? eq(newsletterSubscribers.status, filter.status) : undefined;
  const [items, [totals]] = await Promise.all([
    executor
      .select(subscriberColumns)
      .from(newsletterSubscribers)
      .where(where)
      .orderBy(desc(newsletterSubscribers.createdAt))
      .limit(options.pageSize)
      .offset((options.page - 1) * options.pageSize),
    executor.select({ n: count() }).from(newsletterSubscribers).where(where),
  ]);
  return { items, total: totals?.n ?? 0, ...options };
}

export async function countSubscribersByStatus(
  executor: Executor,
): Promise<Record<SubscriberStatus, number>> {
  const rows = await executor
    .select({ status: newsletterSubscribers.status, n: count() })
    .from(newsletterSubscribers)
    .groupBy(newsletterSubscribers.status);
  const out: Record<SubscriberStatus, number> = {
    PENDING: 0,
    ACTIVE: 0,
    UNSUBSCRIBED: 0,
    BOUNCED: 0,
  };
  for (const row of rows) out[row.status] = row.n;
  return out;
}

export async function listActiveSubscribersForExport(
  executor: Executor,
): Promise<SubscriberSummary[]> {
  return executor
    .select(subscriberColumns)
    .from(newsletterSubscribers)
    .where(eq(newsletterSubscribers.status, "ACTIVE"))
    .orderBy(desc(newsletterSubscribers.confirmedAt));
}

export async function deleteSubscriber(executor: Executor, id: string): Promise<boolean> {
  const rows = await executor
    .delete(newsletterSubscribers)
    .where(eq(newsletterSubscribers.id, id))
    .returning({ id: newsletterSubscribers.id });
  return rows.length > 0;
}
