import { registrarAvaliacaoResposta, type RespostaFeedback } from '../../repositorios/feedback'

interface RequestBody {
  question?: string
  answer?: string
  rating?: RespostaFeedback
  sources?: unknown[]
  webSearchRequested?: boolean
}

export default defineEventHandler(async (event) => {
  const body = await readBody<RequestBody>(event)
  const rating = body?.rating

  if (rating !== 'helpful' && rating !== 'unhelpful') {
    throw createError({ statusCode: 400, message: 'INVALID_RATING' })
  }

  await registrarAvaliacaoResposta({
    pergunta: String(body?.question || ''),
    resposta: String(body?.answer || ''),
    avaliacao: rating,
    fontesUsadas: Array.isArray(body?.sources) ? body.sources : [],
    acionouBuscaWeb: Boolean(body?.webSearchRequested)
  })

  return { ok: true }
})
