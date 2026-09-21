import { sql } from "drizzle-orm";
import { check, index, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth";
import { solutions } from "./catalog";
import { citext, createdAt, maxLen, pk, tz, updatedAt } from "./_helpers";
import { leadStatus, subscriberStatus } from "./enums";
import { posts } from "./content";

// Formato mínimo de e-mail (o formato completo é validado por Zod antes de chegar aqui).
const EMAIL_FORMAT = "'^[^@[:space:]]+@[^@[:space:]]+\\.[^@[:space:]]+$'";

/**
 * Leads (dados PESSOAIS: nunca expostos por rota pública). Só o mínimo necessário para a
 * finalidade (docs/03, parte 22). O IP nunca é guardado: apenas um hash diário, para anti-abuso,
 * apagado em até 30 dias.
 */
export const leads = pgTable(
  "leads",
  {
    id: pk(),
    name: text("name").notNull(),
    email: citext("email").notNull(),
    message: text("message").notNull(),
    phone: text("phone"),
    company: text("company"),
    jobTitle: text("job_title"),
    segment: text("segment"),
    website: text("website"),
    // Origens verificadas no servidor (devem existir e ser públicas no momento do envio).
    interestSolutionId: uuid("interest_solution_id").references(() => solutions.id, {
      onDelete: "set null",
    }),
    originPostId: uuid("origin_post_id").references(() => posts.id, { onDelete: "set null" }),
    // Atribuição (docs/01, seção 15): de onde veio o lead.
    source: text("source"),
    medium: text("medium"),
    campaign: text("campaign"),
    utmContent: text("utm_content"),
    utmTerm: text("utm_term"),
    landingPath: text("landing_path"),
    referrerHost: text("referrer_host"),
    // Consentimento e a versão do texto aceito (LGPD).
    consentAt: tz("consent_at").notNull(),
    consentVersion: text("consent_version").notNull(),
    status: leadStatus("status").notNull().default("NEW"),
    statusChangedAt: tz("status_changed_at"),
    ipHash: text("ip_hash"),
    // Nulo = e-mail de aviso ainda não enviado (o job reenvia).
    notifiedAt: tz("notified_at"),
    assignedTo: text("assigned_to").references(() => users.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("leads_email_format", sql`${t.email}::text ~ ${sql.raw(EMAIL_FORMAT)}`),
    maxLen("leads", t.name, 120),
    maxLen("leads", t.message, 5000),
    maxLen("leads", t.phone, 30),
    maxLen("leads", t.company, 120),
    maxLen("leads", t.jobTitle, 120),
    maxLen("leads", t.segment, 80),
    maxLen("leads", t.website, 300),
    maxLen("leads", t.source, 100),
    maxLen("leads", t.medium, 100),
    maxLen("leads", t.campaign, 150),
    maxLen("leads", t.utmContent, 200),
    maxLen("leads", t.utmTerm, 200),
    maxLen("leads", t.landingPath, 300),
    maxLen("leads", t.referrerHost, 200),
    maxLen("leads", t.consentVersion, 40),
    maxLen("leads", t.ipHash, 64),
    index("leads_status_created_idx").on(t.status, t.createdAt.desc()),
    index("leads_email_idx").on(t.email),
    index("leads_pending_notification_idx")
      .on(t.createdAt)
      .where(sql`${t.notifiedAt} IS NULL`),
  ],
);

/** Assinantes da newsletter, com duplo aceite (PENDING até confirmar). Dados pessoais. */
export const newsletterSubscribers = pgTable(
  "newsletter_subscribers",
  {
    id: pk(),
    email: citext("email").notNull().unique(),
    name: text("name"),
    status: subscriberStatus("status").notNull().default("PENDING"),
    consentAt: tz("consent_at").notNull(),
    consentVersion: text("consent_version").notNull(),
    // Só o HASH do token é guardado; o token em si vai apenas no e-mail.
    confirmTokenHash: text("confirm_token_hash"),
    confirmExpiresAt: tz("confirm_expires_at"),
    confirmedAt: tz("confirmed_at"),
    unsubscribedAt: tz("unsubscribed_at"),
    source: text("source"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    check("subscribers_email_format", sql`${t.email}::text ~ ${sql.raw(EMAIL_FORMAT)}`),
    check(
      "subscribers_status_dates",
      sql`(${t.status} <> 'ACTIVE' OR ${t.confirmedAt} IS NOT NULL) AND (${t.status} <> 'UNSUBSCRIBED' OR ${t.unsubscribedAt} IS NOT NULL)`,
    ),
    maxLen("subscribers", t.email, 254),
    maxLen("subscribers", t.name, 120),
    maxLen("subscribers", t.consentVersion, 40),
    maxLen("subscribers", t.confirmTokenHash, 64),
    maxLen("subscribers", t.source, 100),
    index("subscribers_status_idx").on(t.status),
  ],
);
