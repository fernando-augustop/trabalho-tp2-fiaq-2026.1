CREATE TABLE usuario (
    matricula SERIAL PRIMARY KEY,
    nome VARCHAR(20) NOT NULL,
    email VARCHAR(20) NOT NULL UNIQUE,
    senha_hash VARCHAR(32) NOT NULL,
    dthr_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE conversa (
    id_conversa SERIAL PRIMARY KEY,
    titulo VARCHAR(20),
    matricula INT,
    status INT NOT NULL,
    dthr_criacao TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (matricula) REFERENCES usuario(matricula)
);

CREATE TABLE mensagem (
    id_mensagem SERIAL PRIMARY KEY,
    id_conversa INT NOT NULL,
    conteudo TEXT NOT NULL,
    dthr_mensagem TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    remetente INT NOT NULL,
    
    FOREIGN KEY (id_conversa) REFERENCES conversa(id_conversa) ON DELETE CASCADE
);