# Fontes UnB para o RAG

O caminho recomendado continua sendo DB-first: pesquisar fontes oficiais, transformar paginas confiaveis em documentos versionados, gerar chunks/embeddings e consultar tudo pelo Postgres/pgvector em producao.

## Fluxo atual

1. Pesquisar fontes com navegador, quando fizer sentido:

   ```bash
   cd fiaq-app
   pnpm research:unb:browser
   ```

   Esse passo usa `browser-use` e salva sugestoes em `data/sources/unb-official/browser-use-findings.json`. Ele e opcional porque depende de `browser-use`, Playwright e uma chave de LLM compativel.

2. Descobrir e pontuar fontes oficiais:

   ```bash
   pnpm discover:unb
   ```

   O script parte de `data/sources/unb-official/seeds.json`, aceita sugestoes do browser-use quando existirem, segue apenas dominios `*.unb.br` e grava o inventario em `data/sources/unb-official/discovered-sources.json`.

3. Materializar paginas para o RAG:

   ```bash
   pnpm fetch:unb
   ```

   Isso grava as melhores paginas em `data/crawl/*.md`, com frontmatter de origem, score e URL. Esses arquivos entram no mesmo seed do FAQ, PDFs e crawls ja existentes.

4. Atualizar o banco:

   ```bash
   pnpm seed:knowledge
   ```

   O seed recria documentos/chunks ativos no Supabase/Postgres usando o modelo de embedding configurado. O chat continua consultando `buscar_rag_chunks(...)` no banco.

## Por que nao pesquisar a web em toda pergunta?

Pesquisa em tempo real aumenta latencia, custo e risco de resposta com fontes ruidosas ou temporarias. Para o fIAq, a melhor divisao e:

- ingestao: pesquisa/crawler/browser-use encontram fontes;
- curadoria: filtros por dominio, score, conteudo minimo e manifestos versionados;
- recuperacao: Postgres/pgvector responde rapido e com fontes conhecidas;
- fallback futuro: pesquisa web apenas quando a confianca do RAG for baixa.

## Evolucao otimizada

O proximo salto tecnico e busca hibrida no banco:

- manter embeddings com `pgvector` para significado;
- adicionar indice full-text em portugues em `rag_chunk` para termos exatos como SIGAA, SEI, SAA, RU e nomes de servicos;
- combinar score vetorial + `ts_rank` + boosts por origem;
- usar checksum/freshness para recrawlear apenas paginas alteradas;
- agendar o crawl semanalmente ou sob demanda antes de deploy.

Assim o RAG fica mais forte para perguntas gerais sobre a UnB sem transformar o chat em um crawler ao vivo.
