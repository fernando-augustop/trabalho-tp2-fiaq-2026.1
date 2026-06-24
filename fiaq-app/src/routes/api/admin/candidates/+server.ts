import type { RequestHandler } from './$types'
import { contarCandidatas, listarCandidatas, type StatusCandidato } from '../../../../../server/repositorios/candidatos'
import { requireAdmin } from '$lib/server/admin-auth'
import { json, unknownApiError } from '$lib/server/http'

function normalizeStatus(status: string | null): StatusCandidato | 'todas' {
  return status === 'aprovada' || status === 'rejeitada' || status === 'todas'
    ? status
    : 'pendente'
}

export const GET: RequestHandler = async (event) => {
  try {
    await requireAdmin(event)
    const status = normalizeStatus(event.url.searchParams.get('status'))

    const [items, totals] = await Promise.all([
      listarCandidatas(status),
      contarCandidatas()
    ])

    return json({ items, totals })
  } catch (error) {
    return unknownApiError(error)
  }
}
