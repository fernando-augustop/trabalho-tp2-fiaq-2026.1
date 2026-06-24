import type { RequestHandler } from './$types'
import { listarFaq } from '../../../../server/repositorios/faq'
import { json } from '$lib/server/http'

export const GET: RequestHandler = async () => {
  const { categories } = await listarFaq()
  return json(categories)
}
