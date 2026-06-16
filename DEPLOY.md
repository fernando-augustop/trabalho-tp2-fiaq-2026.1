# Deploy gratuito do fIAq

O caminho gratuito recomendado para demonstração acadêmica é:

| Camada | Serviço | Motivo |
|---|---|---|
| App Nuxt/Nitro | Vercel Hobby | Deploy simples via GitHub, HTTPS automático e suporte a Functions/SSE |
| Postgres | Supabase Free | Banco gerenciado suficiente para métricas anônimas de perguntas |
| IA | OpenRouter | Já é o provider usado pelo RAG; o modelo `:free` serve para demonstração |

O fIAq é um app **Nuxt 4** (em `fiaq-app/`) com RAG via **OpenRouter**. O índice
da base é **pré-computado** e empacotado no build, então o cold start não precisa
re-embedar a base.

## 1. Criar o banco no Supabase

1. Crie um projeto no Supabase.
2. Abra o SQL Editor.
3. Execute os arquivos abaixo, nesta ordem:

```sql
-- primeiro: db/01_faq_tabelas.sql
-- depois:   db/02_perguntas_tabelas.sql
```

Os SQLs usam `IF NOT EXISTS`, então podem ser reaplicados durante setup sem
falhar por tabela ou índice já existente.

## 2. Pegar a connection string do Supabase

Para Vercel/serverless, prefira a **Transaction Pooler URI** do Supabase. Ela
normalmente usa porta `6543`. Garanta SSL:

```env
DATABASE_URL=postgresql://postgres.PROJECT_REF:SENHA@REGIAO.pooler.supabase.com:6543/postgres?sslmode=require
```

O app usa `postgres.js` com `prepare: false`, que é necessário para operar bem
através de poolers que não suportam prepared statements.

## 3. Configurar o projeto na Vercel

Ao importar o repositório na Vercel:

| Campo | Valor |
|---|---|
| **Root Directory** | `fiaq-app` |
| **Framework Preset** | Nuxt (detectado automaticamente) |
| **Build Command** | `pnpm build` (padrão) |
| **Install Command** | `pnpm install` (padrão) |
| **Output** | automático (preset `vercel` do Nitro) |

> ⚠️ O **Root Directory `fiaq-app`** é obrigatório — o app não está na raiz do repo.

## 4. Variáveis de ambiente na Vercel

Configure em **Settings → Environment Variables**:

```env
OPENROUTER_API_KEY      = sk-or-v1-...            (sua key — NÃO commitar)
CHAT_PROVIDER           = openrouter
EMBED_PROVIDER          = openrouter
OPENROUTER_CHAT_MODEL   = openrouter/owl-alpha
OPENROUTER_EMBED_MODEL  = nvidia/llama-nemotron-embed-vl-1b-v2:free
DATABASE_URL            = postgresql://...supabase...:6543/postgres?sslmode=require
```

> O modelo de embedding **precisa ser o mesmo** usado para gerar o índice
> pré-computado (`fiaq-app/server/assets/rag-index.json`), senão as buscas ficam
> inconsistentes. O app emite um warning no log se detectar divergência.

## 5. Validar antes de subir

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

E envie uma pergunta pelo chat para confirmar o fluxo completo:

1. OpenRouter responde.
2. O RAG retorna fontes.
3. A pergunta é gravada no Supabase.
4. `/api/perguntas/em-alta?dias=7&limite=5` mostra a pergunta.

## 6. Como o índice é gerado / regenerado

O índice vive em `fiaq-app/server/assets/rag-index.json` (commitado) e é
carregado no boot. Para **regenerá-lo** após alterar `data/` (FAQ, PDFs, crawl):

```bash
cd fiaq-app
RAG_FORCE_REINDEX=1 pnpm dev      # indexa ao vivo via OpenRouter e regrava o JSON
# aguarde "[RAG] Índice gravado ..." e então Ctrl+C
git add server/assets/rag-index.json && git commit -m "chore: regenerar índice RAG"
```

Para atualizar o crawl institucional antes: `pnpm fetch:links` (re-busca as páginas).

## 7. Limitações do caminho gratuito

- O modelo gratuito `:free` do OpenRouter **loga todos os prompts/respostas** e é
  marcado como "não usar em produção". Adequado para **teste/demonstração**, não
  para dados sensíveis.
- A rota de chat faz streaming (SSE). `maxDuration` está em 60s
  (`nuxt.config.ts` → `nitro.vercel.functions`); planos Hobby limitam a janela.
- O Supabase Free é suficiente para este uso inicial, mas o banco pode pausar ou
atingir limites de armazenamento/egress se o projeto crescer.
- Se o projeto deixar de ser acadêmico/pessoal, revise os termos dos planos
gratuitos antes de publicar como produção real.
