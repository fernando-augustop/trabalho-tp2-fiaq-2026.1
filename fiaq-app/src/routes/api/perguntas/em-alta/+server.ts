import type { RequestHandler } from './$types'
import { listarEmAlta } from '../../../../../server/repositorios/pergunta'
import { apiError, json } from '$lib/server/http'

export const GET: RequestHandler = async ({ url }) => {
  const dias = Number(url.searchParams.get('dias') ?? 7)
  const limite = Number(url.searchParams.get('limite') ?? 5)

  if (!Number.isInteger(dias) || dias < 1 || dias > 90) {
    return apiError(400, 'Parâmetro "dias" deve ser inteiro entre 1 e 90.')
  }
  if (!Number.isInteger(limite) || limite < 1 || limite > 20) {
    return apiError(400, 'Parâmetro "limite" deve ser inteiro entre 1 e 20.')
  }

  const items = await listarEmAlta(dias, limite)
  const publicItems = items.map((item, index) => ({
    rank: index + 1,
    totalNoPeriodo: item.total_no_periodo,
    totalGeral: item.total_geral
  }))

  return json(publicItems, {
    headers: {
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
    }
  })
}
