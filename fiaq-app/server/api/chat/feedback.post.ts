import { registrarAvaliacaoResposta, type RespostaFeedback } from '../../repositorios/feedback'

interface RequestBody {
  question?: string
  answer?: string
  rating?: RespostaFeedback
  sources?: unknown[]
  webSearchRequested?: boolean
}

const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60_000
const FEEDBACK_RATE_LIMIT_MAX = 20
const FEEDBACK_RATE_LIMIT_CLEANUP_MS = 300_000
const MAX_QUESTION_CHARS = 2_000
const MAX_ANSWER_CHARS = 12_000
const feedbackRateLimit = new Map<string, { count: number, resetAt: number }>()
let nextRateLimitCleanup = Date.now() + FEEDBACK_RATE_LIMIT_CLEANUP_MS

function clientKey(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): string {
  return getHeader(event, 'cf-connecting-ip')
    || getHeader(event, 'x-real-ip')
    || getHeader(event, 'x-forwarded-for')?.split(',')[0]?.trim()
    || event.node.req.socket.remoteAddress
    || 'unknown'
}

function assertFeedbackRateLimit(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): void {
  const key = clientKey(event)
  const now = Date.now()

  if (now >= nextRateLimitCleanup) {
    for (const [entryKey, value] of feedbackRateLimit.entries()) {
      if (value.resetAt <= now) feedbackRateLimit.delete(entryKey)
    }
    nextRateLimitCleanup = now + FEEDBACK_RATE_LIMIT_CLEANUP_MS
  }

  const current = feedbackRateLimit.get(key)

  if (!current || current.resetAt <= now) {
    feedbackRateLimit.set(key, { count: 1, resetAt: now + FEEDBACK_RATE_LIMIT_WINDOW_MS })
    return
  }

  current.count += 1
  if (current.count > FEEDBACK_RATE_LIMIT_MAX) {
    throw createError({ statusCode: 429, message: 'RATE_LIMITED' })
  }
}

function assertSameOrigin(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): void {
  const origin = getHeader(event, 'origin')
  const host = getHeader(event, 'x-forwarded-host') || getHeader(event, 'host')
  if (!origin) return

  if (!host) {
    throw createError({ statusCode: 403, message: 'INVALID_ORIGIN' })
  }

  try {
    if (new URL(origin).host !== host) {
      throw createError({ statusCode: 403, message: 'INVALID_ORIGIN' })
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    throw createError({ statusCode: 403, message: 'INVALID_ORIGIN' })
  }
}

export default defineEventHandler(async (event) => {
  assertFeedbackRateLimit(event)
  assertSameOrigin(event)

  const body = await readBody<RequestBody>(event)
  const rating = body?.rating

  if (rating !== 'helpful' && rating !== 'unhelpful') {
    throw createError({ statusCode: 400, message: 'INVALID_RATING' })
  }

  const question = String(body?.question || '').trim()
  const answer = String(body?.answer || '').trim()

  if (!question || !answer) {
    throw createError({ statusCode: 400, message: 'INVALID_PAYLOAD' })
  }

  if (question.length > MAX_QUESTION_CHARS || answer.length > MAX_ANSWER_CHARS) {
    throw createError({ statusCode: 413, message: 'PAYLOAD_TOO_LARGE' })
  }

  await registrarAvaliacaoResposta({
    pergunta: question,
    resposta: answer,
    avaliacao: rating,
    fontesUsadas: Array.isArray(body?.sources) ? body.sources : [],
    acionouBuscaWeb: Boolean(body?.webSearchRequested)
  })

  return { ok: true }
})
