# fIAq — Assistente do CIC/UnB

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
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3 + Nitro) |
| UI | [Nuxt UI 4](https://ui.nuxt.com) + [Tailwind CSS 4](https://tailwindcss.com) |
| IA (chat + embeddings) | [OpenRouter](https://openrouter.ai) (ou [Ollama](https://ollama.ai) local) |
| Banco / RAG | PostgreSQL + pgvector (Supabase no deploy) |
| Linguagem | TypeScript |
| Gerenciador | pnpm |
| Deploy | Vercel (preset Nitro `vercel`) |

> O provider de IA é configurável via `.env` (`CHAT_PROVIDER` / `EMBED_PROVIDER`):
> `openrouter` (nuvem) ou `ollama` (local). Veja `fiaq-app/.env.example`.

## Estrutura do repositório

O aplicativo fica em **`fiaq-app/`** (não na raiz):

```
trabalhofinal-fiaq/
├── fiaq-app/                 # o app Nuxt
│   ├── app/                  # frontend (pages, components, composables)
│   ├── server/               # API (/api/chat, /api/faq), RAG e utils
│   │   ├── api/
│   │   ├── repositorios/     # acesso a FAQ, RAG pgvector e métricas
│   │   ├── plugins/          # carrega fallback JSON de compatibilidade
│   │   ├── utils/            # embeddings, loaders e providers
│   │   └── assets/rag-index.json   # fallback legado do RAG
│   ├── data/                 # fontes: faq/, pdfs/, crawl/, sources/
│   ├── scripts/              # build-faq, fetch-links, test-openrouter
│   └── .env.example
├── docs/                     # decisões, deploy e relatório executivo
│   ├── DEPLOY.md
│   └── relatorio-executivo-arquitetura-deploy.md
└── README.md
```

## Como rodar localmente

> Requisitos: Node.js ≥ 20 e [pnpm](https://pnpm.io). O app está em `fiaq-app/`.

```bash
cd fiaq-app
cp .env.example .env          # preencha OPENROUTER_API_KEY e use CHAT/EMBED_PROVIDER=openrouter
pnpm install
pnpm dev                      # http://localhost:3000
```

Também é possível rodar pela raiz do repositório:

```bash
pnpm install
pnpm dev                      # http://localhost:3000
```

Para validar a chave do OpenRouter (chat + embeddings): `pnpm test:openrouter`.

### Regenerar a base de conhecimento

```bash
pnpm build:faq                # gera data/faq/*.json a partir das fontes em data/sources/
pnpm fetch:links              # re-crawleia as páginas institucionais (data/crawl/)
DATABASE_URL="postgresql://..." pnpm seed:knowledge # popula FAQ + RAG pgvector
pnpm index:rag                # opcional: regrava fallback server/assets/rag-index.json
```

> O seed de conhecimento precisa usar o **mesmo modelo de embedding** configurado
> no runtime. O deploy atual usa `nvidia/llama-nemotron-embed-vl-1b-v2:free`
> para embeddings e `openrouter/owl-alpha` para o chat.

## Banco de Dados

O app usa **PostgreSQL** para servir o FAQ navegável, armazenar os chunks RAG com
`pgvector` e registrar, de forma anônima e agregada, as perguntas feitas ao chatbot
— sem cadastro, sem login, sem dados pessoais. A consulta do chat é DB-first:
gera embedding da pergunta, busca em `rag_chunk` via `buscar_rag_chunks(...)` e
só usa o `rag-index.json` se o banco/pgvector não estiver disponível.

Siga [`db/SETUP.md`](./db/SETUP.md) para subir o Postgres localmente e aplicar os
SQLs. O setup do banco é independente do setup do app acima.

## Deploy

Veja [`docs/DEPLOY.md`](./docs/DEPLOY.md) — na Vercel, configure
**Root Directory = `fiaq-app`** e as variáveis de ambiente do OpenRouter.

## Equipe

Projeto desenvolvido por alunos da disciplina de Técnicas de Programação 2 — UnB 2026.1.

| Aluno | GitHub |
|---|---|
| Fernando Augusto | [@fernando-augustop](https://github.com/fernando-augustop) |
| Gustavo Nascimento | [@PavanelliGustavo](https://github.com/PavanelliGustavo) |
| Eduardo Rocha | [@eduardofgc](https://github.com/eduardofgc) |
| Lucas Pereira | [@lucsap](https://github.com/lucsap) |
| Samara Gomes | [@samaragomess](https://github.com/samaragomess) |
| Augusto Faller | [@tosgual](https://github.com/tosgual) |
| Lucas Centurion Netto | [@LucasCenturionNetto](https://github.com/LucasCenturionNetto) |
| Ricardo Rian | [@RianRSM](https://github.com/RianRSM) |
| Érica Feitosa | [@ericafeitosa](https://github.com/ericafeitosa) |

## Licença

Uso acadêmico, desenvolvido para a Universidade de Brasília.
