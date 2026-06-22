import { getSql } from '../../db/index'
import { getSupabaseAuthConfig, requireAdmin } from '../../utils/adminAuth'

interface RequestBody {
  email?: string
}

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

  const redirectTo = `${canonicalBaseUrl()}/admin`
  const response = await fetch(`${url}/auth/v1/invite?redirect_to=${encodeURIComponent(redirectTo)}`, {
    method: 'POST',
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
    ON CONFLICT (email) DO UPDATE SET
      ativo = TRUE,
      criado_por = EXCLUDED.criado_por,
      dthr_atualizacao = CURRENT_TIMESTAMP
  `

  return { ok: true, email }
})
