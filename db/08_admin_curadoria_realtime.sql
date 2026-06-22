-- Realtime para a fila de curadoria administrativa.
-- Apenas usuarios autenticados cujo e-mail esta ativo em admin_usuario podem
-- receber eventos de web_resposta_candidata pelo websocket da Supabase.

REVOKE ALL ON admin_usuario FROM anon;
REVOKE ALL ON web_resposta_candidata FROM anon;
REVOKE ALL ON admin_usuario FROM authenticated;
REVOKE ALL ON web_resposta_candidata FROM authenticated;

GRANT SELECT ON admin_usuario TO authenticated;
GRANT SELECT ON web_resposta_candidata TO authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_usuario'
      AND policyname = 'authenticated_admin_usuario_self_select'
  ) THEN
    CREATE POLICY authenticated_admin_usuario_self_select
      ON admin_usuario
      FOR SELECT
      TO authenticated
      USING (
        ativo = TRUE
        AND lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'web_resposta_candidata'
      AND policyname = 'authenticated_admin_web_resposta_candidata_select'
  ) THEN
    CREATE POLICY authenticated_admin_web_resposta_candidata_select
      ON web_resposta_candidata
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1
          FROM admin_usuario admin
          WHERE admin.ativo = TRUE
            AND lower(admin.email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'web_resposta_candidata'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.web_resposta_candidata;
  END IF;
END
$$;
