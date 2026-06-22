import { aprovarCandidata, rejeitarCandidata } from '../../../repositorios/candidatos'
import { requireAdmin } from '../../../utils/adminAuth'

interface RequestBody {
  action?: 'approve' | 'reject'
  observation?: string
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'INVALID_ID' })
  }

  const body = await readBody<RequestBody>(event)
  const observation = String(body?.observation || '').trim()

  if (body?.action === 'approve') {
    const candidate = await aprovarCandidata(id, admin.email, observation || undefined)
    return { ok: true, candidate }
  }

  if (body?.action === 'reject') {
    await rejeitarCandidata(id, admin.email, observation || undefined)
    return { ok: true }
  }

  throw createError({ statusCode: 400, message: 'INVALID_ACTION' })
})
