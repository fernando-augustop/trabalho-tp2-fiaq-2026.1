# fIAq: Assistente do CIC/UnB

Portal de **perguntas frequentes** e **assistente virtual com IA** do Departamento de
Ciência da Computação da Universidade de Brasília. As informações do CIC/UnB estão
espalhadas por sites, PDFs e setores — o fIAq centraliza tudo numa interface acessível,
com um FAQ navegável por tema e um chatbot que responde em linguagem natural usando
**RAG** (Retrieval-Augmented Generation) sobre o conteúdo institucional oficial.

Trabalho da disciplina de **Técnicas de Programação 2** — UnB, 2026.1.

## Funcionalidades

- **FAQ por categoria** — perguntas organizadas por tema (matrícula, estrutura curricular,
  atividades de curso, trajetória acadêmica, organizações estudantis, coordenação).
- **Assistente Virtual (RAG)** — responde dúvidas com base na base oficial; cita as
  fontes e não inventa links (URLs são removidas do texto e exibidas como chips de fonte).
- **Conhecimento no banco** — FAQ, páginas crawleadas e PDFs são indexados em
  PostgreSQL/Supabase com `pgvector`; o JSON pré-computado fica apenas como fallback
  de compatibilidade.
- **Responsivo e acessível** — interface adaptada para mobile.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [SvelteKit](https://svelte.dev/docs/kit) + [Vite](https://vite.dev) |
| UI | [shadcn-svelte](https://www.shadcn-svelte.com) + [Tailwind CSS 4](https://tailwindcss.com) + Lucide |
| IA (chat + embeddings) | [OpenRouter](https://openrouter.ai) (ou [Ollama](https://ollama.ai) local) |
| Banco / RAG | PostgreSQL + pgvector (Supabase no deploy) |
| Linguagem | TypeScript |
| Gerenciador | pnpm |
| APIs | Rotas server do SvelteKit em `/api/*` |
| Deploy | Vercel com adapter SvelteKit |

> O provider de IA é configurável via `.env` (`CHAT_PROVIDER` / `EMBED_PROVIDER`):
> `openrouter` (nuvem) ou `ollama` (local). Veja `fiaq-app/.env.example`.

## Estrutura do repositório

O aplicativo fica em **`fiaq-app/`** (não na raiz):

```
trabalhofinal-fiaq/
├── fiaq-app/                 # app SvelteKit/Vite
│   ├── src/                  # rotas, layouts, componentes e stores Svelte
│   │   ├── routes/           # páginas e APIs SvelteKit, incluindo /api/*
│   │   └── lib/              # shadcn-svelte, chat, auth, TanStack e utilitários
│   ├── server/               # repositórios RAG/FAQ, DB, providers e fallback JSON
│   ├── data/                 # fontes: faq/, pdfs/, crawl/, sources/
│   ├── scripts/              # build-faq, fetch-links, test-openrouter
│   ├── svelte.config.js
│   ├── vite.config.ts
│   └── .env.example
├── docs/                     # decisões, desenvolvimento, deploy e relatório executivo
│   ├── DESENVOLVIMENTO.md
│   ├── DEPLOY.md
│   └── relatorio-executivo-arquitetura-deploy.md
└── README.md
```

## Como desenvolver localmente

> Requisitos: Node.js ≥ 20 e [pnpm](https://pnpm.io). O app está em `fiaq-app/`.

```bash
pnpm install
pnpm dev
```

O comando acima roda o app SvelteKit/Vite e as APIs server usando as variáveis de
`fiaq-app/.env`. Com `DATABASE_URL` do Supabase e providers OpenRouter
preenchidos, ele reproduz localmente a suite principal do deploy Vercel:
FAQ/RAG no Supabase, chat por OpenRouter e registro anônimo de perguntas.

O servidor local imprime a URL, normalmente `http://127.0.0.1:3000/`.

Guia completo: [`docs/DESENVOLVIMENTO.md`](./docs/DESENVOLVIMENTO.md).
Para validar a chave do OpenRouter isoladamente: `pnpm test:openrouter`.

### Regenerar a base de conhecimento

```bash
pnpm build:faq                # gera data/faq/*.json a partir das fontes em data/sources/
pnpm fetch:links              # re-crawleia as páginas institucionais (data/crawl/)
DATABASE_URL="postgresql://..." pnpm seed:knowledge # popula FAQ + RAG pgvector
pnpm index:rag                # opcional: regrava fallback server/assets/rag-index.json
```

> O seed de conhecimento precisa usar o **mesmo modelo de embedding** configurado
> no runtime. O deploy atual usa `nvidia/llama-nemotron-embed-vl-1b-v2:free`
> para embeddings e `google/gemma-4-31b-it:free` para o chat, com
> `nvidia/nemotron-3-ultra-550b-a55b:free` e
> `nvidia/nemotron-3-super-120b-a12b:free` como fallbacks. Não use
> `openrouter/free` como embedding: ele é roteador aleatório de chat/texto.

## Banco de Dados

O app usa **PostgreSQL** para servir o FAQ navegável, armazenar os chunks RAG com
`pgvector` e registrar, de forma anônima e agregada, as perguntas feitas ao chatbot
— sem cadastro, sem login, sem dados pessoais. A consulta do chat é DB-first:
gera embedding da pergunta, busca em `rag_chunk` via `buscar_rag_chunks(...)` e
só usa o `rag-index.json` se o banco/pgvector não estiver disponível.

Para o fluxo mais parecido com produção, use Supabase via `DATABASE_URL`,
conforme [`docs/DESENVOLVIMENTO.md`](./docs/DESENVOLVIMENTO.md). Para desenvolver
sem Supabase remoto, siga [`db/SETUP.md`](./db/SETUP.md) e suba o Postgres local
com Docker.

## Deploy

Veja [`docs/DEPLOY.md`](./docs/DEPLOY.md) — na Vercel, configure
**Root Directory = `fiaq-app`** e as variáveis de ambiente do OpenRouter e do
Supabase.

## Equipe

Projeto desenvolvido por alunos da disciplina de Técnicas de Programação 2 — UnB 2026.1.

| Aluno | GitHub |
|---|---|
| Fernando Augusto | [@fernando-augustop](https://github.com/fernando-augustop) |
| Gustavo Nascimento | [@PavanelliGustavo](https://github.com/PavanelliGustavo) |
| Eduardo Rocha | [@eduardofgc](https://github.com/eduardofgc) |
| Samara Gomes | [@samaragomess](https://github.com/samaragomess) |
| Augusto Faller | [@tosgual](https://github.com/tosgual) |
| Lucas Centurion Netto | [@LucasCenturionNetto](https://github.com/LucasCenturionNetto) |

## Licença

Uso acadêmico, desenvolvido para a Universidade de Brasília.
