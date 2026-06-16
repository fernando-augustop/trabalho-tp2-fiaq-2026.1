-- Executar APOS 01_faq_tabelas.sql e 02_perguntas_tabelas.sql em Supabase.
--
-- Este arquivo endurece o schema publico para uso em producao:
-- - cria a role limitada fiaq_app sem senha no SQL versionado;
-- - habilita RLS nas tabelas publicas;
-- - concede apenas as permissoes que o backend server-side precisa.
--
-- A senha/login da role deve ser definida fora do repo:
--   ALTER ROLE fiaq_app WITH LOGIN PASSWORD '...';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fiaq_app') THEN
    CREATE ROLE fiaq_app NOLOGIN;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO fiaq_app', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO fiaq_app;
GRANT USAGE ON SCHEMA extensions TO fiaq_app;

GRANT SELECT ON faq_categoria, faq_entrada TO fiaq_app;
GRANT SELECT ON rag_documento, rag_chunk TO fiaq_app;
GRANT SELECT, INSERT, UPDATE ON pergunta_registrada TO fiaq_app;
GRANT SELECT, INSERT ON ocorrencia_pergunta TO fiaq_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fiaq_app;
GRANT EXECUTE ON FUNCTION buscar_rag_chunks(extensions.vector(2048), TEXT, DOUBLE PRECISION, INT) TO fiaq_app;

ALTER TABLE faq_categoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_documento ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_chunk ENABLE ROW LEVEL SECURITY;
ALTER TABLE pergunta_registrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencia_pergunta ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'faq_categoria'
      AND policyname = 'fiaq_app_select_faq_categoria'
  ) THEN
    CREATE POLICY fiaq_app_select_faq_categoria
      ON faq_categoria
      FOR SELECT
      TO fiaq_app
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'faq_entrada'
      AND policyname = 'fiaq_app_select_faq_entrada'
  ) THEN
    CREATE POLICY fiaq_app_select_faq_entrada
      ON faq_entrada
      FOR SELECT
      TO fiaq_app
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_documento'
      AND policyname = 'fiaq_app_select_rag_documento'
  ) THEN
    CREATE POLICY fiaq_app_select_rag_documento
      ON rag_documento
      FOR SELECT
      TO fiaq_app
      USING (ativo = TRUE);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_chunk'
      AND policyname = 'fiaq_app_select_rag_chunk'
  ) THEN
    CREATE POLICY fiaq_app_select_rag_chunk
      ON rag_chunk
      FOR SELECT
      TO fiaq_app
      USING (
        ativo = TRUE
        AND EXISTS (
          SELECT 1
          FROM rag_documento rd
          WHERE rd.id = rag_chunk.id_documento
            AND rd.ativo = TRUE
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pergunta_registrada'
      AND policyname = 'fiaq_app_select_pergunta'
  ) THEN
    CREATE POLICY fiaq_app_select_pergunta
      ON pergunta_registrada
      FOR SELECT
      TO fiaq_app
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pergunta_registrada'
      AND policyname = 'fiaq_app_insert_pergunta'
  ) THEN
    CREATE POLICY fiaq_app_insert_pergunta
      ON pergunta_registrada
      FOR INSERT
      TO fiaq_app
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'pergunta_registrada'
      AND policyname = 'fiaq_app_update_pergunta'
  ) THEN
    CREATE POLICY fiaq_app_update_pergunta
      ON pergunta_registrada
      FOR UPDATE
      TO fiaq_app
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ocorrencia_pergunta'
      AND policyname = 'fiaq_app_select_ocorrencia'
  ) THEN
    CREATE POLICY fiaq_app_select_ocorrencia
      ON ocorrencia_pergunta
      FOR SELECT
      TO fiaq_app
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'ocorrencia_pergunta'
      AND policyname = 'fiaq_app_insert_ocorrencia'
  ) THEN
    CREATE POLICY fiaq_app_insert_ocorrencia
      ON ocorrencia_pergunta
      FOR INSERT
      TO fiaq_app
      WITH CHECK (true);
  END IF;
END
$$;
