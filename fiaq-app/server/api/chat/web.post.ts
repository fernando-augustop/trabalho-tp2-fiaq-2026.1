import { chatStream, type ChatMessage } from '../../utils/llmProvider'
import { buildFirecrawlContext, getFirecrawlIncludeDomains, searchFirecrawl } from '../../utils/firecrawl'

interface RequestBody {
  question?: string
  previousAnswer?: string
  messages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

const SYSTEM_PROMPT = `Você é o assistente virtual do fIAq, portal de informações acadêmicas da Universidade de Brasília (UnB), voltado para alunos do curso de Ciência da Computação.

O aluno marcou a resposta anterior como insuficiente. Agora você deve complementar a resposta usando a pesquisa web oficial fornecida no contexto.

REGRAS:

* Responda sempre em português brasileiro.
* Use somente as fontes web listadas no contexto.
* Seja direto e prático, explicando o que o aluno deve fazer.
* Não use marcadores de fonte no corpo, como [1], [2] ou [3]; as fontes aparecem automaticamente abaixo da resposta.
* Não escreva URLs no corpo da resposta; os links clicáveis aparecem automaticamente abaixo.
* Não crie seções "Links úteis", "Fontes", "Referências" ou listas de links no corpo da resposta.
* Não use emojis.
* Em perguntas de escopo UnB, nunca use frases como "não sei", "não tenho informação" ou "não encontrei informação". Se as fontes não confirmarem uma informação, dê a melhor orientação possível e indique qual setor/sistema deve ser consultado, sem inventar fatos.
* Não invente prazos, e-mails, documentos, links ou regras.`

function buildPrompt(context: string, question: string, previousAnswer: string): string {
  return `<fontes_web>
${context}
</fontes_web>

Pergunta original do aluno: ${question}

Resposta anterior marcada como insuficiente:
${previousAnswer || 'Não informada.'}

Escreva uma resposta complementar, mais útil e baseada nas fontes web acima.`
}

function sendEvent(res: NodeJS.WritableStream, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

function sendActivity(
  res: NodeJS.WritableStream,
  data: {
    id: string
    kind: 'web' | 'answer'
    status: 'active' | 'done' | 'skipped' | 'error'
    label: string
    detail?: string
    sources?: Array<{
      id: string
      titulo: string
      url: string
      kind: 'web'
      description?: string
    }>
    domains?: string[]
  }
): void {
  sendEvent(res, { type: 'activity', ...data })
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)
  const question = String(body?.question || '').trim()
  const previousAnswer = String(body?.previousAnswer || '').trim()

  if (!question) {
    throw createError({ statusCode: 400, message: 'INVALID_PAYLOAD' })
  }

  setResponseHeaders(event, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  })

  const res = event.node.res
  const abort = new AbortController()
  let responseClosed = false
  let reader: ReadableStreamDefaultReader<string> | null = null

  function closeResponse() {
    if (responseClosed) return
    responseClosed = true
    res.end()
  }

  function handleClientClose() {
    if (responseClosed) return
    abort.abort()
    void reader?.cancel().catch(() => {})
  }

  res.on('close', handleClientClose)

  try {
    const webDomains = getFirecrawlIncludeDomains()

    sendEvent(res, { type: 'status', stage: 'web_search' })
    sendActivity(res, {
      id: 'web-plan',
      kind: 'web',
      status: 'active',
      label: 'Pesquisa web acionada pelo feedback',
      detail: 'Vou complementar a resposta com fontes oficiais configuradas.',
      domains: webDomains
    })
    sendActivity(res, {
      id: 'web-search',
      kind: 'web',
      status: 'active',
      label: 'Pesquisando sites oficiais',
      detail: 'Consultando resultados restritos aos domínios configurados.',
      domains: webDomains
    })

    const webSources = await searchFirecrawl(question, { signal: abort.signal })
    if (abort.signal.aborted) return

    const context = buildFirecrawlContext(webSources)
    const responseSources = webSources.map(source => ({
      id: source.id,
      titulo: source.titulo,
      url: source.url,
      kind: source.kind,
      description: source.description
    }))

    if (webSources.length) {
      sendActivity(res, {
        id: 'web-search',
        kind: 'web',
        status: 'done',
        label: 'Fontes web selecionadas',
        detail: `${webSources.length} fonte(s) oficial(is) encontradas para complementar.`,
        sources: responseSources.slice(0, 4),
        domains: webDomains
      })
      sendEvent(res, {
        type: 'sources',
        items: responseSources
      })
    } else {
      sendActivity(res, {
        id: 'web-search',
        kind: 'web',
        status: 'skipped',
        label: 'Pesquisa web sem nova fonte',
        detail: 'Nenhuma fonte oficial nova foi selecionada; vou responder com a orientação mais segura.',
        domains: webDomains
      })
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(context, question, previousAnswer) }
    ]

    const stream = await chatStream(messages)
    reader = stream.getReader()
    sendActivity(res, {
      id: 'answer',
      kind: 'answer',
      status: 'active',
      label: 'Escrevendo resposta complementar',
      detail: 'Organizando a resposta com base na pesquisa web.'
    })

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      if (abort.signal.aborted) return
      sendEvent(res, { type: 'token', content: value })
    }

    sendActivity(res, {
      id: 'answer',
      kind: 'answer',
      status: 'done',
      label: 'Resposta pronta',
      detail: 'As fontes usadas aparecem logo abaixo da resposta.'
    })
    sendEvent(res, { type: 'done' })
  } catch (e) {
    if (abort.signal.aborted) return
    console.error('[chat.web.post] Error:', e)
    sendActivity(res, {
      id: 'web-search',
      kind: 'web',
      status: 'error',
      label: 'Pesquisa web indisponível',
      detail: 'Não foi possível consultar fontes adicionais agora.'
    })
    sendEvent(res, { type: 'error', message: 'WEB_SEARCH_UNAVAILABLE' })
  } finally {
    res.off('close', handleClientClose)
    closeResponse()
  }
})
