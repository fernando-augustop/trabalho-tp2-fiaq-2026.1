import type { H3Event } from 'h3'
import { embedQuery } from '../utils/embeddings'
import { topKFiltered } from '../utils/vectorStore'
import { chatStream } from '../utils/llmProvider'

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
- Responda SEMPRE em português brasileiro, de forma clara e acolhedora.
- Responda DIRETAMENTE ao aluno. NUNCA simule um diálogo nem use prefixos como "Aluno:", "Assistente:" ou "FIAq:".
- Seja conciso: no máximo 6 frases.
- Não complete listas, requisitos, prazos ou nomes com conhecimento externo. Se o contexto listar apenas um item, responda apenas esse item.
- Se o contexto for parcial, diga que a base consultada só informa aquilo, sem especular sobre o que pode existir fora da base.
- Se a pergunta envolver assédio ou saúde mental, oriente a procurar a Ouvidoria (ouvidoria@unb.br) e o CAEP.
- Se a pergunta não for sobre a UnB e não for uma saudação, recuse educadamente.

REGRAS CRÍTICAS SOBRE LINKS E FATOS (NUNCA viole):
- Você está PROIBIDO de inventar ou adivinhar URLs, e-mails, prazos, nomes, endereços, números ou coordenadas.
- NÃO escreva links nem URLs na sua resposta. Os links oficiais das fontes são exibidos AUTOMATICAMENTE abaixo da sua resposta para o aluno.
- Em vez de colar um link, diga em texto onde a informação está (ex.: "consulte a página da SAA" ou "veja o calendário acadêmico"). Os endereços aparecem nas fontes.
- Responda em texto/Markdown simples (parágrafos e listas). NUNCA use blocos de código com crases (\`\`\`).`

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
    'Connection': 'keep-alive'
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

    const results = topKFiltered(queryVector, 5, 0.45)

    const context = results.length > 0
      ? results.map(r => `[${r.titulo}]\n${stripLinks(r.conteudo)}`).join('\n\n')
      : 'Nenhuma informação relevante encontrada na base de dados.'

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
