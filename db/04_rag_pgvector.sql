-- Executar APOS 01_faq_tabelas.sql e 02_perguntas_tabelas.sql.
--
-- Armazena a base de conhecimento do chatbot no Postgres/Supabase com pgvector.
-- O modelo de embedding usado no deploy atual gera 2048 dimensoes:
--   nvidia/llama-nemotron-embed-vl-1b-v2:free
--
-- openrouter/free e o roteador de chat. A busca semantica precisa de um modelo
-- de embedding separado e do mesmo modelo para indexar e consultar.

CREATE SCHEMA IF NOT EXISTS extensions;

CREATE EXTENSION IF NOT EXISTS vector
WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS rag_documento (
    id               SERIAL PRIMARY KEY,
    origem           VARCHAR(20)  NOT NULL
                     CHECK (origem IN ('faq', 'pdf', 'crawl')),
    slug             VARCHAR(260) NOT NULL UNIQUE,
    titulo           VARCHAR(500) NOT NULL,
    url_fonte        TEXT,
    caminho_origem   TEXT,
    checksum         TEXT,
    metadados        JSONB NOT NULL DEFAULT '{}'::jsonb,
    ativo            BOOLEAN NOT NULL DEFAULT TRUE,
    dthr_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rag_chunk (
    id                SERIAL PRIMARY KEY,
    id_documento      INT NOT NULL REFERENCES rag_documento(id) ON DELETE CASCADE,
    id_faq_entrada    INT REFERENCES faq_entrada(id) ON DELETE SET NULL,
    origem            VARCHAR(20)  NOT NULL
                      CHECK (origem IN ('faq', 'pdf', 'crawl')),
    chunk_uid         VARCHAR(320) NOT NULL UNIQUE,
    ordem             INT NOT NULL DEFAULT 1,
    titulo            VARCHAR(500) NOT NULL,
    conteudo          TEXT NOT NULL,
    url_fonte         TEXT,
    metadados         JSONB NOT NULL DEFAULT '{}'::jsonb,
    provedor_embedding TEXT NOT NULL,
    modelo_embedding  TEXT NOT NULL,
    embedding         extensions.vector(2048) NOT NULL,
    -- O pgvector indexa ate 2000 dimensoes em vector; halfvec cobre 2048 com
    -- otimo custo/beneficio. A busca usa halfvec para candidatos e reordena por
    -- distancia exata do vector completo dentro da funcao.
    embedding_half    extensions.halfvec(2048)
                      GENERATED ALWAYS AS (embedding::extensions.halfvec(2048)) STORED,
    ativo             BOOLEAN NOT NULL DEFAULT TRUE,
    dthr_criacao      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_atualizacao  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_rag_documento_origem
  ON rag_documento(origem);

CREATE INDEX IF NOT EXISTS idx_rag_documento_ativo
  ON rag_documento(ativo);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_documento
  ON rag_chunk(id_documento);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_faq_entrada
  ON rag_chunk(id_faq_entrada);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_modelo_ativo
  ON rag_chunk(modelo_embedding, ativo);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_origem
  ON rag_chunk(origem);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_metadados
  ON rag_chunk USING GIN (metadados);

CREATE INDEX IF NOT EXISTS idx_rag_chunk_embedding_hnsw
  ON rag_chunk
  USING hnsw (embedding_half extensions.halfvec_cosine_ops)
  WITH (m = 16, ef_construction = 64);

CREATE OR REPLACE FUNCTION buscar_rag_chunks (
  p_query_embedding extensions.vector(2048),
  p_modelo_embedding TEXT,
  p_match_threshold DOUBLE PRECISION DEFAULT 0.45,
  p_match_count INT DEFAULT 5
)
RETURNS TABLE (
  id TEXT,
  titulo TEXT,
  conteudo TEXT,
  url TEXT,
  origem TEXT,
  similaridade DOUBLE PRECISION,
  score DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SET search_path = public, extensions
AS $$
  WITH candidatos AS (
    SELECT
      rc.chunk_uid,
      rc.titulo,
      rc.conteudo,
      COALESCE(rc.url_fonte, rd.url_fonte, '') AS url,
      rc.origem,
      (rc.embedding OPERATOR(extensions.<=>) p_query_embedding) AS distancia_exata,
      CASE rc.origem
        WHEN 'faq' THEN 0.06
        WHEN 'pdf' THEN 0.02
        ELSE 0
      END AS boost
    FROM public.rag_chunk rc
    JOIN public.rag_documento rd ON rd.id = rc.id_documento
    WHERE rc.ativo = TRUE
      AND rd.ativo = TRUE
      AND rc.modelo_embedding = p_modelo_embedding
    ORDER BY rc.embedding_half OPERATOR(extensions.<=>) (p_query_embedding::extensions.halfvec(2048)) ASC
    LIMIT LEAST(GREATEST(p_match_count * 8, 20), 100)
  )
  SELECT
    chunk_uid::TEXT AS id,
    titulo::TEXT,
    conteudo::TEXT,
    url::TEXT,
    origem::TEXT,
    (1 - distancia_exata)::DOUBLE PRECISION AS similaridade,
    (1 - distancia_exata + boost)::DOUBLE PRECISION AS score
  FROM candidatos
  WHERE (1 - distancia_exata + boost) >= p_match_threshold
  ORDER BY score DESC, similaridade DESC
  LIMIT LEAST(p_match_count, 20);
$$;
