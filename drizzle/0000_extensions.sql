-- Extensões exigidas pelo modelo de dados (docs/03, parte 7):
--   citext   → e-mails comparados sem diferença de caixa
--   unaccent → busca de texto sem acentos
-- Ambas são "trusted" no PostgreSQL 13+ (o dono do banco pode criá-las). Em provedor
-- gerenciado, confirmar a disponibilidade antes de escolher o provedor.
CREATE EXTENSION IF NOT EXISTS citext;
--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS unaccent;
