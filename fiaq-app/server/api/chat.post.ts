import { embedQuery } from '../utils/embeddings'
import { chatStream, embedInfo } from '../utils/llmProvider'
import { registrarPergunta } from '../repositorios/pergunta'
import { buscarRag, type SearchResult } from '../repositorios/rag'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
}

const RAG_RESULT_LIMIT = 4
const RAG_MIN_SCORE = 0.48
const MAX_CONTEXT_CHARS_PER_RESULT = 900
const MAX_CONTEXT_CHARS_TOTAL = 3600

const SYSTEM_PROMPT = `Você é o assistente virtual do fIAq, portal de informações acadêmicas da Universidade de Brasília (UnB), voltado para alunos do curso de Ciência da Computação.

COMPORTAMENTO GERAL:

* Cumprimentos e saudações devem ser respondidos de forma amigável e natural.
* Responda SEMPRE em português brasileiro, de forma clara, direta e acolhedora.
* É proibido responder em chinês, inglês ou qualquer outro idioma. Se algum trecho do contexto estiver em outro idioma, ignore esse idioma e responda em português brasileiro.
* Responda DIRETAMENTE ao aluno. NUNCA simule diálogos nem use prefixos como "Aluno:" ou "Assistente:".
* Priorize ajudar o aluno a resolver a dúvida.
* Seja conciso, mas complete. Quando a pergunta envolver procedimentos, explique todas as etapas necessárias.

AO USAR O CONTEXTO:

* Um <contexto> com informações relevantes será fornecido. Use-o como sua principal fonte.
* Se o contexto contiver a resposta completa, responda com base nele.
* Se o contexto contiver apenas parte da resposta, utilize as informações disponíveis e complemente a explicação de forma coerente.
* Considere que informações relevantes podem estar distribuídas em vários trechos do contexto. Combine os trechos antes de responder.
* Escolha os trechos que correspondem à pergunta feita. Se a pergunta for genérica e o contexto trouxer um subtópico específico, como estágio obrigatório, migração ou classificação, não trate esse subtópico como resposta principal a menos que o aluno tenha perguntado por ele.
* Extraia e utilize detalhes específicos presentes no contexto: prazos, documentos, requisitos, sistemas (SIGAA, SAA etc.), formulários, setores responsáveis e procedimentos.
* Quando o contexto mencionar um processo acadêmico, explique o procedimento passo a passo em vez de apenas resumir as regras.
* Sempre prefira fornecer uma orientação útil a responder que não possui informação suficiente.

PERGUNTAS SOBRE A UNB:

* Se a pergunta estiver relacionada à UnB, ao CIC, à graduação, matrícula, disciplinas, estágio, TCC, monitoria, bolsas, desligamento, histórico, trancamento, aproveitamento de estudos ou processos acadêmicos, considere a pergunta DENTRO DO ESCOPO.
* Mesmo quando o contexto estiver incompleto, tente orientar o aluno utilizando as informações disponíveis.
* Não responda que a pergunta está fora do escopo apenas porque o contexto é parcial.

FALLBACK:

* Só use o fallback quando a pergunta for claramente externa à UnB ou quando não houver qualquer informação relevante no contexto.
* Antes de dizer que não possui a informação, tente indicar o setor, sistema ou documento que provavelmente poderá ajudar o aluno.
* Evite respostas genéricas como "não tenho essa informação" quando existir qualquer informação útil no contexto.

LINKS E FATOS:

* NUNCA invente URLs, e-mails, prazos, documentos ou nomes que não estejam no contexto.
* Não escreva URLs na resposta — os links das fontes aparecem automaticamente abaixo.
* Cite as fontes usadas no corpo da resposta com marcadores como [1], [2] ou [3].
* Em vez de citar links, mencione onde a informação pode ser encontrada, como SIGAA, SAA, calendário acadêmico ou coordenação do curso.
* Use Markdown simples (parágrafos e listas).
* NUNCA use blocos de código com crases.

QUALIDADE DA RESPOSTA:

* Responda à pergunta feita pelo aluno.
* Não apenas copie trechos do contexto.
* Organize as informações de forma lógica.
* Quando houver um procedimento, apresente as etapas em ordem.
* Quando houver requisitos ou documentos necessários, liste-os claramente.
* Quando houver prazos, destaque-os.

TEMAS SENSÍVEIS:

* Assédio, discriminação, violência ou saúde mental: oriente SEMPRE a procurar a Ouvidoria e o CAEP.
* Nunca tente resolver esses casos você mesmo.`

function buildPrompt(context: string, question: string): string {
  return `<contexto>
${context}
</contexto>

Pergunta do aluno: ${question}`
}

function stripLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/gi, '')
    .replace(/\bhttps?:\/\/\S+/gi, '')
    .replace(/\bwww\.\S+/gi, '')
    .replace(/\b(?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/\S*)?\b/gi, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

function compactText(text: string, maxChars: number): string {
  const normalized = stripLinks(text).replace(/\s+/g, ' ').trim()
  if (normalized.length <= maxChars) return normalized

  const sliced = normalized.slice(0, maxChars).replace(/\s+\S*$/, '').trim()
  return `${sliced}...`
}

function buildCompactContext(results: SearchResult[]): string {
  const parts: string[] = []
  let usedChars = 0

  for (const [index, result] of results.entries()) {
    const heading = `[${index + 1}] ${result.titulo}\n${result.url ? `URL: ${result.url}\n` : ''}`
    const remaining = MAX_CONTEXT_CHARS_TOTAL - usedChars - heading.length
    const budget = Math.min(MAX_CONTEXT_CHARS_PER_RESULT, remaining)

    if (budget < 160) break

    const content = compactText(result.conteudo, budget)
    parts.push(`${heading}${content}`)
    usedChars += heading.length + content.length + 2
  }

  return parts.length
    ? parts.join('\n\n')
    : 'Nenhuma informação relevante encontrada na base de dados.'
}

const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'como', 'com', 'da', 'das', 'de', 'do', 'dos', 'e',
  'em', 'eu', 'fazer', 'isso', 'me', 'na', 'no', 'o', 'os', 'ou', 'para',
  'posso', 'que', 'quero', 'sao', 'se', 'um', 'uma', 'unb'
])

function terms(text: string): string[] {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(term => term.length >= 3 && !STOPWORDS.has(term))
}

function rankContextResults(question: string, results: SearchResult[]): SearchResult[] {
  const queryTerms = new Set(terms(question))
  if (!queryTerms.size) return results

  return [...results]
    .map((result, index) => {
      const titleTerms = terms(result.titulo)
      const contentTerms = new Set(terms(result.conteudo).slice(0, 120))
      const titleOverlap = titleTerms.filter(term => queryTerms.has(term)).length
      const contentOverlap = [...queryTerms].filter(term => contentTerms.has(term)).length
      const missingTitleTerms = titleTerms.filter(term => !queryTerms.has(term)).length
      const exactShortTitle = titleTerms.length > 0
        && titleTerms.length <= 3
        && titleTerms.every(term => queryTerms.has(term))

      const rank = result.score
        + titleOverlap * 0.09
        + contentOverlap * 0.015
        + (exactShortTitle ? 0.12 : 0)
        - Math.min(missingTitleTerms, 4) * 0.035
        - index * 0.001

      return { result, rank }
    })
    .sort((a, b) => b.rank - a.rank)
    .map(item => item.result)
}

function sendEvent(res: NodeJS.WritableStream, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)

  if (!body?.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    throw createError({ statusCode: 400, message: 'INVALID_PAYLOAD' })
  }

  const lastUserMessage = [...body.messages]
    .reverse()
    .find(m => m.role === 'user')

  if (!lastUserMessage) {
    throw createError({ statusCode: 400, message: 'INVALID_PAYLOAD' })
  }

  const question = lastUserMessage.content

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const res = event.node.res
  let responseClosed = false

  function closeResponse() {
    if (responseClosed) return
    responseClosed = true
    res.end()
  }

  try { // EMBEDDING
    sendEvent(res, { type: 'status', stage: 'searching' })

    let queryVector: number[]
    try {
      queryVector = await embedQuery(question)
    } catch {
      sendEvent(res, { type: 'error', message: 'LLM_UNAVAILABLE' })
      closeResponse()
      return
    }

    const { results: rawResults, source: ragSource } = await buscarRag(
      queryVector,
      embedInfo.model,
      RAG_RESULT_LIMIT,
      RAG_MIN_SCORE
    )
    const results = rankContextResults(question, rawResults)
    console.log(`[chat.post] Contexto RAG carregado de ${ragSource}.`)

    const context = buildCompactContext(results)

    const history = body.messages
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: buildPrompt(context, question) }
    ]

    const stream = await chatStream(messages)
    const reader = stream.getReader()
    let respostaCompleta = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      respostaCompleta += value
      sendEvent(res, { type: 'token', content: value })
    }

    if (results.length > 0) {
      sendEvent(res, {
        type: 'sources',
        items: results.map(r => ({ id: r.id, titulo: r.titulo, url: r.url, kind: 'rag' }))
      })
    }

    sendEvent(res, { type: 'done' })
    const registroPergunta = registrarPergunta(
      question,
      queryVector,
      embedInfo.model,
      respostaCompleta,
      results.map(r => ({ id: r.id, titulo: r.titulo, url: r.url }))
    ).catch((e) => {
      console.error('[chat.post] Falha ao registrar pergunta:', e)
    })

    closeResponse()
    await registroPergunta
  } catch (e) {
    console.error('[chat.post] Error:', e)
    sendEvent(res, { type: 'error', message: 'LLM_UNAVAILABLE' })
  } finally {
    closeResponse()
  }
})
