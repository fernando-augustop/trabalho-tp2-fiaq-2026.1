-- Fluxo de curadoria: respostas enriquecidas por pesquisa web entram em uma
-- fila de revisão. Administradores aprovam respostas úteis antes que virem
-- conhecimento RAG permanente.

CREATE TABLE IF NOT EXISTS admin_usuario (
    id              SERIAL PRIMARY KEY,
    email           TEXT NOT NULL UNIQUE,
    ativo           BOOLEAN NOT NULL DEFAULT TRUE,
    criado_por      TEXT,
    dthr_criacao    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS web_resposta_candidata (
    id                  SERIAL PRIMARY KEY,
    pergunta            TEXT NOT NULL,
    resposta            TEXT NOT NULL,
    fontes_usadas       JSONB NOT NULL DEFAULT '[]'::jsonb,
    motivo_busca_web    TEXT NOT NULL CHECK (motivo_busca_web IN ('fallback_automatico', 'feedback_negativo')),
    status              TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'rejeitada')),
    checksum            TEXT NOT NULL UNIQUE,
    aprovado_por        TEXT,
    aprovado_em         TIMESTAMP,
    rejeitado_por       TEXT,
    rejeitado_em        TIMESTAMP,
    observacao_admin    TEXT,
    id_rag_documento    INT REFERENCES rag_documento(id) ON DELETE SET NULL,
    chunk_uid_rag       VARCHAR(320) REFERENCES rag_chunk(chunk_uid) ON DELETE SET NULL,
    dthr_criacao        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_atualizacao    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_admin_usuario_email_ativo
  ON admin_usuario (lower(email), ativo);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_usuario_email_lower
  ON admin_usuario (lower(email));

CREATE INDEX IF NOT EXISTS idx_web_resposta_candidata_status
  ON web_resposta_candidata (status, dthr_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_web_resposta_candidata_motivo
  ON web_resposta_candidata (motivo_busca_web, dthr_criacao DESC);

CREATE INDEX IF NOT EXISTS idx_web_resposta_candidata_fontes
  ON web_resposta_candidata USING GIN (fontes_usadas);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_origem_dthr
  ON rag_chunk(origem, dthr_atualizacao DESC);

GRANT SELECT, INSERT, UPDATE ON admin_usuario TO fiaq_app;
GRANT SELECT, INSERT, UPDATE ON web_resposta_candidata TO fiaq_app;
GRANT INSERT, UPDATE ON rag_documento, rag_chunk TO fiaq_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO fiaq_app;

ALTER TABLE admin_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE web_resposta_candidata ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  ALTER TABLE web_resposta_candidata
    ALTER COLUMN chunk_uid_rag TYPE VARCHAR(320);

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'web_resposta_candidata_chunk_uid_rag_fkey'
      AND conrelid = 'web_resposta_candidata'::regclass
  ) THEN
    ALTER TABLE web_resposta_candidata
      ADD CONSTRAINT web_resposta_candidata_chunk_uid_rag_fkey
      FOREIGN KEY (chunk_uid_rag)
      REFERENCES rag_chunk(chunk_uid)
      ON DELETE SET NULL;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'admin_usuario'
      AND policyname = 'fiaq_app_admin_usuario_all'
  ) THEN
    CREATE POLICY fiaq_app_admin_usuario_all
      ON admin_usuario
      FOR ALL
      TO fiaq_app
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'web_resposta_candidata'
      AND policyname = 'fiaq_app_web_resposta_candidata_all'
  ) THEN
    CREATE POLICY fiaq_app_web_resposta_candidata_all
      ON web_resposta_candidata
      FOR ALL
      TO fiaq_app
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_documento'
      AND policyname = 'fiaq_app_insert_rag_documento'
  ) THEN
    CREATE POLICY fiaq_app_insert_rag_documento
      ON rag_documento
      FOR INSERT
      TO fiaq_app
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_documento'
      AND policyname = 'fiaq_app_update_rag_documento'
  ) THEN
    CREATE POLICY fiaq_app_update_rag_documento
      ON rag_documento
      FOR UPDATE
      TO fiaq_app
      USING (true)
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_chunk'
      AND policyname = 'fiaq_app_insert_rag_chunk'
  ) THEN
    CREATE POLICY fiaq_app_insert_rag_chunk
      ON rag_chunk
      FOR INSERT
      TO fiaq_app
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rag_chunk'
      AND policyname = 'fiaq_app_update_rag_chunk'
  ) THEN
    CREATE POLICY fiaq_app_update_rag_chunk
      ON rag_chunk
      FOR UPDATE
      TO fiaq_app
      USING (true)
      WITH CHECK (true);
  END IF;
END
$$;
