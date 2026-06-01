import type { H3Event } from 'h3'
import { embedQuery } from '../utils/embeddings'
import { topKFiltered } from '../utils/vectorStore'
import { ollamaChatStream } from '../utils/ollama'

interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
}

const SYSTEM_PROMPT = `Você é o assistente virtual do fIAq, o portal de informações da Universidade de Brasília.

Regras que você DEVE seguir:
- Cumprimentos e saudações podem ser respondidos normalmente de forma amigável.
- Responda APENAS com base no <contexto> fornecido abaixo, exceto para saudações simples.
- Se a resposta não estiver no contexto, diga exatamente: "Não tenho essa informação. Por favor, entre em contato com a coordenação do CIC ou acesse o site da UnB."
- NUNCA invente links, prazos, nomes ou informações que não estejam no contexto.
- Responda SEMPRE em português brasileiro, de forma clara e acolhedora.
- Seja conciso: no máximo 6 frases.
- Se a pergunta envolver assédio ou saúde mental, inclua sempre o contato da Ouvidoria (ouvidoria@unb.br) e do CAEP.
- Se a pergunta não for sobre a UnB e não for uma saudação, recuse educadamente.`

function buildPrompt(context: string, question: string): string {
  return `<contexto>
${context}
</contexto>

Pergunta do aluno: ${question}`
}

function sendEvent(res: NodeJS.WritableStream, data: object): void {
  res.write(`data: ${JSON.stringify(data)}\n\n`)
}

export default defineEventHandler(async (event: H3Event) => {
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
    'Connection': 'keep-alive',
  })

  const res = event.node.res

  try { // EMBEDDING
    let queryVector: number[]
    try {
      queryVector = await embedQuery(question)
    } catch {
      sendEvent(res, { type: 'error', message: 'LLM_UNAVAILABLE' })
      res.end()
      return
    }

    const results = topKFiltered(queryVector, 4, 0.5)

    const context = results.length > 0
      ? results.map(r => `[${r.titulo}]\n${r.conteudo}`).join('\n\n')
      : 'Nenhuma informação relevante encontrada na base de dados.'

    const history = body.messages
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    const messages: ChatMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...history,
      { role: 'user', content: buildPrompt(context, question) }
    ]

    const stream = await ollamaChatStream(messages)
    const reader = stream.getReader()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      sendEvent(res, { type: 'token', content: value })
    }

    if (results.length > 0) {
      sendEvent(res, {
        type: 'sources',
        items: results.map(r => ({ id: r.id, titulo: r.titulo, url: r.url }))
      })
    }

    sendEvent(res, { type: 'done' })

  } catch (e) {
    console.error('[chat.post] Error:', e)
    sendEvent(res, { type: 'error', message: 'LLM_UNAVAILABLE' })
  } finally {
    res.end()
  }
})
