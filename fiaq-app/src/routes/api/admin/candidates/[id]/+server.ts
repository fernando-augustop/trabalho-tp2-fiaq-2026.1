import type { RequestHandler } from './$types'
import { aprovarCandidata, rejeitarCandidata } from '../../../../../../server/repositorios/candidatos'
import { requireAdmin } from '$lib/server/admin-auth'
import { apiError, json, readJson, unknownApiError } from '$lib/server/http'

interface RequestBody {
  action?: 'approve' | 'reject'
  observation?: string
}

export const PATCH: RequestHandler = async (event) => {
  try {
    const admin = await requireAdmin(event)
    const id = Number(event.params.id)
    if (!Number.isInteger(id) || id <= 0) {
      return apiError(400, 'INVALID_ID')
    }

    const body = await readJson<RequestBody>(event.request)
    const observation = String(body?.observation || '').trim()

    if (body?.action === 'approve') {
      const candidate = await aprovarCandidata(id, admin.email, observation || undefined)
      return json({ ok: true, candidate })
    }

    if (body?.action === 'reject') {
      await rejeitarCandidata(id, admin.email, observation || undefined)
      return json({ ok: true })
    }

    return apiError(400, 'INVALID_ACTION')
  } catch (error) {
    return unknownApiError(error)
  }
}
