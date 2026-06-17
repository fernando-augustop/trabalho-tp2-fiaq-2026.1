import { type FaqCategory, listarFaq } from '../repositorios/faq'

export type { FaqCategory }

// O FAQ muda apenas por seed/deploy; cache por instância evita consulta repetida.
let cache: FaqCategory[] | null = null

export default defineEventHandler(async (event): Promise<FaqCategory[]> => {
  setResponseHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')

  if (cache) return cache

  const { categories, source } = await listarFaq()
  console.log(`[faq] FAQ carregado de ${source}.`)
  cache = categories
  return cache
})
