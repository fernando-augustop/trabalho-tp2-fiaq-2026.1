-- Executar APOS 04_rag_pgvector.sql.
--
-- Migra bancos existentes para a versao endurecida da funcao de busca RAG:
-- - fixa search_path para remover o alerta function_search_path_mutable;
-- - qualifica as tabelas publicas usadas pela funcao;
-- - preserva o filtro por score usado pelo SQL versionado.

CREATE OR REPLACE FUNCTION public.buscar_rag_chunks (
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

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'fiaq_app') THEN
    GRANT EXECUTE
      ON FUNCTION public.buscar_rag_chunks(extensions.vector(2048), TEXT, DOUBLE PRECISION, INT)
      TO fiaq_app;
  END IF;
END
$$;
