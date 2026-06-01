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
- **Base pré-computada** — o índice de embeddings é gerado offline e empacotado no build,
  então o cold start em produção é instantâneo (sem re-embedar a base).
- **Responsivo e acessível** — interface adaptada para mobile.

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | [Nuxt 4](https://nuxt.com) (Vue 3 + Nitro) |
| UI | [Nuxt UI 4](https://ui.nuxt.com) + [Tailwind CSS 4](https://tailwindcss.com) |
| IA (chat + embeddings) | [OpenRouter](https://openrouter.ai) (ou [Ollama](https://ollama.ai) local) |
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
│   │   ├── plugins/          # bootstrap do índice RAG
│   │   ├── utils/            # embeddings, vectorStore, loaders, providers
│   │   └── assets/rag-index.json   # índice de embeddings pré-computado
│   ├── data/                 # fontes: faq/, pdfs/, crawl/, sources/
│   ├── scripts/              # build-faq, fetch-links, test-openrouter
│   └── .env.example
├── DEPLOY.md                 # guia de deploy na Vercel
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

Para validar a chave do OpenRouter (chat + embeddings): `node scripts/test-openrouter.mjs`.

### Regenerar a base de conhecimento

```bash
cd fiaq-app
pnpm build:faq                # gera data/faq/*.json a partir das fontes em data/sources/
pnpm fetch:links              # re-crawleia as páginas institucionais (data/crawl/)
RAG_FORCE_REINDEX=1 pnpm dev  # re-embeda e regrava server/assets/rag-index.json
```

> O índice precisa ser gerado com o **mesmo modelo de embedding** usado em produção,
> senão as buscas ficam inconsistentes (o app emite um warning no log se detectar divergência).

## Deploy

Veja [`DEPLOY.md`](./DEPLOY.md) — na Vercel, configure **Root Directory = `fiaq-app`** e
as variáveis de ambiente do OpenRouter.

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
