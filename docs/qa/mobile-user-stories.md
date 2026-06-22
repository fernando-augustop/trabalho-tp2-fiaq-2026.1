# Planilha canônica — User Stories & QA mobile do fIAq

> Fonte única de verdade para o trabalho de "tornar o fIAq viável, bonito,
> consistente e utilizável em celulares". Inventário derivado do código atual
> (`fiaq-app/`). Status de teste obtido por revisão de código + build +
> validação responsiva (viewports mobile 360px e 390px).
>
> Legenda de status: ✅ aprovado · 🟡 ajustado · 🔴 quebrado · ⏳ pendente

## Tokens de design (referência de consistência)

| Token | Valor canônico | Observação |
|---|---|---|
| Navy de marca | `#1a2e5a` | Fundo de nav, heros, texto-título. Antes havia `#1a2744`, `#1f376b`. |
| Navy hover | `#243d75` | Hover de botões navy. |
| Verde de marca | `#00a155` | Ações primárias, acento do logo. Antes `green-400/700`, `#22c55e`. |
| Verde brilhante | `#00dc82` | Realces/anel sobre navy. |
| Superfície | `#f4f4f4` | Fundo de página. Contatos usava `#f0f2f7`. |

## Inventário de funcionalidades e user stories

| # | Funcionalidade | User story | Comportamento esperado | Telas/rotas | Status teste | Erro encontrado | Correção aplicada | Status final |
|---|---|---|---|---|---|---|---|---|
| 1 | Navegação global | Como visitante em celular, quero uma barra de navegação com a marca fIAq + Saruê e acesso a Início/Contatos/Sobre sem overflow | Nav fixa no topo; marca à esquerda com Saruê ao lado de "fIAq"; links à direita; sem rolagem horizontal em 360px | `AppNav.vue` (todas as rotas) | 🟡 | Sem Saruê ao lado da marca (requisito); logo `text-4xl` + 3 links arriscam overflow < 360px; acento do logo divergente entre telas | Novo `FiaqBrand` com Saruê em badge; nav responsiva (`px-4`, gaps menores, wordmark `text-2xl`→`sm:text-4xl`); acento unificado `#00a155` | ✅ |
| 2 | Sidebar de Departamentos | Como visitante, quero abrir "Contatos" e ver os departamentos para navegar aos contatos | Painel desliza da direita; trava scroll do body; foco preso; Esc/clique fora fecha; link leva a `/contatos/:slug` | `DepartmentsSidebar.vue` | ✅ | Painel `max-w-sm` ok no mobile; focus-trap presente | — | ✅ |
| 3 | Home — Hero + busca | Como visitante, quero digitar uma dúvida e ser levado ao assistente já com a pergunta | Submit navega para `/chatbot?q=...`; input legível (≥16px, sem zoom iOS); botão "Perguntar" toca confortável | `index.vue`, `/` | 🟡 | Botão com rótulo grande comprime input em telas estreitas | Botão vira ícone-only abaixo de `sm` mantendo área de toque; input `text-base` (≥16px) | ✅ |
| 4 | Home — Categorias FAQ | Como visitante, quero ver categorias de FAQ e abrir uma | Grid 1col mobile / 2 / 3; cada card leva a `/faq/:slug`; contagem por categoria | `index.vue`, `/api/faq` | ✅ | Grid responsivo já correto; toque do card ok | — | ✅ |
| 5 | FAQ por categoria | Como visitante, quero abrir uma categoria, buscar e expandir perguntas | Acordeão expande/contrai; busca filtra sem acento; chip de fonte; CTA para o assistente; estados vazios | `faq/[slug].vue` | ✅ | Layout mobile correto; input de busca legível | Ajuste fino de espaçamento/altura de toque | ✅ |
| 6 | Chatbot — envio & streaming | Como visitante, quero perguntar e ver a resposta sendo escrita em tempo real | Envia histórico; SSE com atividade de pesquisa; cursor de digitação; sem bolha vazia ao final | `chatbot.vue`, `ChatWindow`, `useFiaqChat` | 🟡 | Header com Saruê `h-18` consome espaço vertical no mobile; padding inferior grande | Header compacto e responsivo; Saruê com tamanho responsivo; espaçamentos ajustados | ✅ |
| 7 | Chatbot — sugestões (estado vazio) | Como visitante sem conversa, quero sugestões clicáveis | Chips de sugestão centralizados; clique envia a pergunta | `ChatWindow.vue` | ✅ | Chips com `flex-wrap` ok no mobile | Toque/espaçamento revisados | ✅ |
| 8 | Chatbot — fontes verificadas | Como visitante, quero ver as fontes citadas como chips, não URLs soltas | Lista "Fontes verificadas"; chip abre fonte oficial; trunca título/host | `MessageBubble`, `SourceChip` | ✅ | Chips truncam corretamente; alvo ≥40px | — | ✅ |
| 9 | Chatbot — ações da mensagem | Como visitante, quero copiar, baixar (PDF/Excel/MD/JSON/TXT) e avaliar a resposta | Botões com menus; export baixa pergunta+resposta; copiar com feedback visual | `MessageBubble.vue` | 🟡 | Rótulo "Copiar mensagem" longo causa wrap apertado; menus podem encostar na borda | Rótulo "Copiar"; menus com largura segura e alinhamento que respeita a viewport | ✅ |
| 10 | Chatbot — feedback | Como visitante, quero marcar útil/não útil e receber complemento web quando negativo | Positivo agradece (e cria candidata se web); negativo dispara `/api/chat/web` | `MessageBubble`, `useFiaqChat` | ✅ | Lógica preservada | Sem mudança funcional | ✅ |
| 11 | Chatbot — ações da conversa | Como visitante, quero ver contagem, importar JSON e limpar a conversa | Contador; importar pede confirmação; limpar pede confirmação; status temporário | `ConversationActions.vue` | ✅ | Barra com `flex-wrap` ok | Ajuste de espaçamento | ✅ |
| 12 | Chatbot — voltar ao fim | Como visitante que rolou para cima, quero um botão para voltar à última resposta | Botão "Última resposta" aparece fora do fim; rola suave | `ChatWindow.vue` | 🟡 | Botão `fixed bottom-40` pode colidir com o composer no mobile | Reposicionado acima do composer com folga | ✅ |
| 13 | Contatos do departamento | Como visitante, quero ver endereço, mapa e contatos do CIC | Header com badge; endereço; mapa embed; cards de contato com links | `contatos/[slug].vue` | 🔴 | Navy divergente (`#1a2744`), verde `#22c55e`, link `#185FA5`, bg `#f0f2f7`; "Voltar" `absolute` sobrepõe descrição em telas estreitas; tipografia inconsistente | Cores/tipografia alinhadas ao padrão; "Voltar" no fluxo (topo); bg padrão | ✅ |
| 14 | Sobre o projeto | Como visitante, quero entender objetivo, tecnologias e equipe | Header com marca; seções; grid de tech; lista de equipe com GitHub | `sobre.vue` | 🟡 | Acento do logo `green-400` divergente; sem Saruê no cabeçalho | Marca com Saruê e acento unificado | ✅ |
| 15 | Admin — login | Como admin, quero entrar com email/senha e revelar a senha | Form centralizado; olho mostra/oculta senha; avisos de config | `admin.vue` | ✅ | Form mobile ok; alvo de toque ok | Revisão de espaçamento | ✅ |
| 16 | Admin — curadoria | Como admin, quero revisar candidatas (pendentes/aprovadas/rejeitadas) e aprovar/rejeitar | Tabs com contagem; cards; observação; aprovar/rejeitar | `admin.vue`, `/api/admin/*` | ✅ | Layout empilha no mobile | Revisão de espaçamento/quebra | ✅ |
| 17 | Admin — convite | Como admin, quero convidar outro admin por email | Form envia convite; aviso de sucesso/erro | `admin.vue`, `/api/admin/invites` | ✅ | Form ok | — | ✅ |
| 18 | Admin — tempo real | Como admin, quero ver status de tempo real da fila | Badge de status; última sincronização; atualiza fila | `admin.vue`, `supabaseRealtime` | ✅ | Badge com `flex-wrap` no header | — | ✅ |
| 19 | Admin — definir senha (convite) | Como admin convidado, quero definir a senha ao abrir o link | Detecta sessão de convite no hash; form de nova senha; olho | `admin.vue` | ✅ | Form ok | — | ✅ |
| 20 | Identidade/PWA/SEO | Como visitante, quero favicon/ícones do Saruê e metadados corretos | Favicon/ícones Saruê; meta viewport; SEO por página | `app.vue`, `public/` | ✅ | Ícones já trocados para Saruê | Marca Saruê reforçada na nav | ✅ |

## Notas de validação

- `pnpm lint` → ✅ sem erros.
- `pnpm typecheck` → ✅ exit 0, sem erros.
- `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` → ✅ build complete (exit 0).
- Teste mobile via Chromium headless (Playwright) sobre o build de produção
  (`node .output/server/index.mjs`), viewports 360px e 390px:
  - Todas as rotas (`/`, `/sobre`, `/contatos/cic`, `/faq/matricula`,
    `/chatbot`, `/admin`) retornaram HTTP 200.
  - **Zero overflow horizontal** (`scrollWidth == clientWidth`) em 360px e 390px.
  - Revisão visual: nav com Saruê + marca sem quebra; home, FAQ (lista e
    acordeão aberto), contatos, chatbot (estado vazio + sugestões + composer),
    sobre, admin (login com olho de senha) e sidebar de departamentos — todos
    legíveis, alinhados e com alvos de toque confortáveis.
- O FAQ usa fallback JSON quando o banco não está configurado, então as telas
  renderizam sem Supabase/OpenRouter no ambiente de teste.
