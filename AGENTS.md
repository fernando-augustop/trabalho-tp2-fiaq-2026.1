# AGENTS.md - guia para desenvolvimento agentico do fIAq

Este arquivo orienta agentes que forem trabalhar neste repositorio. Ele resume a
arquitetura, os comandos seguros, os fluxos ja implementados e os cuidados que
evitam quebrar Vercel, Supabase, RAG, autenticacao administrativa ou a UX do
chat.

## Estado atual

- Aplicacao em producao: <https://fiaq-app.vercel.app>
- Branch de producao: `main`
- App SvelteKit/Vite fica em `fiaq-app/`, nao na raiz.
- Vercel esta configurado com `Root Directory = fiaq-app`.
- Previews da Vercel estao bloqueados em `fiaq-app/vercel.json`; apenas `main`
  gera deployment.
- Banco principal em producao: Supabase Postgres com `pgvector`.
- RAG em runtime e DB-first: consulta Supabase/pgvector antes do fallback JSON.
- Admin em producao: `/admin`, com Supabase Auth e lista `admin_usuario`.

## Stack

- Framework: SvelteKit, Vite e Svelte 5.
- UI: shadcn-svelte, Tailwind CSS 4, Lucide.
- Estado/tabelas de UI: TanStack Query e TanStack Table Core.
- APIs: rotas server do SvelteKit em `src/routes/api/**/+server.ts`.
- IA: OpenRouter em producao; Ollama pode ser usado localmente.
- Embeddings: OpenRouter em producao, mesmo modelo usado no seed do RAG.
- Banco: PostgreSQL/Supabase com `pgvector`.
- Deploy: Vercel.
- Package manager: `pnpm`.
- Linguagem: TypeScript.

## Estrutura importante

```text
.
├── AGENTS.md
├── README.md
├── package.json                 # scripts raiz chamam pnpm --dir fiaq-app
├── docs/
│   ├── DEPLOY.md
│   ├── DESENVOLVIMENTO.md
│   ├── DECISOES.md
│   └── RAG-FONTES-UNB.md
├── db/
│   ├── 01_faq_tabelas.sql
│   ├── 02_perguntas_tabelas.sql
│   ├── 03_supabase_app_role.sql
│   ├── 04_rag_pgvector.sql
│   ├── 05_supabase_rag_search_hardening.sql
│   ├── 06_avaliacao_resposta.sql
│   └── 07_admin_rag_review.sql
└── fiaq-app/
    ├── src/                     # rotas SvelteKit, UI, stores e APIs
    │   ├── routes/              # páginas e /api/* via +server.ts
    │   └── lib/                 # componentes shadcn-svelte, chat e utils
    ├── server/                  # repositorios RAG/FAQ, DB, providers e assets
    ├── data/                    # FAQ, PDFs, crawls e fontes
    ├── scripts/                 # seeds, crawlers, build de FAQ/RAG
    ├── public/                  # favicon e imagens do Sarue
    ├── vite.config.ts
    ├── vercel.json
    └── .env.example
```

## Antes de editar

1. Rode `git status --short --branch`.
2. Leia `README.md` e este arquivo.
3. Para tarefas de deploy, leia `docs/DEPLOY.md`.
4. Para tarefas locais, leia `docs/DESENVOLVIMENTO.md`.
5. Para banco/RAG, leia `db/README.md`, `db/SETUP.md` e os SQLs em `db/`.
6. Preserve mudancas do usuario. Nao reverta arquivos sem pedido explicito.
7. Nao commite secrets, dumps de banco, screenshots com e-mail/senha, `.env` ou
   artefatos temporarios de E2E.

## Comandos padrao

Rode da raiz do repositorio:

```bash
pnpm install
pnpm dev
pnpm lint
pnpm typecheck
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
pnpm preview
```

Comandos de conhecimento:

```bash
pnpm build:faq
pnpm fetch:links
pnpm seed:knowledge
pnpm index:rag
pnpm test:openrouter
```

Quando precisar rodar diretamente no app:

```bash
pnpm --dir fiaq-app <script>
```

## Validacao minima antes de commit

Para mudancas de UI, composables, server APIs, auth, RAG ou exportacao:

```bash
pnpm lint
pnpm typecheck
NODE_OPTIONS=--max-old-space-size=4096 pnpm build
```

Depois do deploy em `main`, valide producao:

```bash
curl https://fiaq-app.vercel.app/api/health/db
curl -sS -o /tmp/fiaq-faq.json \
  -w '%{http_code} %{content_type} %{size_download}\n' \
  https://fiaq-app.vercel.app/api/faq
```

Resposta esperada do healthcheck:

```json
{"ok":true,"configured":true}
```

## Variaveis de ambiente

Modelo em `fiaq-app/.env.example`. Nunca versionar valores reais.

Principais variaveis:

- `DATABASE_URL`: runtime deve preferir Supabase Transaction Pooler, porta
  `6543`, `sslmode=require`, role limitada `fiaq_app`.
- `CHAT_PROVIDER`: `openrouter` em producao; `ollama` local e possivel.
- `EMBED_PROVIDER`: `openrouter` em producao; precisa combinar com o seed.
- `OPENROUTER_API_KEY`: secret.
- `OPENROUTER_CHAT_MODEL`: modelo fixo gratuito usado no chat.
- `OPENROUTER_CHAT_FALLBACK_MODELS`: fallbacks separados por virgula.
- `OPENROUTER_STREAM_PREFLIGHT_CHARS`: minimo de chars antes do streaming.
- `OPENROUTER_EMBED_MODEL`: modelo de embedding usado tambem no seed.
- `FIRECRAWL_API_URL`: endpoint/proxy Firecrawl para busca web.
- `FIRECRAWL_API_KEY`: secret opcional.
- `FIRECRAWL_INCLUDE_DOMAINS`: dominios oficiais permitidos.
- `VITE_SUPABASE_URL`: URL publica do Supabase para o cliente.
- `VITE_SUPABASE_ANON_KEY`: anon key publica do Supabase para o cliente.
- `SUPABASE_URL`: URL do Supabase para validacao server-side, opcional se `VITE_SUPABASE_URL` estiver definida.
- `SUPABASE_ANON_KEY`: anon key server-side, opcional se `VITE_SUPABASE_ANON_KEY` estiver definida.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only; usada para convites/admin.
- `ADMIN_BOOTSTRAP_EMAILS`: e-mails iniciais de administradores.
- `ADMIN_BASE_URL`: URL canonica para redirects de convite.

## Banco de dados

SQLs devem ser aplicados nesta ordem:

```text
db/01_faq_tabelas.sql
db/02_perguntas_tabelas.sql
db/04_rag_pgvector.sql
db/05_supabase_rag_search_hardening.sql
db/06_avaliacao_resposta.sql
db/03_supabase_app_role.sql
db/07_admin_rag_review.sql
```

Tabelas principais:

- `faq_categoria`, `faq_entrada`: FAQ navegavel.
- `rag_documento`, `rag_chunk`: conhecimento RAG com embeddings.
- `pergunta_registrada`, `ocorrencia_pergunta`: metricas anonimas agregadas.
- `avaliacao_resposta`: feedback anonimo de respostas.
- `admin_usuario`: allowlist administrativa.
- `web_resposta_candidata`: respostas web aguardando curadoria.

Funcao principal:

- `buscar_rag_chunks(...)`: busca vetorial em `rag_chunk`.

Role de runtime:

- `fiaq_app`: limitada por RLS. Deve ler FAQ/RAG, gravar metricas/feedback e
  operar o fluxo admin conforme politicas. Seeds e migracoes normalmente usam
  uma connection string administrativa, nunca a role limitada.

## Fluxo do chatbot

Endpoint principal:

- `POST /api/chat`

Fluxo:

1. Recebe historico de mensagens.
2. Busca contexto no Supabase/RAG por texto/vetor.
3. Se nao houver contexto local forte para pergunta de escopo UnB, usa
   Firecrawl em dominios oficiais.
4. Chama OpenRouter e responde via SSE.
5. Envia fontes separadas do corpo da resposta.
6. Registra pergunta anonima no Supabase depois da resposta.

Endpoint de complemento web:

- `POST /api/chat/web`

Usado quando o usuario marca uma resposta como negativa. Ele pesquisa fontes
oficiais e retorna uma resposta complementar com selo de pesquisa web.

Feedback:

- `POST /api/chat/feedback`

Regras atuais:

- Feedback positivo em resposta RAG: registra feedback e agradece.
- Feedback negativo: aciona pesquisa web complementar.
- Feedback positivo em resposta com fonte web: cria entrada em
  `web_resposta_candidata` para curadoria administrativa.

## Fluxo de curadoria administrativa

Pagina:

- `/admin`

Autenticacao:

- Supabase Auth no frontend.
- `admin_usuario` e `ADMIN_BOOTSTRAP_EMAILS` validam acesso server-side.

APIs:

- `GET /api/admin/me`: valida sessao e permissao admin.
- `GET /api/admin/candidates`: lista pendentes/aprovadas/rejeitadas.
- `PATCH /api/admin/candidates/:id`: aprova ou rejeita candidata.
- `POST /api/admin/invites`: envia convite Supabase Auth e registra admin.

Ao aprovar uma candidata:

1. O app gera embedding da pergunta/resposta.
2. Cria documento `admin-web-*` em `rag_documento`.
3. Cria chunk em `rag_chunk`.
4. Marca a candidata como aprovada.
5. A resposta passa a participar do RAG.

Ao rejeitar:

1. Marca a candidata como rejeitada.
2. Nao escreve no RAG permanente.

Convites:

- Preferir convidar pelo `/admin` depois do bootstrap inicial.
- O servidor usa `SUPABASE_SERVICE_ROLE_KEY`.
- Redirect deve usar `ADMIN_BASE_URL`, `APP_URL` ou `VERCEL_URL`; nao confiar em
  `Host` ou `x-forwarded-host` de request.

## UX implementada

Principais pontos ja aplicados:

- Home com input branco e botao verde alinhado a marca fIAq.
- Bordas do botao/pergunta ajustadas para verde.
- Favicon e icons substituidos pelo Sarue, nao robo generico.
- Avatar do assistente usa imagens do Sarue em `fiaq-app/public/`.
- Fonte geral e input de pergunta aumentados para melhor leitura.
- Chat com streaming mais suave e sem forcar a pagina a cada token quando o
  usuario nao esta no fim.
- Botao "Ultima resposta" para voltar ao final.
- Limpeza de conversa mostra feedback temporario ao lado do botao de lixo.
- Respostas exibem fontes como cards/chips, nao URLs soltas no corpo.
- Marcadores de citacao numerica como `[1]` sao removidos do texto renderizado.
- Exportacao baixa apenas a pergunta/resposta selecionada, com fontes.
- PDF de exportacao foi redesenhado em estilo mais limpo.
- `/admin` tem login centralizado, sem card lateral, com botao de olho para
  revelar senha.
- Chat nao deve finalizar com bolha vazia: existe fallback defensivo no cliente.

## Arquivos de UI que costumam ser tocados

- `fiaq-app/src/routes/+page.svelte`: home e pergunta inicial.
- `fiaq-app/src/routes/chatbot/+page.svelte`: tela do assistente.
- `fiaq-app/src/routes/admin/+page.svelte`: login/admin/curadoria.
- `fiaq-app/src/lib/components/AppNav.svelte`: navegacao.
- `fiaq-app/src/lib/components/chat/ChatComposer.svelte`: input de chat.
- `fiaq-app/src/lib/components/chat/ChatWindow.svelte`: scroll/stream/jump bottom.
- `fiaq-app/src/lib/components/chat/MessageBubble.svelte`: resposta, fontes, botoes.
- `fiaq-app/src/lib/components/chat/ConversationActions.svelte`: importar/limpar.
- `fiaq-app/src/lib/utils/assistantText.ts`: limpeza de links/citacoes.
- `fiaq-app/src/lib/utils/conversationExport.ts`: PDF, Excel, Markdown, JSON, TXT.
- `fiaq-app/src/lib/utils/supabaseAuth.ts`: cliente Supabase Auth.

## Arquivos de backend que costumam ser tocados

- `fiaq-app/src/routes/api/chat/+server.ts`: chat RAG + fallback automatico web.
- `fiaq-app/src/routes/api/chat/web/+server.ts`: complemento por feedback negativo.
- `fiaq-app/src/routes/api/chat/feedback/+server.ts`: feedback e candidatas.
- `fiaq-app/src/routes/api/admin/**/*.ts`: admin e convites.
- `fiaq-app/server/repositorios/rag.ts`: busca e repositorio RAG.
- `fiaq-app/server/repositorios/candidatos.ts`: fila de curadoria.
- `fiaq-app/server/repositorios/pergunta.ts`: metricas anonimas.
- `fiaq-app/server/utils/llmProvider.ts`: providers de chat/streaming.
- `fiaq-app/server/utils/embeddings.ts`: provider de embeddings.
- `fiaq-app/server/utils/firecrawl.ts`: busca web oficial.
- `fiaq-app/server/db/index.ts`: conexao Postgres.

## Fontes e ingestao de conhecimento

Diretorios relevantes:

- `fiaq-app/data/sources/`: fontes editaveis.
- `fiaq-app/data/faq/`: JSON gerado do FAQ.
- `fiaq-app/data/pdfs/`: PDFs usados no seed.
- `fiaq-app/data/crawl/`: paginas crawleadas em Markdown.
- `fiaq-app/server/assets/rag-index.json`: fallback legado.

Scripts:

- `scripts/build-faq.mjs`: gera FAQ a partir das fontes.
- `scripts/fetch-links.mjs`: recrawleia links institucionais.
- `scripts/discover-unb-sources.mjs`: descobre/pontua fontes oficiais.
- `scripts/seed-knowledge.mjs`: popula FAQ + RAG no banco.
- `scripts/build-rag-index.mjs`: regenera fallback JSON.
- `scripts/test-openrouter.mjs`: valida OpenRouter isolado.

Regra critica:

- O modelo de embedding do seed deve ser igual ao modelo de embedding do
  runtime. Se mudar modelo, reindexe todo o RAG.

## Deploy Vercel

Arquivo: `fiaq-app/vercel.json`

Configuracao atual:

```json
{
  "framework": "sveltekit",
  "installCommand": "pnpm install",
  "buildCommand": "pnpm build",
  "git": {
    "deploymentEnabled": {
      "main": true,
      "codex/*": false,
      "*": false
    }
  }
}
```

Implicacoes:

- Push em `main` gera production deploy.
- Branches `codex/*` e demais branches nao geram preview.
- Antes de dizer que esta pronto, conferir Vercel `READY` para o commit correto.
- Para investigar deploy, use Vercel MCP quando disponivel.

## E2E e evidencias

Nao ha suite Playwright versionada no repo. Quando for necessario validar fluxo
real:

1. Use um runner temporario fora do app ou uma pasta de artefatos nao commitada.
2. Salve evidencias em `qa-artifacts/<data>-<slug>/`.
3. Sanitize e-mails, senhas, cookies, tokens e chaves antes de screenshot/log.
4. Nao commite `qa-artifacts/` salvo se o usuario pedir explicitamente.
5. Depois de validar, mova ou remova artefatos para deixar o repo limpo.

Fluxos E2E relevantes:

- `/admin` deslogado: login centralizado, senha ocultavel/revelavel.
- `/admin` logado: tabs de pendentes/aprovadas/rejeitadas, convite admin.
- `/chatbot`: pergunta, streaming, resposta com fontes e feedback.
- Feedback negativo: gera complemento web.
- Feedback positivo em resposta web: cria candidata pendente.
- `/admin`: candidata aparece em pendentes e pode ser aprovada/rejeitada.

## Seguranca e privacidade

- Nunca exibir nem commitar `DATABASE_URL`, `OPENROUTER_API_KEY`,
  `SUPABASE_SERVICE_ROLE_KEY`, senha de admin, JWTs, cookies ou links de callback
  sensiveis.
- O app publico nao tem login de aluno nem historico persistente por usuario.
- O registro de perguntas e anonimo/agregado.
- A area `/admin` e a unica area autenticada.
- Em screenshots, substitua e-mails reais por valores sanitizados.
- Em logs finais, reporte status, nao segredos.

## Cuidados de implementacao

- Use padroes existentes do repo antes de criar nova abstracao.
- Evite mexer em SQL/RLS sem validar no Supabase ou pelo menos revisar as
  politicas relacionadas.
- Nao altere o modelo de embedding sem planejar re-seed.
- Nao reabilite previews da Vercel sem pedido explicito.
- Nao coloque links soltos no corpo da resposta do assistente; fontes aparecem
  nos chips/cards abaixo.
- Nao deixe o assistente responder "nao sei" para escopo UnB. Se o RAG local
  nao tiver contexto suficiente, pesquisar com Firecrawl em fontes oficiais.
- Nao use `openrouter/free` como embedding; ele e roteador de chat/texto.
- Para UI, manter elementos compactos e legiveis; evitar cards dentro de cards.
- Para chat, preservar o comportamento de scroll suave e respeitar quando o
  usuario saiu do final da conversa.

## Historico recente implementado

Resumo das entregas recentes que explicam o estado atual:

- Integracao da branch de frontend com melhorias visuais e correcoes de issues.
- Configuracao de deploy Vercel com Supabase e OpenRouter.
- Bloqueio de previews da Vercel para reduzir gasto.
- FAQ e RAG migrados para Supabase/Postgres com `pgvector`.
- Pesquisa web via Firecrawl para contexto UnB insuficiente e feedback negativo.
- Area administrativa `/admin` com Supabase Auth, convites e allowlist.
- Fluxo de curadoria: respostas web positivas viram candidatas; admin aprova ou
  rejeita; aprovadas entram no RAG.
- Favicon/icons trocados para Sarue.
- Novas fontes/documentos foram incorporados ao RAG no Supabase.
- UI do chat refinada: input maior, resposta melhor formatada, fontes em cards,
  exportacao da pergunta/resposta selecionada e PDF mais limpo.
- Remocao de citacoes numericas no corpo renderizado.
- Ajuste de streaming para resposta mais fluida e sem forcar scroll sempre.
- Protecoes contra resposta streamada vazia.
- Login admin polido: centralizado, sem quadro informativo lateral e com olho de
  senha.

## Checklist para finalizar uma tarefa

1. `git status --short --branch`
2. Implementar mudanca com escopo pequeno.
3. Rodar validacoes proporcionais:
   - `pnpm lint`
   - `pnpm typecheck`
   - `NODE_OPTIONS=--max-old-space-size=4096 pnpm build`
4. Se afetar producao, fazer commit e push em `main` apenas quando pedido.
5. Conferir Vercel `READY` para o commit certo.
6. Se afetar banco/RAG/admin/chat, validar endpoint ou fluxo navegavel.
7. Remover/mover artefatos temporarios e deixar o repo limpo.
8. Responder com o que mudou, comandos rodados, deploy/status e pendencias.
