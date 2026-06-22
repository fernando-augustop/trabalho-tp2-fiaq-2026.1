import { getSql } from '../../db/index'
import { getSupabaseAuthConfig, requireAdmin } from '../../utils/adminAuth'

interface RequestBody {
  email?: string
}

const INVITE_REQUEST_TIMEOUT_MS = 10_000

function normalizeEmail(value: unknown): string {
  return String(value || '').trim().toLowerCase()
}

function canonicalBaseUrl(): string {
  const configured = process.env.ADMIN_BASE_URL
    || process.env.APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '')
    || 'http://localhost:3000'

  try {
    return new URL(configured).origin.replace(/\/+$/, '')
  } catch {
    throw createError({ statusCode: 503, message: 'ADMIN_BASE_URL_INVALID' })
  }
}

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const body = await readBody<RequestBody>(event)
  const email = normalizeEmail(body?.email)

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw createError({ statusCode: 400, message: 'INVALID_EMAIL' })
  }

  const { url, serviceRoleKey } = getSupabaseAuthConfig()
  if (!url || !serviceRoleKey) {
    throw createError({ statusCode: 503, message: 'INVITES_NOT_CONFIGURED' })
  }

  let response: Response

  try {
    const redirectTo = `${canonicalBaseUrl()}/admin`
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
    throw createError({ statusCode: 502, message: 'INVITE_REQUEST_FAILED' })
  }

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: String((payload as { msg?: string, message?: string, error_description?: string }).msg
        || (payload as { message?: string }).message
        || (payload as { error_description?: string }).error_description
        || 'INVITE_FAILED')
    })
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

  return { ok: true, email }
})
