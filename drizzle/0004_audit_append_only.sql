-- audit_logs é append-only: o role de aplicação só pode INSERIR e LER. Sem UPDATE, DELETE nem
-- TRUNCATE, nem um bug consegue reescrever a história (docs/03, parte 30). O `db:bootstrap`
-- repete esta regra porque ele reaplica DML em todas as tabelas.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'dm_app') THEN
    REVOKE UPDATE, DELETE, TRUNCATE ON TABLE public.audit_logs FROM dm_app;
  END IF;
END
$$;
