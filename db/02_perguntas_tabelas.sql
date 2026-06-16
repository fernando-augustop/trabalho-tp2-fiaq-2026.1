-- Executar APÓS 01_faq_tabelas.sql
-- pergunta_registrada tem FK opcional para faq_entrada (criada no 01_).

-- Uma linha por "pergunta única", identificada por similaridade de embedding.
-- A similaridade é calculada por cosseno em TypeScript — mesmo padrão do
-- vectorStore da squad de IA. Migração natural para pgvector se o volume
-- crescer (ver db/README.md).
CREATE TABLE IF NOT EXISTS pergunta_registrada (
    id                SERIAL PRIMARY KEY,
    texto_original    TEXT NOT NULL,
    texto_normalizado TEXT NOT NULL,
    embedding         JSONB NOT NULL,
    modelo_embedding  TEXT NOT NULL,
    total_vezes       INT  NOT NULL DEFAULT 1,
    id_faq_entrada    INT REFERENCES faq_entrada(id) ON DELETE SET NULL,
    dthr_primeira     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_ultima       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Uma linha por ocorrência individual — permite análise temporal (picos por
-- semana/mês) além do contador agregado em pergunta_registrada.
CREATE TABLE IF NOT EXISTS ocorrencia_pergunta (
    id                     SERIAL PRIMARY KEY,
    id_pergunta_registrada INT NOT NULL
                           REFERENCES pergunta_registrada(id) ON DELETE CASCADE,
    resposta_gerada        TEXT NOT NULL,
    fontes_usadas          JSONB,
    dthr_ocorrencia        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pergunta_total       ON pergunta_registrada(total_vezes DESC);
CREATE INDEX IF NOT EXISTS idx_pergunta_modelo      ON pergunta_registrada(modelo_embedding);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_pergunta  ON ocorrencia_pergunta(id_pergunta_registrada);
CREATE INDEX IF NOT EXISTS idx_ocorrencia_dthr      ON ocorrencia_pergunta(dthr_ocorrencia);
