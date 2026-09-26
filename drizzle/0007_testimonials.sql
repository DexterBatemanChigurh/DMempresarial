CREATE TYPE "public"."testimonial_source" AS ENUM('GOOGLE', 'MANUAL');--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"author_name" text NOT NULL,
	"author_detail" text,
	"quote" text NOT NULL,
	"rating" smallint,
	"source" "testimonial_source" NOT NULL,
	"given_at" timestamp with time zone,
	"position" integer DEFAULT 0 NOT NULL,
	"status" "publish_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"archived_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" text,
	"updated_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "testimonials_author_name_max_len" CHECK (char_length("testimonials"."author_name") <= 120),
	CONSTRAINT "testimonials_author_detail_max_len" CHECK (char_length("testimonials"."author_detail") <= 120),
	CONSTRAINT "testimonials_quote_max_len" CHECK (char_length("testimonials"."quote") <= 2000),
	CONSTRAINT "testimonials_rating_range" CHECK ("testimonials"."rating" IS NULL OR "testimonials"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "testimonials_status_dates" CHECK (("testimonials"."status" <> 'PUBLISHED' OR "testimonials"."published_at" IS NOT NULL) AND ("testimonials"."status" <> 'ARCHIVED' OR "testimonials"."archived_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "testimonials" ADD CONSTRAINT "testimonials_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "testimonials_public_idx" ON "testimonials" USING btree ("position") WHERE "testimonials"."status" = 'PUBLISHED';