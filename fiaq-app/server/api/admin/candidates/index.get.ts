import { contarCandidatas, listarCandidatas, type StatusCandidato } from '../../../repositorios/candidatos'
import { requireAdmin } from '../../../utils/adminAuth'

function normalizeStatus(status: unknown): StatusCandidato | 'todas' {
  return status === 'aprovada' || status === 'rejeitada' || status === 'todas'
    ? status
    : 'pendente'
}

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const query = getQuery(event)
  const status = normalizeStatus(query.status)

  const [items, totals] = await Promise.all([
    listarCandidatas(status),
    contarCandidatas()
  ])

  return { items, totals }
})
