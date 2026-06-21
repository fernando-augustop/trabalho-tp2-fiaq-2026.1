import { chatStream, type ChatMessage } from '../../utils/llmProvider'
import { buildFirecrawlContext, searchFirecrawl } from '../../utils/firecrawl'

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
* Cite as fontes no corpo com marcadores como [1], [2] ou [3].
* Não escreva URLs no corpo da resposta; os links clicáveis aparecem automaticamente abaixo.
* Se as fontes não confirmarem uma informação, diga isso com clareza e indique qual setor/sistema deve ser consultado.
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
  let responseClosed = false

  function closeResponse() {
    if (responseClosed) return
    responseClosed = true
    res.end()
  }

  try {
    sendEvent(res, { type: 'status', stage: 'web_search' })

    const webSources = await searchFirecrawl(question)
    const context = buildFirecrawlContext(webSources)

    if (webSources.length) {
      sendEvent(res, {
        type: 'sources',
        items: webSources.map(source => ({
          id: source.id,
          titulo: source.titulo,
          url: source.url,
          kind: source.kind,
          description: source.description
        }))
      })
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildPrompt(context, question, previousAnswer) }
    ]

    const stream = await chatStream(messages)
    const reader = stream.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      sendEvent(res, { type: 'token', content: value })
    }

    sendEvent(res, { type: 'done' })
  } catch (e) {
    console.error('[chat.web.post] Error:', e)
    sendEvent(res, { type: 'error', message: 'WEB_SEARCH_UNAVAILABLE' })
  } finally {
    closeResponse()
  }
})
