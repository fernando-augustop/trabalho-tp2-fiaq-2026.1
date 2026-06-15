-- Executar PRIMEIRO (02_perguntas_tabelas.sql depende de faq_entrada).
-- Segue o padrão de nomenclatura do projeto (português, prefixo dthr_ para timestamps).

CREATE TABLE faq_categoria (
    id           SERIAL PRIMARY KEY,
    slug         VARCHAR(80)  NOT NULL UNIQUE,
    titulo       VARCHAR(120) NOT NULL,
    descricao    TEXT,
    ordem        INT NOT NULL DEFAULT 999,
    dthr_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE faq_entrada (
    id               SERIAL PRIMARY KEY,
    id_categoria     INT  NOT NULL,
    slug             VARCHAR(200) NOT NULL UNIQUE,
    titulo           VARCHAR(500) NOT NULL,
    conteudo         TEXT NOT NULL,
    url_fonte        TEXT,
    dthr_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- RESTRICT: deletar categoria com entradas é erro explícito, não cascata silenciosa
    FOREIGN KEY (id_categoria) REFERENCES faq_categoria(id) ON DELETE RESTRICT
);

CREATE INDEX idx_faq_entrada_categoria ON faq_entrada(id_categoria);
