import type { RequestHandler } from './$types'
import { apiError, readJson } from '$lib/server/http'
import { eventStream, type SseWriter } from '$lib/server/sse'
import { chatStream, type ChatMessage } from '../../../../../server/utils/llmProvider'
import { buildFirecrawlContext, getFirecrawlIncludeDomains, searchFirecrawl } from '../../../../../server/utils/firecrawl'

interface RequestBody {
  question?: string
  previousAnswer?: string
  messages?: Array<{
    role: 'user' | 'assistant'
    content: string
  }>
}

const SYSTEM_PROMPT = `Você é o assistente virtual do fIAq, portal de informações acadêmicas da Universidade de Brasília (UnB), voltado para alunos do curso de Ciência da Computação.

O aluno marcou a resposta anterior como insuficiente. Agora você deve complementar a resposta usando a pesquisa web fornecida no contexto.

REGRAS:

* Responda sempre em português brasileiro.
* Use somente as fontes web listadas no contexto.
* Quando a fonte for sindicato ou veículo jornalístico, trate como indício/contexto externo e recomende confirmar decisões acadêmicas em canais institucionais da UnB.
* Seja direto e prático, explicando o que o aluno deve fazer.
* Não use marcadores de fonte no corpo, como [1], [2] ou [3]; as fontes aparecem automaticamente abaixo da resposta.
* Não escreva URLs no corpo da resposta; os links clicáveis aparecem automaticamente abaixo.
* Não crie seções "Links úteis", "Fontes", "Referências" ou listas de links no corpo da resposta.
* Não use emojis.
* Em perguntas de escopo UnB, nunca use frases como "não sei", "não tenho informação" ou "não encontrei informação". Se as fontes não confirmarem uma informação, dê a melhor orientação possível e indique qual setor/sistema deve ser consultado, sem inventar fatos.
* Não invente prazos, e-mails, documentos, links ou regras.`

const MAX_QUESTION_CHARS = 2_000
const MAX_PREVIOUS_ANSWER_CHARS = 4_000

function boundedText(value: unknown, maxChars: number): string {
  return String(value || '').trim().slice(0, maxChars)
}

function buildPrompt(context: string, question: string, previousAnswer: string): string {
  return `<fontes_web>
${context}
</fontes_web>

Pergunta original do aluno: ${question}

Resposta anterior marcada como insuficiente:
${previousAnswer || 'Não informada.'}

Escreva uma resposta complementar, mais útil e baseada nas fontes web acima.`
}

async function sendEvent(sse: SseWriter, data: object): Promise<void> {
  sse.send(data)
}

async function sendActivity(
  sse: SseWriter,
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
): Promise<void> {
  await sendEvent(sse, { type: 'activity', ...data })
}

export const POST: RequestHandler = async ({ request }) => {
  const body = await readJson<RequestBody>(request)
  const question = boundedText(body?.question, MAX_QUESTION_CHARS)
  const previousAnswer = boundedText(body?.previousAnswer, MAX_PREVIOUS_ANSWER_CHARS)

  if (!question) {
    return apiError(400, 'INVALID_PAYLOAD')
  }

  return eventStream(async (sse) => {
    const abort = new AbortController()
    let reader: ReadableStreamDefaultReader<string> | null = null

    function handleClientClose() {
      abort.abort()
      void reader?.cancel().catch(() => {})
    }

    sse.signal.addEventListener('abort', handleClientClose, { once: true })

    try {
      const webDomains = getFirecrawlIncludeDomains()

      await sendEvent(sse, { type: 'status', stage: 'web_search' })
      await sendActivity(sse, {
        id: 'web-plan',
        kind: 'web',
        status: 'active',
        label: 'Pesquisa web acionada pelo feedback',
        detail: 'Vou complementar a resposta com fontes confiáveis configuradas.',
        domains: webDomains
      })
      await sendActivity(sse, {
        id: 'web-search',
        kind: 'web',
        status: 'active',
        label: 'Pesquisando fontes web',
        detail: 'Consultando fontes oficiais e confiáveis.',
        domains: webDomains
      })

      let webSources
      try {
        webSources = await searchFirecrawl(question, { signal: abort.signal })
      } catch (error) {
        if (abort.signal.aborted) return

        console.error('[chat.web.post] Firecrawl error:', error)
        await sendActivity(sse, {
          id: 'web-search',
          kind: 'web',
          status: 'error',
          label: 'Pesquisa web indisponível',
          detail: 'Não foi possível consultar fontes adicionais agora.',
          domains: webDomains
        })
        await sendEvent(sse, { type: 'error', message: 'WEB_SEARCH_UNAVAILABLE' })
        return
      }

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
        await sendActivity(sse, {
          id: 'web-search',
          kind: 'web',
          status: 'done',
          label: 'Fontes web selecionadas',
          detail: `${webSources.length} fonte(s) confiável(is) encontradas para complementar.`,
          sources: responseSources.slice(0, 4),
          domains: webDomains
        })
        await sendEvent(sse, {
          type: 'sources',
          items: responseSources
        })
      } else {
        await sendActivity(sse, {
          id: 'web-search',
          kind: 'web',
          status: 'skipped',
          label: 'Pesquisa web sem nova fonte',
          detail: 'Nenhuma fonte nova foi selecionada para complementar esta resposta.',
          domains: webDomains
        })
        await sendEvent(sse, { type: 'error', message: 'NO_WEB_SOURCES' })
        return
      }

      const messages: ChatMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: buildPrompt(context, question, previousAnswer) }
      ]

      try {
        const stream = await chatStream(messages)
        reader = stream.getReader()
        await sendActivity(sse, {
          id: 'answer',
          kind: 'answer',
          status: 'active',
          label: 'Escrevendo resposta complementar',
          detail: 'Organizando a resposta com base na pesquisa web.'
        })

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (abort.signal.aborted) {
            await reader.cancel().catch(() => {})
            return
          }
          await sendEvent(sse, { type: 'token', content: value })
        }

        await sendActivity(sse, {
          id: 'answer',
          kind: 'answer',
          status: 'done',
          label: 'Resposta pronta',
          detail: 'As fontes usadas aparecem logo abaixo da resposta.'
        })
        await sendEvent(sse, { type: 'done' })
      } catch (error) {
        await reader?.cancel().catch(() => {})
        if (abort.signal.aborted) return

        console.error('[chat.web.post] LLM error:', error)
        await sendActivity(sse, {
          id: 'answer',
          kind: 'answer',
          status: 'error',
          label: 'Não foi possível concluir',
          detail: 'A geração falhou antes de finalizar a resposta complementar.'
        })
        await sendEvent(sse, { type: 'error', message: 'LLM_UNAVAILABLE' })
      }
    } catch (e) {
      if (abort.signal.aborted) return
      console.error('[chat.web.post] Error:', e)
      await sendActivity(sse, {
        id: 'web-search',
        kind: 'web',
        status: 'error',
        label: 'Pesquisa web indisponível',
        detail: 'Não foi possível consultar fontes adicionais agora.'
      })
      await sendEvent(sse, { type: 'error', message: 'WEB_SEARCH_UNAVAILABLE' })
    }
  })
}
