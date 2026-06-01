# Deploy do fIAq na Vercel

O fIAq é um app **Nuxt 4** (em `fiaq-app/`) com um RAG que usa o **OpenRouter**
para chat e embeddings. O índice da base é **pré-computado** e empacotado no
build, então o cold start na Vercel é instantâneo (sem re-embedar a base).

## 1. Configuração do projeto na Vercel

Ao importar o repositório `unb-tp2-daniel/trabalhofinal-fiaq` na Vercel:

| Campo | Valor |
|---|---|
| **Root Directory** | `fiaq-app` |
| **Framework Preset** | Nuxt (detectado automaticamente) |
| **Build Command** | `pnpm build` (padrão) |
| **Install Command** | `pnpm install` (padrão) |
| **Output** | automático (preset `vercel` do Nitro) |

> ⚠️ O **Root Directory `fiaq-app`** é obrigatório — o app não está na raiz do repo.

## 2. Variáveis de ambiente (Vercel → Settings → Environment Variables)

```
OPENROUTER_API_KEY      = sk-or-v1-...            (sua key — NÃO commitar)
CHAT_PROVIDER           = openrouter
EMBED_PROVIDER          = openrouter
OPENROUTER_CHAT_MODEL   = openrouter/owl-alpha
OPENROUTER_EMBED_MODEL  = nvidia/llama-nemotron-embed-vl-1b-v2:free
```

> O modelo de embedding **precisa ser o mesmo** usado para gerar o índice
> pré-computado (`fiaq-app/server/assets/rag-index.json`), senão as buscas ficam
> inconsistentes. O app emite um warning no log se detectar divergência.

## 3. Como o índice é gerado / regenerado

O índice vive em `fiaq-app/server/assets/rag-index.json` (commitado) e é carregado
no boot. Para **regenerá-lo** após alterar `data/` (FAQ, PDFs, crawl):

```bash
cd fiaq-app
RAG_FORCE_REINDEX=1 pnpm dev      # indexa ao vivo via OpenRouter e regrava o JSON
# aguarde "[RAG] Índice gravado ..." e então Ctrl+C
git add server/assets/rag-index.json && git commit -m "chore: regenerar índice RAG"
```

Para atualizar o crawl institucional antes: `pnpm fetch:links` (re-busca as páginas).

## 4. Limitações conhecidas (deploy de teste)

- O modelo gratuito `:free` do OpenRouter **loga todos os prompts/respostas** e é
  marcado como "não usar em produção". Adequado para **teste/demonstração**, não
  para dados sensíveis.
- A rota de chat faz streaming (SSE). `maxDuration` está em 60s
  (`nuxt.config.ts` → `nitro.vercel.functions`); planos Hobby limitam a janela.
