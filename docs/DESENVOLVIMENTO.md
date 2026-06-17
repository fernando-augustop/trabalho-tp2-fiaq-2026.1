# Desenvolvimento local

Este guia descreve o caminho recomendado para rodar o fIAq localmente com a
mesma suite usada no deploy: app Nuxt, APIs Nitro, Supabase Postgres com
pgvector e OpenRouter para chat/embeddings.

## Fluxo recomendado

Rode tudo a partir da raiz do repositório:

```bash
pnpm install
pnpm dev
```

O script da raiz chama `pnpm --dir fiaq-app dev`, então não é preciso entrar em
`fiaq-app/` manualmente. O Nuxt tenta abrir `http://localhost:3000/`; se a porta
estiver ocupada, ele escolhe outra porta, como `http://localhost:3001/`. Use
sempre a URL impressa no terminal.

Esse comando sobe:

- frontend Nuxt 4;
- APIs Nitro em `/api/*`;
- conexão com Supabase via `DATABASE_URL`;
- OpenRouter para chat e embeddings quando `CHAT_PROVIDER=openrouter` e
  `EMBED_PROVIDER=openrouter`.

## Variáveis locais

As variáveis ficam em `fiaq-app/.env`. Esse arquivo não deve ser versionado.
Para criar um novo ambiente local:

```bash
cp fiaq-app/.env.example fiaq-app/.env
```

Para reproduzir o deploy Vercel + Supabase, use providers OpenRouter e a
Transaction Pooler URI do Supabase:

```env
CHAT_PROVIDER=openrouter
EMBED_PROVIDER=openrouter
OPENROUTER_API_KEY=...
OPENROUTER_CHAT_MODEL=google/gemma-4-31b-it:free
OPENROUTER_CHAT_FALLBACK_MODELS=nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_EMBED_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free
DATABASE_URL=postgresql://fiaq_app.PROJECT_REF:SENHA@REGIAO.pooler.supabase.com:6543/postgres?sslmode=require
```

Notas importantes:

- A `DATABASE_URL` do runtime deve usar a role limitada `fiaq_app`.
- A URI do pooler deve usar porta `6543` e `sslmode=require`.
- O app usa `postgres.js` com `prepare: false`, compatível com o pooler do
  Supabase em ambiente serverless.
- Prefira modelo gratuito fixo em `OPENROUTER_CHAT_MODEL`; `openrouter/free`
  roteia aleatoriamente e pode escolher um modelo menos adequado para português.
- Embeddings precisam continuar no mesmo modelo usado no seed do RAG.
- Nunca commite `OPENROUTER_API_KEY`, senha do banco ou connection string real.

## Validar a suite completa

Depois que o `pnpm dev` imprimir a URL local, defina a porta usada:

```bash
PORT=3000
```

Se o Nuxt tiver escolhido outra porta, ajuste:

```bash
PORT=3001
```

Valide o banco:

```bash
curl "http://localhost:${PORT}/api/health/db"
```

Resposta esperada:

```json
{
  "ok": true,
  "configured": true
}
```

Valide o FAQ vindo do backend:

```bash
curl -sS -o /tmp/fiaq-faq.json \
  -w '%{http_code} %{content_type} %{size_download}\n' \
  "http://localhost:${PORT}/api/faq"
```

Resposta esperada: `200 application/json ...`. No terminal do servidor, o log
deve indicar que o FAQ foi carregado de `database`.

Valide chat, embeddings, RAG e streaming SSE:

```bash
timeout 90s curl -sS -N \
  -X POST "http://localhost:${PORT}/api/chat" \
  -H 'Content-Type: application/json' \
  --data '{"messages":[{"role":"user","content":"Como faço matrícula em disciplina?"}]}'
```

Resposta esperada:

- eventos `token`;
- um evento `sources`;
- um evento final `done`;
- log no servidor com `Contexto RAG carregado de database`.

Valide o registro anônimo agregado de perguntas:

```bash
curl "http://localhost:${PORT}/api/perguntas/em-alta?dias=7&limite=5"
```

Esse endpoint confirma que a pergunta passou pelo fluxo de gravação no
Supabase.

## Simular o deploy localmente

Para uma checagem mais próxima do deploy Vercel, rode:

```bash
pnpm build
pnpm preview
```

Use os mesmos endpoints da seção anterior contra a porta impressa pelo
`pnpm preview`. O `pnpm dev` continua sendo o comando diário mais rápido; o
`build` + `preview` serve para validar o bundle gerado pelo Nitro.

## Popular ou atualizar conhecimento

Use uma connection string com permissão de escrita nas tabelas de FAQ e RAG.
Para seed, normalmente use a role administrativa do banco, não a role limitada
`fiaq_app` do runtime:

```bash
DATABASE_URL="postgresql://postgres:..." \
OPENROUTER_API_KEY="..." \
CHAT_PROVIDER=openrouter \
EMBED_PROVIDER=openrouter \
OPENROUTER_EMBED_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free \
pnpm seed:knowledge
```

O modelo de embedding usado no seed precisa ser o mesmo configurado no runtime;
caso contrário, a busca em `rag_chunk.embedding` fica inconsistente.

## Alternativa com Postgres local

Para desenvolver sem Supabase remoto, siga [`db/SETUP.md`](../db/SETUP.md).
Esse caminho usa Docker + `pgvector/pgvector:pg16` e troca a `DATABASE_URL` para
um Postgres local. Ele é útil quando o Supabase estiver indisponível, mas o
caminho mais fiel ao deploy continua sendo `pnpm dev` com a URI do Supabase.

## Diagnóstico rápido

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Nuxt abriu em `3001` | `3000` já estava ocupada | Use a URL impressa no terminal |
| `/api/health/db` retorna `configured: false` | `DATABASE_URL` ausente | Confira `fiaq-app/.env` |
| `/api/health/db` retorna `ok: false` | Banco indisponível ou URI inválida | Verifique senha, pooler `:6543` e `sslmode=require` |
| Chat retorna `LLM_UNAVAILABLE` | OpenRouter indisponível ou chave inválida | Confira `OPENROUTER_API_KEY` e providers |
| RAG carrega fallback JSON | Banco/RAG indisponível ou sem seed | Rode o healthcheck e revise `pnpm seed:knowledge` |
