import type { RequestHandler } from './$types'
import { getSql } from '../../../../../server/db'
import { getSupabaseAuthConfig, requireAdmin } from '$lib/server/admin-auth'
import { apiError, json, readJson, unknownApiError } from '$lib/server/http'

interface RequestBody {
  email?: string
}

const INVITE_REQUEST_TIMEOUT_MS = 10_000

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function canonicalBaseUrl(requestOrigin: string): string {
  const configured = process.env.ADMIN_BASE_URL
    || process.env.APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')

  if (!configured) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_BASE_URL_REQUIRED')
    }

    return new URL(requestOrigin).origin.replace(/\/+$/, '')
  }

  try {
    return new URL(configured).origin.replace(/\/+$/, '')
  } catch {
    throw new Error('ADMIN_BASE_URL_INVALID')
  }
}

export const POST: RequestHandler = async (event) => {
  try {
    const admin = await requireAdmin(event)
    const body = await readJson<RequestBody>(event.request)
    const email = normalizeEmail(body?.email)

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError(400, 'INVALID_EMAIL')
    }

    const { url, serviceRoleKey } = getSupabaseAuthConfig()
    if (!url || !serviceRoleKey) {
      return apiError(503, 'INVITES_NOT_CONFIGURED')
    }

    const sql = getSql()
    await sql`
      INSERT INTO admin_usuario (email, ativo, criado_por, dthr_atualizacao)
      VALUES (${email}, TRUE, ${admin.email}, CURRENT_TIMESTAMP)
      ON CONFLICT ((lower(email))) DO UPDATE SET
        ativo = TRUE,
        criado_por = EXCLUDED.criado_por,
        dthr_atualizacao = CURRENT_TIMESTAMP
    `

    let response: Response

    try {
      const redirectTo = `${canonicalBaseUrl(event.request.url)}/admin`
      response = await fetch(`${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`, {
        method: 'POST',
        signal: AbortSignal.timeout(INVITE_REQUEST_TIMEOUT_MS),
        headers: {
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          data: { invited_as: 'fiaq_admin' }
        })
      })
    } catch (error) {
      console.warn('[admin] Falha ao enviar invite via Supabase:', error instanceof Error ? error.message : 'Request failed')
      return apiError(502, 'INVITE_REQUEST_FAILED')
    }

    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      const message = String((payload as { msg?: string, message?: string, error_description?: string }).msg
        || (payload as { message?: string }).message
        || (payload as { error_description?: string }).error_description
        || 'INVITE_FAILED')

      return apiError(response.status, message)
    }

    return json({ ok: true, email })
  } catch (error) {
    return unknownApiError(error)
  }
}
