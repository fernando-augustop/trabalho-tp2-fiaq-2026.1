import type { RequestEvent } from '@sveltejs/kit'
import { getSql, isDatabaseConfigured } from '../../../server/db'

export interface AdminUser {
  id: string
  email: string
}

interface SupabaseAuthUser {
  id?: string
  email?: string
}

const AUTH_REQUEST_TIMEOUT_MS = 10_000

export class ApiHttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function supabaseUrl(): string {
  return String(
    process.env.SUPABASE_URL
      || process.env.VITE_SUPABASE_URL
      || ''
  ).replace(/\/+$/, '')
}

function supabaseAnonKey(): string {
  return String(
    process.env.SUPABASE_ANON_KEY
      || process.env.VITE_SUPABASE_ANON_KEY
      || ''
  )
}

function bootstrapEmails(): Set<string> {
  return new Set(
    String(process.env.ADMIN_BOOTSTRAP_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

function bearerToken(event: RequestEvent): string {
  const header = event.request.headers.get('authorization') || ''
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || ''
}

export function getSupabaseAuthConfig() {
  return {
    url: supabaseUrl(),
    anonKey: supabaseAnonKey(),
    serviceRoleKey: String(process.env.SUPABASE_SERVICE_ROLE_KEY || '')
  }
}

async function getAuthenticatedUser(token: string): Promise<AdminUser | null> {
  const { url, anonKey } = getSupabaseAuthConfig()
  if (!token) return null
  if (!url || !anonKey) throw new ApiHttpError(503, 'SUPABASE_AUTH_NOT_CONFIGURED')

  let response: Response
  try {
    response = await fetch(`${url}/auth/v1/user`, {
      signal: AbortSignal.timeout(AUTH_REQUEST_TIMEOUT_MS),
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`
      }
    })
  } catch (error) {
    console.warn('[admin] Falha ao validar usuário no Supabase Auth:', error instanceof Error ? error.message : 'Request failed')
    throw new ApiHttpError(503, 'SUPABASE_AUTH_UNAVAILABLE')
  }

  if (response.status === 401 || response.status === 403) return null
  if (!response.ok) throw new ApiHttpError(503, 'SUPABASE_AUTH_UNAVAILABLE')

  const user = await response.json().catch(() => null) as SupabaseAuthUser | null
  const email = String(user?.email || '').trim().toLowerCase()
  const id = String(user?.id || '').trim()
  if (!email || !id) throw new ApiHttpError(503, 'SUPABASE_AUTH_UNAVAILABLE')

  return { id, email }
}

export async function requireAdmin(event: RequestEvent): Promise<AdminUser> {
  const user = await getAuthenticatedUser(bearerToken(event))
  if (!user) {
    throw new ApiHttpError(401, 'AUTH_REQUIRED')
  }

  const bootstrapped = bootstrapEmails().has(user.email)
  if (bootstrapped) return user

  if (!isDatabaseConfigured()) {
    throw new ApiHttpError(503, 'DATABASE_NOT_CONFIGURED')
  }

  const sql = getSql()
  const rows = await sql<{ allowed: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM admin_usuario
      WHERE lower(email) = ${user.email}
        AND ativo = TRUE
    ) AS allowed
  `

  if (!rows[0]?.allowed) {
    throw new ApiHttpError(403, 'ADMIN_REQUIRED')
  }

  return user
}

export function toApiError(error: unknown) {
  if (error instanceof ApiHttpError) {
    return { status: error.status, message: error.message }
  }

  return { status: 500, message: 'INTERNAL_ERROR' }
}
