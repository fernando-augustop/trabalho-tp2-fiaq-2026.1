# User Stories & QA mobile do fIAq

> Resumo de validação para manter o fIAq viável, bonito e utilizável em
> celulares. A planilha canônica completa fica em
> [`docs/qa/feature-user-stories.csv`](./feature-user-stories.csv).

## Stack validada

- App: SvelteKit + Vite em `fiaq-app/`.
- UI: shadcn-svelte, Tailwind CSS 4 e Lucide/Saruê.
- Estado/consulta: TanStack Query no FAQ/home/admin e TanStack Table Core na
  curadoria.
- APIs: rotas server SvelteKit em `fiaq-app/src/routes/api/**/+server.ts`.
- RAG: Supabase/Postgres pgvector com fallback JSON em
  `fiaq-app/server/assets/rag-index.json`.

## Tokens de design

| Token | Valor canônico | Uso |
|---|---|---|
| Navy de marca | `#1a2e5a` | Nav, títulos e botões principais. |
| Navy hover | `#243d75` | Hover/foco de ações navy. |
| Verde de marca | `#00a155` | Ações primárias, bordas e acentos da marca. |
| Verde brilhante | `#00dc82` | Realces sobre navy. |
| Superfície | `#f4f4f4` | Fundo geral claro. |

## Histórias principais

| # | Área | Arquivos principais | Comportamento esperado |
|---|---|---|---|
| 1 | Navegação global | `src/routes/+layout.svelte`, `src/lib/components/AppNav.svelte`, `FiaqBrand.svelte` | Marca clicável, links legíveis, drawer de contatos e sem overflow em mobile. |
| 2 | Home | `src/routes/+page.svelte`, `/api/faq` | Pergunta inicial leva ao `/chatbot?q=...`, categorias carregam via API e grid é responsivo. |
| 3 | FAQ | `src/routes/faq/[slug]/+page.svelte`, `SourceChip.svelte` | Busca sem acento, acordeão confortável no toque e fontes oficiais em chips. |
| 4 | Chat | `src/routes/chatbot/+page.svelte`, `src/lib/stores/fiaq-chat.ts`, `src/lib/components/chat/*` | Composer fixo, streaming SSE, fontes, copiar/exportar/avaliar/importar/limpar e salto para última resposta. |
| 5 | Contatos | `src/routes/contatos/[slug]/+page.svelte`, `src/lib/data/departamentos.ts` | Endereço, mapa e cards de contato sem sobreposição em telas estreitas. |
| 6 | Admin | `src/routes/admin/+page.svelte`, `src/routes/api/admin/**/+server.ts` | Login, convite, curadoria e status realtime com estados de erro claros. |
| 7 | Plataforma | `svelte.config.js`, `vite.config.ts`, `components.json`, `vercel.json` | Sem dependências legadas de framework antigo, build SvelteKit e deploy Vercel. |

## Validação mínima

```bash
pnpm lint
pnpm typecheck
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

Fluxos E2E a repetir quando houver mudança visual ou de API:

- `/`, `/chatbot`, `/faq/matricula`, `/contatos/cic`, `/sobre` e `/admin` em
  viewports de 360px, 390px e desktop.
- Envio real no chat: eventos SSE `status`, `activity`, `sources`, `token` e
  `done`, sem bolha vazia ao final.
- Feedback positivo/negativo, complemento web, exportação e importação de JSON.
- Admin sem autenticação deve retornar `401 AUTH_REQUIRED` em endpoints
  protegidos; UI autenticada pode ser validada com mocks quando não houver
  credenciais locais.
