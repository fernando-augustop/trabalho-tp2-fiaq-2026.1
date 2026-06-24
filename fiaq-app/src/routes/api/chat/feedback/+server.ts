import type { RequestEvent, RequestHandler } from './$types'
import { apiError, json, readJson, unknownApiError } from '$lib/server/http'
import { registrarAvaliacaoResposta, type RespostaFeedback } from '../../../../../server/repositorios/feedback'
import type { MotivoBuscaWeb } from '../../../../../server/repositorios/candidatos'

interface RequestBody {
  question?: string
  answer?: string
  rating?: RespostaFeedback
  sources?: unknown[]
  webSearchRequested?: boolean
  webSearchReason?: MotivoBuscaWeb
}

const FEEDBACK_RATE_LIMIT_WINDOW_MS = 60_000
const FEEDBACK_RATE_LIMIT_MAX = 20
const FEEDBACK_RATE_LIMIT_CLEANUP_MS = 300_000
const MAX_QUESTION_CHARS = 2_000
const MAX_ANSWER_CHARS = 12_000
const MAX_SOURCE_TITLE_CHARS = 300
const feedbackRateLimit = new Map<string, { count: number, resetAt: number }>()
let nextRateLimitCleanup = Date.now() + FEEDBACK_RATE_LIMIT_CLEANUP_MS

type SanitizedFeedbackSource = {
  id?: string
  titulo?: string
  url: string
  kind: 'web'
  description?: string
}

function compactString(value: unknown, maxLength: number): string | undefined {
  const normalized = String(value || '').replace(/\s+/g, ' ').trim()
  return normalized ? normalized.slice(0, maxLength) : undefined
}

function sanitizeWebSource(source: unknown): SanitizedFeedbackSource | null {
  if (!source || typeof source !== 'object') return null
  const item = source as Record<string, unknown>

  if (String(item.kind || '') !== 'web') return null

  try {
    const parsedUrl = new URL(String(item.url || '').trim())
    if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') return null

    return {
      id: compactString(item.id, MAX_SOURCE_TITLE_CHARS),
      titulo: compactString(item.titulo || item.title, MAX_SOURCE_TITLE_CHARS),
      url: parsedUrl.href,
      kind: 'web',
      description: compactString(item.description, 1000)
    }
  } catch {
    return null
  }
}

function sanitizeFeedbackSources(sources: unknown): SanitizedFeedbackSource[] {
  if (!Array.isArray(sources)) return []

  const seen = new Set<string>()
  const sanitized: SanitizedFeedbackSource[] = []

  for (const source of sources) {
    const webSource = sanitizeWebSource(source)
    if (!webSource || seen.has(webSource.url)) continue
    seen.add(webSource.url)
    sanitized.push(webSource)
  }

  return sanitized.slice(0, 10)
}

function clientKey(event: RequestEvent): string {
  return event.request.headers.get('cf-connecting-ip')
    || event.request.headers.get('x-real-ip')
    || event.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || event.getClientAddress()
    || 'unknown'
}

function assertFeedbackRateLimit(event: RequestEvent): Response | null {
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
    return null
  }

  current.count += 1
  return current.count > FEEDBACK_RATE_LIMIT_MAX ? apiError(429, 'RATE_LIMITED') : null
}

function assertSameOrigin(event: RequestEvent): Response | null {
  const origin = event.request.headers.get('origin')
  const host = event.request.headers.get('x-forwarded-host') || event.request.headers.get('host')
  if (!origin) return null

  if (!host) return apiError(403, 'INVALID_ORIGIN')

  try {
    return new URL(origin).host === host ? null : apiError(403, 'INVALID_ORIGIN')
  } catch {
    return apiError(403, 'INVALID_ORIGIN')
  }
}

export const POST: RequestHandler = async (event) => {
  const rateLimitError = assertFeedbackRateLimit(event)
  if (rateLimitError) return rateLimitError

  const originError = assertSameOrigin(event)
  if (originError) return originError

  try {
    const body = await readJson<RequestBody>(event.request)
    const rating = body?.rating

    if (rating !== 'helpful' && rating !== 'unhelpful') {
      return apiError(400, 'INVALID_RATING')
    }

    const question = String(body?.question || '').trim()
    const answer = String(body?.answer || '').trim()

    if (!question || !answer) {
      return apiError(400, 'INVALID_PAYLOAD')
    }

    if (question.length > MAX_QUESTION_CHARS || answer.length > MAX_ANSWER_CHARS) {
      return apiError(413, 'PAYLOAD_TOO_LARGE')
    }

    const sanitizedSources = sanitizeFeedbackSources(body?.sources)
    const webSearchRequested = Boolean(body?.webSearchRequested) && sanitizedSources.length > 0

    await registrarAvaliacaoResposta({
      pergunta: question,
      resposta: answer,
      avaliacao: rating,
      fontesUsadas: sanitizedSources,
      acionouBuscaWeb: webSearchRequested,
      motivoBuscaWeb: body?.webSearchReason === 'fallback_automatico' || body?.webSearchReason === 'feedback_negativo'
        ? body.webSearchReason
        : undefined
    })

    return json({ ok: true })
  } catch (error) {
    return unknownApiError(error)
  }
}
