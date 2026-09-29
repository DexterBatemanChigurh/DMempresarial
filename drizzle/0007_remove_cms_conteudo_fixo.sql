-- Soluções, especialistas e páginas deixam o banco: o conteúdo passa a viver em
-- src/content/dm.ts (decisão do usuário, 28/09/2026). Ordem importa: as chaves estrangeiras
-- saem ANTES das tabelas (o DROP ... CASCADE já as removeria e o DROP CONSTRAINT falharia).
ALTER TABLE "posts" DROP CONSTRAINT "posts_author_id_specialists_id_fk";--> statement-breakpoint
ALTER TABLE "leads" DROP CONSTRAINT "leads_interest_solution_id_solutions_id_fk";--> statement-breakpoint
DROP TABLE "post_solutions";--> statement-breakpoint
DROP TABLE "specialist_categories";--> statement-breakpoint
DROP TABLE "specialist_solutions";--> statement-breakpoint
DROP TABLE "solution_items";--> statement-breakpoint
DROP TABLE "solutions";--> statement-breakpoint
DROP TABLE "specialists";--> statement-breakpoint
DROP TABLE "pages";--> statement-breakpoint
-- Autor do artigo: agora o slug de um especialista da lista fixa. Artigos que já existirem
-- recebem o especialista provisório; o padrão sai logo depois (o valor vem sempre da aplicação).
DROP INDEX "posts_author_idx";--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "author_slug" text NOT NULL DEFAULT 'especialista-dm';--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "author_slug" DROP DEFAULT;--> statement-breakpoint
CREATE INDEX "posts_author_idx" ON "posts" USING btree ("author_slug");--> statement-breakpoint
ALTER TABLE "posts" DROP COLUMN "author_id";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "interest_solution_id";--> statement-breakpoint
DROP TYPE "public"."page_template";--> statement-breakpoint
DROP TYPE "public"."solution_item_kind";--> statement-breakpoint
DROP TYPE "public"."solution_type";--> statement-breakpoint
DROP TYPE "public"."specialist_kind";
