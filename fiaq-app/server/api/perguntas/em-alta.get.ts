import { listarEmAlta } from '../../repositorios/pergunta'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  const dias = Number(query.dias ?? 7)
  const limite = Number(query.limite ?? 5)

  if (!Number.isInteger(dias) || dias < 1 || dias > 90) {
    throw createError({ statusCode: 400, message: 'Parâmetro "dias" deve ser inteiro entre 1 e 90.' })
  }
  if (!Number.isInteger(limite) || limite < 1 || limite > 20) {
    throw createError({ statusCode: 400, message: 'Parâmetro "limite" deve ser inteiro entre 1 e 20.' })
  }

  setResponseHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')

  return listarEmAlta(dias, limite)
})
