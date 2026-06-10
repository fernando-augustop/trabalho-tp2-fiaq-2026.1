# Setup do Banco de Dados

> Este documento cobre o setup do banco de dados. Antes de prosseguir, garanta
> que o setup geral do app foi concluído conforme o [README raiz](../README.md)
> (`pnpm install`).

## Arquivos

| Arquivo | Conteúdo |
|---|---|
| `geracao_de_tabelas.sql` | Tabelas do sistema (usuario, conversa, mensagem) + trigger |
| `faq_tabelas.sql` | Tabelas do FAQ (faq_categoria, faq_entrada) |

## Variáveis de ambiente

O arquivo `.env.example` em `fiaq-app/` documenta todas as variáveis necessárias,
incluindo os dois formatos de `DATABASE_URL` (local e banco gerenciado).

---

## Subindo o Postgres localmente com Docker

> **Linux — permissão Docker**
> Se ao rodar `docker run` você receber `permission denied`, adicione seu usuário
> ao grupo Docker e reabra o terminal:
> ```bash
> sudo usermod -aG docker $USER
> newgrp docker   # aplica sem precisar fazer logout
> ```

### Passo 1 — Criar e iniciar o container

#### Linux/Mac (bash ou zsh)

```bash
docker run -d \
  --name fiaq-postgres \
  -e POSTGRES_USER=fiaq \
  -e POSTGRES_PASSWORD=fiaq123 \
  -e POSTGRES_DB=fiaq \
  -p 5432:5432 \
  postgres:16
```

#### Windows (PowerShell)

```powershell
docker run -d `
  --name fiaq-postgres `
  -e POSTGRES_USER=fiaq `
  -e POSTGRES_PASSWORD=fiaq123 `
  -e POSTGRES_DB=fiaq `
  -p 5432:5432 `
  postgres:16
```

Aguarde ~5 segundos e verifique se subiu (igual nos dois sistemas):

```bash
docker logs fiaq-postgres
```

Procure `database system is ready to accept connections` no final da saída.

---

### Passo 2 — Criar o .env com DATABASE_URL

Agora que você tem as credenciais do container criado no passo anterior,
crie o arquivo `.env` em `fiaq-app/` e preencha o banco:

```bash
cd fiaq-app
cp .env.example .env
```

Abra o `.env` e edite a linha `DATABASE_URL` com as credenciais que você
usou no `docker run` (os valores de exemplo abaixo correspondem ao Passo 1):

```
DATABASE_URL=postgresql://fiaq:fiaq123@localhost:5432/fiaq
```

Se você tiver alterado `POSTGRES_USER`, `POSTGRES_PASSWORD` ou `POSTGRES_DB`
no Passo 1, use os seus valores aqui.

---

### Passo 3 — Aplicar os SQLs

Execute os dois comandos abaixo a partir da pasta `db/` do repositório.

#### Linux/Mac

```bash
docker exec -i fiaq-postgres psql -U fiaq -d fiaq < geracao_de_tabelas.sql
docker exec -i fiaq-postgres psql -U fiaq -d fiaq < faq_tabelas.sql
```

#### Windows (PowerShell)

O operador `<` no PowerShell pode causar problemas de encoding (UTF-16).
Use `Get-Content` como alternativa segura:

```powershell
Get-Content geracao_de_tabelas.sql | docker exec -i fiaq-postgres psql -U fiaq -d fiaq
Get-Content faq_tabelas.sql | docker exec -i fiaq-postgres psql -U fiaq -d fiaq
```

---

### Passo 4 — Verificar as tabelas criadas

Igual nos dois sistemas:

```bash
docker exec -it fiaq-postgres psql -U fiaq -d fiaq -c "\dt"
```

Saída esperada — 5 tabelas:

```
           List of relations
 Schema |     Name      | Type  | Owner
--------+---------------+-------+-------
 public | conversa      | table | fiaq
 public | faq_categoria | table | fiaq
 public | faq_entrada   | table | fiaq
 public | mensagem      | table | fiaq
 public | usuario       | table | fiaq
```

---

### Passo 5 — Testar a conexão do app

Em outro terminal (deixe o anterior aberto):

```bash
cd fiaq-app && pnpm dev
```

Aguarde aparecer `http://localhost:3000/` no log. Então acesse o endpoint
de healthcheck no navegador ou com curl:

```bash
curl http://localhost:3000/api/health/db
```

Resposta esperada:

```json
{ "ok": true, "latency_ms": 3 }
```

Se aparecer erro `DATABASE_URL não definida`, confirme que o arquivo
`fiaq-app/.env` existe e que a linha `DATABASE_URL` está preenchida (Passo 2).

---

### Rotina diária

Quando voltar ao projeto em outra sessão:

```bash
docker start fiaq-postgres   # retoma o banco com os dados preservados
```

Em outro terminal:

```bash
cd fiaq-app && pnpm dev
```

Para encerrar ao fim da sessão:

```bash
docker stop fiaq-postgres    # para o container; os dados ficam intactos
```

---

### Limpar tudo (apaga os dados)

```bash
docker stop fiaq-postgres
docker rm fiaq-postgres
```

Use apenas quando quiser recomeçar do zero.

---

## Aplicando os SQLs em outros ambientes

> Esta seção é para **CI/CD, deploys em produção ou conexões diretas com bancos
> gerenciados** (Neon, Supabase, Railway, etc.). Para desenvolvimento local com
> Docker, use os comandos do Passo 3 da seção anterior.

Requer o cliente `psql` instalado na máquina. Execute a partir da pasta `db/`:

```bash
psql $DATABASE_URL -f geracao_de_tabelas.sql
psql $DATABASE_URL -f faq_tabelas.sql
```

`faq_tabelas.sql` não possui FK para as tabelas de `geracao_de_tabelas.sql`, mas
a convenção de manter a ordem garante um ambiente consistente.
