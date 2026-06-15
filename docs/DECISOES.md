# Decisões de Escopo — fIAq

## Mudança de escopo: remoção de auth e adição de análise anônima

**Data:** 2026-06

### O que mudou

Por orientação do professor, as seguintes funcionalidades foram **removidas** do escopo:

- Cadastro e autenticação de usuários
- Histórico de conversas por usuário
- Tabelas `usuario`, `conversa` e `mensagem` (descartadas)

### Por quê

- Sem dados pessoais armazenados, evita burocracia de LGPD
- Foca o produto no que entrega valor direto ao aluno: FAQ + chatbot
- Reduz complexidade de deploy e manutenção para o prazo da disciplina

### O que entrou no lugar

Registro **anônimo e agregado** de perguntas feitas ao chatbot:

- `pergunta_registrada` — uma linha por "pergunta única", identificada por
  similaridade de embedding; mantém contador de frequência (`total_vezes`)
- `ocorrencia_pergunta` — uma linha por ocorrência individual, com a resposta
  gerada e as fontes RAG usadas; permite análise temporal (picos por semana/mês)

O agrupamento por embedding (similaridade de cosseno) reúne paráfrases como
*"como faço matrícula"* e *"como me matriculo"* como a mesma pergunta — sem
depender de texto idêntico.

### Refinamento futuro

O threshold de similaridade (`THRESHOLD_MESMA_PERGUNTA = 0.92`) é um parâmetro
de calibração a ajustar com dados reais, em conjunto com a squad de IA. O modelo
de embedding em produção pode exigir um valor diferente do usado em desenvolvimento.

O detalhamento técnico do modelo de dados — diagrama ER, estratégia de embedding,
caminho de evolução para pgvector — está em [`db/README.md`](../db/README.md).
