-- F0: matricula é INT (não SERIAL) porque o valor é a matrícula real da UnB,
--     informada pelo próprio aluno no cadastro (ex: 221012345).
CREATE TABLE usuario (
    matricula  INT          PRIMARY KEY,
    nome       VARCHAR(120) NOT NULL,
    email      VARCHAR(255) NOT NULL UNIQUE,
    senha_hash VARCHAR(255) NOT NULL,
    dthr_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversa (
    id_conversa      SERIAL PRIMARY KEY,
    titulo           VARCHAR(200),
    matricula        INT NOT NULL,
    status           INT NOT NULL DEFAULT 0,
    dthr_criacao     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    dthr_atualizacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (matricula) REFERENCES usuario(matricula) ON DELETE CASCADE
);

CREATE TABLE mensagem (
    id_mensagem   SERIAL PRIMARY KEY,
    id_conversa   INT  NOT NULL,
    conteudo      TEXT NOT NULL,
    dthr_mensagem TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remetente     INT NOT NULL,

    FOREIGN KEY (id_conversa) REFERENCES conversa(id_conversa) ON DELETE CASCADE
);

-- Índices em colunas de FK (o Postgres não os cria automaticamente)
CREATE INDEX idx_conversa_matricula   ON conversa(matricula);
CREATE INDEX idx_mensagem_id_conversa ON mensagem(id_conversa);

-- Mantém conversa.dthr_atualizacao sincronizado com a última mensagem inserida
CREATE OR REPLACE FUNCTION fn_atualiza_conversa_dthr()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE conversa
    SET dthr_atualizacao = CURRENT_TIMESTAMP
    WHERE id_conversa = NEW.id_conversa;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_mensagem_atualiza_conversa
AFTER INSERT ON mensagem
FOR EACH ROW
EXECUTE FUNCTION fn_atualiza_conversa_dthr();
