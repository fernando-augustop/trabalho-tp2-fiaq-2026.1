-- Executar antes de reaplicar 03_supabase_app_role.sql.
--
-- Guarda feedback anônimo sobre respostas do chatbot. O objetivo é medir se a
-- primeira resposta baseada no RAG foi suficiente e quando o usuário pediu uma
-- resposta complementar com pesquisa web/Firecrawl.

CREATE TABLE IF NOT EXISTS avaliacao_resposta (
    id                 SERIAL PRIMARY KEY,
    pergunta           TEXT NOT NULL,
    resposta           TEXT NOT NULL,
    avaliacao          TEXT NOT NULL CHECK (avaliacao IN ('helpful', 'unhelpful')),
    fontes_usadas      JSONB NOT NULL DEFAULT '[]'::jsonb,
    acionou_busca_web  BOOLEAN NOT NULL DEFAULT FALSE,
    dthr_avaliacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_avaliacao_resposta_avaliacao
  ON avaliacao_resposta(avaliacao);

CREATE INDEX IF NOT EXISTS idx_avaliacao_resposta_dthr
  ON avaliacao_resposta(dthr_avaliacao DESC);

CREATE INDEX IF NOT EXISTS idx_avaliacao_resposta_busca_web
  ON avaliacao_resposta(acionou_busca_web, dthr_avaliacao DESC);
