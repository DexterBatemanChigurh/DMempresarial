CREATE TYPE "public"."lead_status" AS ENUM('NEW', 'CONTACTED', 'QUALIFIED', 'DISCARDED', 'SPAM');--> statement-breakpoint
CREATE TYPE "public"."media_status" AS ENUM('PENDING', 'READY');--> statement-breakpoint
CREATE TYPE "public"."page_template" AS ENUM('HOME', 'ABOUT', 'CONTACT', 'LEGAL');--> statement-breakpoint
CREATE TYPE "public"."post_format" AS ENUM('ANALISE', 'LEITURA_DE_MERCADO', 'CONCEITO_APLICADO', 'CASO', 'OPINIAO', 'REGIONAL');--> statement-breakpoint
CREATE TYPE "public"."post_status" AS ENUM('DRAFT', 'REVIEW', 'SCHEDULED', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."publish_status" AS ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."redirect_origin" AS ENUM('AUTO', 'MANUAL');--> statement-breakpoint
CREATE TYPE "public"."solution_item_kind" AS ENUM('SITUATION', 'STEP', 'GOAL');--> statement-breakpoint
CREATE TYPE "public"."solution_type" AS ENUM('CONSULTORIA', 'SERVICO');--> statement-breakpoint
CREATE TYPE "public"."specialist_kind" AS ENUM('TEAM', 'GUEST');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_unique" UNIQUE("slug"),
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("categories"."slug") <= 80),
	CONSTRAINT "categories_name_max_len" CHECK (char_length("categories"."name") <= 80),
	CONSTRAINT "categories_description_max_len" CHECK (char_length("categories"."description") <= 300)
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tags_slug_unique" UNIQUE("slug"),
	CONSTRAINT "tags_slug_format" CHECK ("tags"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("tags"."slug") <= 80),
	CONSTRAINT "tags_name_max_len" CHECK (char_length("tags"."name") <= 60)
);
--> statement-breakpoint
CREATE TABLE "media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"sha256" text NOT NULL,
	"alt_text" text,
	"caption" text,
	"focal_x" real DEFAULT 0.5 NOT NULL,
	"focal_y" real DEFAULT 0.5 NOT NULL,
	"status" "media_status" DEFAULT 'PENDING' NOT NULL,
	"uploaded_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_storage_key_unique" UNIQUE("storage_key"),
	CONSTRAINT "media_mime_allowed" CHECK ("media"."mime" IN ('image/jpeg', 'image/png', 'image/webp', 'image/avif')),
	CONSTRAINT "media_bytes_positive" CHECK ("media"."bytes" > 0),
	CONSTRAINT "media_dimensions_positive" CHECK ("media"."width" > 0 AND "media"."height" > 0),
	CONSTRAINT "media_sha256_hex" CHECK ("media"."sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "media_focal_range" CHECK ("media"."focal_x" BETWEEN 0 AND 1 AND "media"."focal_y" BETWEEN 0 AND 1),
	CONSTRAINT "media_alt_text_max_len" CHECK (char_length("media"."alt_text") <= 300),
	CONSTRAINT "media_caption_max_len" CHECK (char_length("media"."caption") <= 300)
);
--> statement-breakpoint
CREATE TABLE "solution_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"solution_id" uuid NOT NULL,
	"kind" "solution_item_kind" NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"body" text,
	CONSTRAINT "solution_items_order_uq" UNIQUE("solution_id","kind","position"),
	CONSTRAINT "solution_items_title_max_len" CHECK (char_length("solution_items"."title") <= 160),
	CONSTRAINT "solution_items_body_max_len" CHECK (char_length("solution_items"."body") <= 600)
);
--> statement-breakpoint
CREATE TABLE "solutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "solution_type" NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"context" jsonb,
	"approach" jsonb,
	"is_featured" boolean DEFAULT false NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_media_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "solutions_slug_unique" UNIQUE("slug"),
	CONSTRAINT "solutions_slug_format" CHECK ("solutions"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("solutions"."slug") <= 80),
	CONSTRAINT "solutions_title_max_len" CHECK (char_length("solutions"."title") <= 160),
	CONSTRAINT "solutions_summary_max_len" CHECK (char_length("solutions"."summary") <= 280),
	CONSTRAINT "solutions_status_dates" CHECK (("solutions"."status" <> 'PUBLISHED' OR "solutions"."published_at" IS NOT NULL) AND ("solutions"."status" <> 'ARCHIVED' OR "solutions"."archived_at" IS NOT NULL)),
	CONSTRAINT "solutions_seo_title_max_len" CHECK (char_length("solutions"."seo_title") <= 70),
	CONSTRAINT "solutions_seo_description_max_len" CHECK (char_length("solutions"."seo_description") <= 160)
);
--> statement-breakpoint
CREATE TABLE "specialist_categories" (
	"specialist_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	CONSTRAINT "specialist_categories_specialist_id_category_id_pk" PRIMARY KEY("specialist_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "specialist_solutions" (
	"specialist_id" uuid NOT NULL,
	"solution_id" uuid NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "specialist_solutions_specialist_id_solution_id_pk" PRIMARY KEY("specialist_id","solution_id")
);
--> statement-breakpoint
CREATE TABLE "specialists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"role_title" text,
	"summary" text,
	"bio" jsonb,
	"photo_media_id" uuid,
	"kind" "specialist_kind" DEFAULT 'TEAM' NOT NULL,
	"user_id" text,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_media_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "specialists_slug_unique" UNIQUE("slug"),
	CONSTRAINT "specialists_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "specialists_slug_format" CHECK ("specialists"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("specialists"."slug") <= 80),
	CONSTRAINT "specialists_name_max_len" CHECK (char_length("specialists"."name") <= 120),
	CONSTRAINT "specialists_role_title_max_len" CHECK (char_length("specialists"."role_title") <= 120),
	CONSTRAINT "specialists_summary_max_len" CHECK (char_length("specialists"."summary") <= 400),
	CONSTRAINT "specialists_status_dates" CHECK (("specialists"."status" <> 'PUBLISHED' OR "specialists"."published_at" IS NOT NULL) AND ("specialists"."status" <> 'ARCHIVED' OR "specialists"."archived_at" IS NOT NULL)),
	CONSTRAINT "specialists_guest_not_public" CHECK ("specialists"."kind" = 'TEAM' OR "specialists"."status" <> 'PUBLISHED'),
	CONSTRAINT "specialists_seo_title_max_len" CHECK (char_length("specialists"."seo_title") <= 70),
	CONSTRAINT "specialists_seo_description_max_len" CHECK (char_length("specialists"."seo_description") <= 160)
);
--> statement-breakpoint
CREATE TABLE "post_categories" (
	"post_id" uuid NOT NULL,
	"category_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "post_categories_post_id_category_id_pk" PRIMARY KEY("post_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "post_solutions" (
	"post_id" uuid NOT NULL,
	"solution_id" uuid NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL,
	CONSTRAINT "post_solutions_post_id_solution_id_pk" PRIMARY KEY("post_id","solution_id")
);
--> statement-breakpoint
CREATE TABLE "post_tags" (
	"post_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	CONSTRAINT "post_tags_post_id_tag_id_pk" PRIMARY KEY("post_id","tag_id")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"excerpt" text,
	"body" jsonb DEFAULT '{"type":"doc","content":[]}'::jsonb NOT NULL,
	"body_text" text DEFAULT '' NOT NULL,
	"format" "post_format",
	"cover_media_id" uuid,
	"author_id" uuid NOT NULL,
	"status" "post_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"first_published_at" timestamp with time zone,
	"scheduled_for" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"reading_minutes" integer DEFAULT 0 NOT NULL,
	"search_vector" "tsvector" GENERATED ALWAYS AS (setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(title, ''))), 'A') || setweight(to_tsvector('portuguese', public.f_unaccent(coalesce(subtitle, '') || ' ' || coalesce(excerpt, ''))), 'B') || setweight(to_tsvector('portuguese', public.f_unaccent(body_text)), 'C')) STORED,
	"seo_title" text,
	"seo_description" text,
	"og_media_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug"),
	CONSTRAINT "posts_slug_format" CHECK ("posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("posts"."slug") <= 80),
	CONSTRAINT "posts_title_max_len" CHECK (char_length("posts"."title") <= 200),
	CONSTRAINT "posts_subtitle_max_len" CHECK (char_length("posts"."subtitle") <= 300),
	CONSTRAINT "posts_excerpt_max_len" CHECK (char_length("posts"."excerpt") <= 400),
	CONSTRAINT "posts_seo_title_max_len" CHECK (char_length("posts"."seo_title") <= 70),
	CONSTRAINT "posts_seo_description_max_len" CHECK (char_length("posts"."seo_description") <= 160),
	CONSTRAINT "posts_reading_minutes_nonneg" CHECK ("posts"."reading_minutes" >= 0),
	CONSTRAINT "posts_status_dates" CHECK (("posts"."status" <> 'PUBLISHED' OR ("posts"."published_at" IS NOT NULL AND "posts"."first_published_at" IS NOT NULL))
        AND ("posts"."status" <> 'SCHEDULED' OR "posts"."scheduled_for" IS NOT NULL)
        AND ("posts"."status" <> 'ARCHIVED' OR "posts"."archived_at" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "pages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"template" "page_template" NOT NULL,
	"title" text NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"seo_title" text,
	"seo_description" text,
	"og_media_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pages_key_unique" UNIQUE("key"),
	CONSTRAINT "pages_key_format" CHECK ("pages"."key" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "pages_title_max_len" CHECK (char_length("pages"."title") <= 160),
	CONSTRAINT "pages_status_dates" CHECK (("pages"."status" <> 'PUBLISHED' OR "pages"."published_at" IS NOT NULL) AND ("pages"."status" <> 'ARCHIVED' OR "pages"."archived_at" IS NOT NULL)),
	CONSTRAINT "pages_seo_title_max_len" CHECK (char_length("pages"."seo_title") <= 70),
	CONSTRAINT "pages_seo_description_max_len" CHECK (char_length("pages"."seo_description") <= 160)
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" "citext" NOT NULL,
	"message" text NOT NULL,
	"phone" text,
	"company" text,
	"job_title" text,
	"segment" text,
	"website" text,
	"interest_solution_id" uuid,
	"origin_post_id" uuid,
	"source" text,
	"medium" text,
	"campaign" text,
	"utm_content" text,
	"utm_term" text,
	"landing_path" text,
	"referrer_host" text,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_version" text NOT NULL,
	"status" "lead_status" DEFAULT 'NEW' NOT NULL,
	"status_changed_at" timestamp with time zone,
	"ip_hash" text,
	"notified_at" timestamp with time zone,
	"assigned_to" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "leads_email_format" CHECK ("leads"."email"::text ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
	CONSTRAINT "leads_name_max_len" CHECK (char_length("leads"."name") <= 120),
	CONSTRAINT "leads_message_max_len" CHECK (char_length("leads"."message") <= 5000),
	CONSTRAINT "leads_phone_max_len" CHECK (char_length("leads"."phone") <= 30),
	CONSTRAINT "leads_company_max_len" CHECK (char_length("leads"."company") <= 120),
	CONSTRAINT "leads_job_title_max_len" CHECK (char_length("leads"."job_title") <= 120),
	CONSTRAINT "leads_segment_max_len" CHECK (char_length("leads"."segment") <= 80),
	CONSTRAINT "leads_website_max_len" CHECK (char_length("leads"."website") <= 300),
	CONSTRAINT "leads_source_max_len" CHECK (char_length("leads"."source") <= 100),
	CONSTRAINT "leads_medium_max_len" CHECK (char_length("leads"."medium") <= 100),
	CONSTRAINT "leads_campaign_max_len" CHECK (char_length("leads"."campaign") <= 150),
	CONSTRAINT "leads_utm_content_max_len" CHECK (char_length("leads"."utm_content") <= 200),
	CONSTRAINT "leads_utm_term_max_len" CHECK (char_length("leads"."utm_term") <= 200),
	CONSTRAINT "leads_landing_path_max_len" CHECK (char_length("leads"."landing_path") <= 300),
	CONSTRAINT "leads_referrer_host_max_len" CHECK (char_length("leads"."referrer_host") <= 200),
	CONSTRAINT "leads_consent_version_max_len" CHECK (char_length("leads"."consent_version") <= 40),
	CONSTRAINT "leads_ip_hash_max_len" CHECK (char_length("leads"."ip_hash") <= 64)
);
--> statement-breakpoint
CREATE TABLE "newsletter_subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" "citext" NOT NULL,
	"name" text,
	"status" "subscriber_status" DEFAULT 'PENDING' NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"consent_version" text NOT NULL,
	"confirm_token_hash" text,
	"confirm_expires_at" timestamp with time zone,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"source" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "newsletter_subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_email_format" CHECK ("newsletter_subscribers"."email"::text ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
	CONSTRAINT "subscribers_status_dates" CHECK (("newsletter_subscribers"."status" <> 'ACTIVE' OR "newsletter_subscribers"."confirmed_at" IS NOT NULL) AND ("newsletter_subscribers"."status" <> 'UNSUBSCRIBED' OR "newsletter_subscribers"."unsubscribed_at" IS NOT NULL)),
	CONSTRAINT "subscribers_email_max_len" CHECK (char_length("newsletter_subscribers"."email") <= 254),
	CONSTRAINT "subscribers_name_max_len" CHECK (char_length("newsletter_subscribers"."name") <= 120),
	CONSTRAINT "subscribers_consent_version_max_len" CHECK (char_length("newsletter_subscribers"."consent_version") <= 40),
	CONSTRAINT "subscribers_confirm_token_hash_max_len" CHECK (char_length("newsletter_subscribers"."confirm_token_hash") <= 64),
	CONSTRAINT "subscribers_source_max_len" CHECK (char_length("newsletter_subscribers"."source") <= 100)
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" text,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" text,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"request_id" text,
	CONSTRAINT "audit_logs_action_max_len" CHECK (char_length("audit_logs"."action") <= 60),
	CONSTRAINT "audit_logs_entity_type_max_len" CHECK (char_length("audit_logs"."entity_type") <= 40),
	CONSTRAINT "audit_logs_entity_id_max_len" CHECK (char_length("audit_logs"."entity_id") <= 64),
	CONSTRAINT "audit_logs_request_id_max_len" CHECK (char_length("audit_logs"."request_id") <= 64)
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" smallint DEFAULT 301 NOT NULL,
	"origin" "redirect_origin" DEFAULT 'AUTO' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_path_unique" UNIQUE("from_path"),
	CONSTRAINT "redirects_from_path" CHECK ("redirects"."from_path" ~ '^/[^[:space:]]*$' AND "redirects"."from_path" !~ '^//'),
	CONSTRAINT "redirects_to_path" CHECK ("redirects"."to_path" ~ '^/[^[:space:]]*$' AND "redirects"."to_path" !~ '^//'),
	CONSTRAINT "redirects_no_self_loop" CHECK ("redirects"."from_path" <> "redirects"."to_path"),
	CONSTRAINT "redirects_status_code" CHECK ("redirects"."status_code" IN (301, 308)),
	CONSTRAINT "redirects_from_path_max_len" CHECK (char_length("redirects"."from_path") <= 300),
	CONSTRAINT "redirects_to_path_max_len" CHECK (char_length("redirects"."to_path") <= 300)
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"id" smallint PRIMARY KEY DEFAULT 1 NOT NULL,
	"legal_name" text,
	"cnpj" text,
	"address" text,
	"phone" text,
	"email" text,
	"whatsapp" text,
	"social" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "site_settings_singleton" CHECK ("site_settings"."id" = 1),
	CONSTRAINT "site_settings_legal_name_max_len" CHECK (char_length("site_settings"."legal_name") <= 160),
	CONSTRAINT "site_settings_cnpj_max_len" CHECK (char_length("site_settings"."cnpj") <= 20),
	CONSTRAINT "site_settings_address_max_len" CHECK (char_length("site_settings"."address") <= 300),
	CONSTRAINT "site_settings_phone_max_len" CHECK (char_length("site_settings"."phone") <= 30),
	CONSTRAINT "site_settings_email_max_len" CHECK (char_length("site_settings"."email") <= 254),
	CONSTRAINT "site_settings_whatsapp_max_len" CHECK (char_length("site_settings"."whatsapp") <= 30)
);
--> statement-breakpoint
ALTER TABLE "media" ADD CONSTRAINT "media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solution_items" ADD CONSTRAINT "solution_items_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_categories" ADD CONSTRAINT "specialist_categories_specialist_id_specialists_id_fk" FOREIGN KEY ("specialist_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_categories" ADD CONSTRAINT "specialist_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_solutions" ADD CONSTRAINT "specialist_solutions_specialist_id_specialists_id_fk" FOREIGN KEY ("specialist_id") REFERENCES "public"."specialists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialist_solutions" ADD CONSTRAINT "specialist_solutions_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_photo_media_id_media_id_fk" FOREIGN KEY ("photo_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "specialists" ADD CONSTRAINT "specialists_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_categories" ADD CONSTRAINT "post_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_solutions" ADD CONSTRAINT "post_solutions_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_solutions" ADD CONSTRAINT "post_solutions_solution_id_solutions_id_fk" FOREIGN KEY ("solution_id") REFERENCES "public"."solutions"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_tags" ADD CONSTRAINT "post_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_cover_media_id_media_id_fk" FOREIGN KEY ("cover_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_author_id_specialists_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."specialists"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "posts" ADD CONSTRAINT "posts_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_og_media_id_media_id_fk" FOREIGN KEY ("og_media_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pages" ADD CONSTRAINT "pages_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_interest_solution_id_solutions_id_fk" FOREIGN KEY ("interest_solution_id") REFERENCES "public"."solutions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_origin_post_id_posts_id_fk" FOREIGN KEY ("origin_post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "redirects" ADD CONSTRAINT "redirects_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "media_status_created_idx" ON "media" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "solutions_public_idx" ON "solutions" USING btree ("position") WHERE "solutions"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "specialist_categories_category_idx" ON "specialist_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "specialist_solutions_solution_idx" ON "specialist_solutions" USING btree ("solution_id");--> statement-breakpoint
CREATE INDEX "specialists_public_idx" ON "specialists" USING btree ("position") WHERE "specialists"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE UNIQUE INDEX "post_categories_one_primary_uq" ON "post_categories" USING btree ("post_id") WHERE "post_categories"."is_primary";--> statement-breakpoint
CREATE INDEX "post_categories_category_idx" ON "post_categories" USING btree ("category_id");--> statement-breakpoint
CREATE UNIQUE INDEX "post_solutions_one_primary_uq" ON "post_solutions" USING btree ("post_id") WHERE "post_solutions"."is_primary";--> statement-breakpoint
CREATE INDEX "post_solutions_solution_idx" ON "post_solutions" USING btree ("solution_id");--> statement-breakpoint
CREATE INDEX "post_tags_tag_idx" ON "post_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE INDEX "posts_public_idx" ON "posts" USING btree ("published_at" DESC NULLS LAST) WHERE "posts"."status" = 'PUBLISHED';--> statement-breakpoint
CREATE INDEX "posts_scheduled_idx" ON "posts" USING btree ("scheduled_for") WHERE "posts"."status" = 'SCHEDULED';--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_id");--> statement-breakpoint
CREATE INDEX "posts_search_idx" ON "posts" USING gin ("search_vector");--> statement-breakpoint
CREATE INDEX "leads_status_created_idx" ON "leads" USING btree ("status","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "leads_email_idx" ON "leads" USING btree ("email");--> statement-breakpoint
CREATE INDEX "leads_pending_notification_idx" ON "leads" USING btree ("created_at") WHERE "leads"."notified_at" IS NULL;--> statement-breakpoint
CREATE INDEX "subscribers_status_idx" ON "newsletter_subscribers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "audit_logs_at_idx" ON "audit_logs" USING btree ("at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_user_id","at" DESC NULLS LAST);