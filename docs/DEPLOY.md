# Deploy gratuito do fIAq

## Status atual

| Item | Valor |
|---|---|
| Produção | <https://fiaq-app.vercel.app> |
| Projeto Vercel | `fernandos-projects-8b069a52/fiaq-app` |
| Root Directory | `fiaq-app` |
| Build Command | `pnpm build` |
| Output Directory | gerenciado pelo adapter SvelteKit |
| Supabase Project Ref | `dwjzjuqtsgrvbiwjvemu` |
| Role do app | `fiaq_app` |
| Pooler | `aws-1-us-west-1.pooler.supabase.com:6543` |
| Relatório executivo | fonte em `docs/relatorio-executivo-arquitetura-deploy.tex`; PDF local em `docs/relatorio-executivo-arquitetura-deploy.pdf` |

> A chave OpenRouter e a `DATABASE_URL` real ficam em variáveis seguras da Vercel
> e não devem ser commitadas. O PDF executivo é gerado localmente com Tectonic e
> não é versionado.

O caminho gratuito recomendado para demonstração acadêmica é:

| Camada | Serviço | Motivo |
|---|---|---|
| App SvelteKit + Vite | Vercel Hobby | Deploy simples via GitHub, HTTPS automático e suporte a Functions/SSE |
| Postgres | Supabase Free | FAQ, RAG com pgvector e métricas anônimas |
| IA | OpenRouter | Já é o provider usado pelo RAG; o modelo `:free` serve para demonstração |

O fIAq é um app **SvelteKit + Vite** (em `fiaq-app/`) com APIs server do **SvelteKit** e RAG via **OpenRouter**. O
conhecimento principal fica no **Supabase Postgres com pgvector**: FAQ, PDFs e
páginas crawleadas são armazenados em `rag_documento`/`rag_chunk`. O arquivo
`rag-index.json` continua versionado apenas como fallback de compatibilidade.

Para rodar a mesma stack em desenvolvimento local, use
[`docs/DESENVOLVIMENTO.md`](./DESENVOLVIMENTO.md). O comando diário é
`pnpm dev` na raiz do repositório, usando `fiaq-app/.env` com `DATABASE_URL` do
Supabase e variáveis do OpenRouter.

## 1. Criar o banco no Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute os arquivos abaixo, nesta ordem:

```sql
-- primeiro: db/01_faq_tabelas.sql
-- depois:   db/02_perguntas_tabelas.sql
-- depois:   db/04_rag_pgvector.sql
-- depois:   db/05_supabase_rag_search_hardening.sql
-- depois:   db/06_avaliacao_resposta.sql
-- depois:   db/03_supabase_app_role.sql
-- por fim:  db/07_admin_rag_review.sql
```

Os SQLs usam `IF NOT EXISTS`, então podem ser reaplicados durante setup sem
falhar por tabela ou índice já existente. O `04_` ativa `pgvector`, cria as
tabelas RAG e a função `buscar_rag_chunks`. O `05_` reaplica a função com
`search_path` fixo para bancos já existentes. O `03_` habilita RLS e cria a
role limitada `fiaq_app`; a senha dessa role deve ser definida diretamente no
Supabase, fora do repositório.

## 2. Popular o conhecimento no banco

Depois de criar as tabelas, rode o seed a partir da raiz do repositório usando
uma connection string com permissão de escrita nas tabelas de FAQ e RAG:

```bash
DATABASE_URL="postgresql://postgres:..." \
OPENROUTER_API_KEY="..." \
CHAT_PROVIDER=openrouter \
EMBED_PROVIDER=openrouter \
OPENROUTER_EMBED_MODEL=nvidia/llama-nemotron-embed-vl-1b-v2:free \
pnpm seed:knowledge
```

O seed lê `fiaq-app/data/faq/*.json`, `fiaq-app/data/pdfs/` e
`fiaq-app/data/crawl/`, gera embeddings e faz upsert idempotente em
`faq_categoria`, `faq_entrada`, `rag_documento` e `rag_chunk`. Para o runtime da
Vercel, continue usando a role limitada `fiaq_app`; ela só precisa de `SELECT`
no conhecimento e permissões de escrita apenas nas métricas anônimas.

## 3. Pegar a connection string do Supabase

Para Vercel/serverless, prefira a **Transaction Pooler URI** do Supabase. Ela
normalmente usa porta `6543`. Garanta SSL e use a role limitada do app:

```env
DATABASE_URL=postgresql://fiaq_app.PROJECT_REF:SENHA@REGIAO.pooler.supabase.com:6543/postgres?sslmode=require
```

O app usa `postgres.js` com `prepare: false`, que é necessário para operar bem
através de poolers que não suportam prepared statements.

## 4. Configurar o projeto na Vercel

Ao importar o repositório na Vercel:

| Campo | Valor |
|---|---|
| **Root Directory** | `fiaq-app` |
| **Framework Preset** | SvelteKit |
| **Install Command** | `pnpm install` |
| **Build Command** | `pnpm build` |
| **Output Directory** | gerenciado pelo adapter SvelteKit |

> ⚠️ O **Root Directory `fiaq-app`** é obrigatório — o app não está na raiz do repo.

## 5. Variáveis de ambiente na Vercel

Configure em **Settings → Environment Variables**:

```env
OPENROUTER_API_KEY      = configurada apenas na Vercel, nunca versionada
CHAT_PROVIDER           = openrouter
EMBED_PROVIDER          = openrouter
OPENROUTER_CHAT_MODEL   = google/gemma-4-31b-it:free
OPENROUTER_CHAT_FALLBACK_MODELS = nvidia/nemotron-3-ultra-550b-a55b:free,nvidia/nemotron-3-super-120b-a12b:free
OPENROUTER_EMBED_MODEL  = nvidia/llama-nemotron-embed-vl-1b-v2:free
DATABASE_URL            = postgresql://...supabase...:6543/postgres?sslmode=require
FIRECRAWL_API_URL       = URL do serviço Firecrawl usado no complemento e no fallback web
FIRECRAWL_API_KEY       = opcional, se o serviço Firecrawl exigir Bearer token
FIRECRAWL_INCLUDE_DOMAINS = cic.unb.br,www.cic.unb.br,unb.br,www.unb.br,saa.unb.br,sigaa.unb.br
VITE_SUPABASE_URL = https://PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY = anon key pública do projeto Supabase
SUPABASE_URL = opcional no servidor; se ausente, usa VITE_SUPABASE_URL
SUPABASE_ANON_KEY = opcional no servidor; se ausente, usa VITE_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY = service_role key do projeto Supabase (somente server-side)
ADMIN_BOOTSTRAP_EMAILS = primeiro(s) admin(s), separados por vírgula, para acessar /admin antes dos convites
ADMIN_BASE_URL = opcional; URL canônica para redirect dos convites, se quiser fixar domínio
```

> O modelo de embedding **precisa ser o mesmo** usado para gerar o índice
> salvo em `rag_chunk.embedding`, senão as buscas ficam inconsistentes. O chat
> usa um modelo gratuito fixo para evitar a rotação aleatória do `openrouter/free`;
> o Nemotron Embed continua necessário para embeddings.
> A pesquisa Firecrawl é sob demanda: ela é chamada quando o aluno marca
> "Não me ajudou" e também como fallback automático quando uma pergunta de
> escopo UnB não tem contexto local forte o suficiente no RAG.

### Convites de administradores

O `/admin` usa Supabase Auth. Para o primeiro acesso, configure
`ADMIN_BOOTSTRAP_EMAILS` com o e-mail do administrador inicial e crie esse usuário
em **Authentication → Users** no dashboard do Supabase, ou envie um convite pelo
próprio dashboard. Depois que esse usuário entrar no `/admin`, ele pode convidar
outros administradores pela interface; o servidor usa `SUPABASE_SERVICE_ROLE_KEY`
para chamar o endpoint de convite do Supabase Auth e adiciona o e-mail na tabela
`admin_usuario`.
Por segurança, os convites não usam `Host`/`x-forwarded-host` da requisição para
montar redirect; em produção a URL vem de `ADMIN_BASE_URL`, `APP_URL` ou
`VERCEL_URL`.

O caminho manual no dashboard é:

1. Abra **Authentication → Users**.
2. Clique em **Add user**.
3. Use **Send invitation** para enviar o convite por e-mail.
4. Adicione ou mantenha o e-mail em `admin_usuario` para liberar o painel.

Ao aprovar uma resposta candidata no `/admin`, o app cria um documento
`admin-web-*` em `rag_documento` e um chunk correspondente em `rag_chunk`, usando
o mesmo modelo de embedding configurado em produção.

## 6. Validar antes de subir

Da raiz do repositório:

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm build
```

Depois do deploy, valide:

```bash
curl https://SEU-DOMINIO/api/health/db
curl https://SEU-DOMINIO/api/faq
```

Para validar a base RAG no Supabase:

```sql
SELECT origem, COUNT(*)
FROM rag_chunk
WHERE ativo = TRUE
GROUP BY origem;
```

E envie uma pergunta pelo chat para confirmar o fluxo completo:

1. OpenRouter responde.
2. O RAG retorna fontes vindas de `rag_chunk`.
3. A pergunta é gravada no Supabase.
4. `/api/perguntas/em-alta?dias=7&limite=5` mostra a pergunta.

## 7. Como a base RAG é regenerada

Após alterar FAQ, PDFs ou crawl:

```bash
pnpm build:faq      # se os markdowns fonte do FAQ mudaram
pnpm fetch:links    # se quiser atualizar o crawl institucional
DATABASE_URL="postgresql://postgres:..." OPENROUTER_API_KEY="..." pnpm seed:knowledge
```

O `rag-index.json` ainda pode ser regenerado com `pnpm index:rag`, mas ele é
fallback legado. O caminho principal do chatbot em produção consulta o banco via
pgvector.

Para atualizar o crawl institucional antes: `pnpm fetch:links` (re-busca as páginas).

## 8. Limitações do caminho gratuito

- O modelo gratuito `:free` do OpenRouter **loga todos os prompts/respostas** e é
  marcado como "não usar em produção". Adequado para **teste/demonstração**, não
  para dados sensíveis.
- A rota de chat faz streaming (SSE). `maxDuration` está em 60s na configuração
  do `@sveltejs/adapter-vercel` em `fiaq-app/svelte.config.js`; planos Hobby
  limitam a janela.
- O Supabase Free é suficiente para este uso inicial, mas o banco pode pausar ou
atingir limites de armazenamento/egress se o projeto crescer.
- Se o projeto deixar de ser acadêmico/pessoal, revise os termos dos planos
gratuitos antes de publicar como produção real.
