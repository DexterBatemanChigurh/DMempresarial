-- Busca sem acento (docs/03, parte 19). `unaccent()` é STABLE, então não pode ser usada em coluna
-- gerada nem em índice. Este invólucro fixa o dicionário e é declarado IMMUTABLE (o dicionário
-- `public.unaccent` não muda em runtime), truque padrão do PostgreSQL para esse caso.
CREATE OR REPLACE FUNCTION public.f_unaccent(text)
  RETURNS text
  LANGUAGE sql
  IMMUTABLE
  PARALLEL SAFE
  STRICT
AS $$ SELECT public.unaccent('public.unaccent'::regdictionary, $1) $$;
