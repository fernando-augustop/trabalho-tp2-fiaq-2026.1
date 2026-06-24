import type { RequestHandler } from './$types'
import { listarFaq } from '../../../../server/repositorios/faq'
import { json } from '$lib/server/http'

const FAQ_CACHE_HEADERS = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=86400'
}

export const GET: RequestHandler = async () => {
  const { categories } = await listarFaq()
  return json(categories, { headers: FAQ_CACHE_HEADERS })
}
