import { getSql, isDatabaseConfigured } from '../db/index'

export interface AdminUser {
  id: string
  email: string
}

interface SupabaseAuthUser {
  id?: string
  email?: string
}

const AUTH_REQUEST_TIMEOUT_MS = 10_000

function supabaseUrl(): string {
  return String(process.env.NUXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '').replace(/\/+$/, '')
}

function supabaseAnonKey(): string {
  return String(process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '')
}

function bootstrapEmails(): Set<string> {
  return new Set(
    String(process.env.ADMIN_BOOTSTRAP_EMAILS || '')
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(Boolean)
  )
}

function bearerToken(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): string {
  const header = getHeader(event, 'authorization') || ''
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
  if (!url || !anonKey || !token) return null

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
    return null
  }

  if (!response.ok) return null

  const user = await response.json() as SupabaseAuthUser
  const email = String(user.email || '').trim().toLowerCase()
  const id = String(user.id || '').trim()
  if (!email || !id) return null

  return { id, email }
}

export async function requireAdmin(event: Parameters<Parameters<typeof defineEventHandler>[0]>[0]): Promise<AdminUser> {
  const user = await getAuthenticatedUser(bearerToken(event))
  if (!user) {
    throw createError({ statusCode: 401, message: 'AUTH_REQUIRED' })
  }

  const bootstrapped = bootstrapEmails().has(user.email)
  if (bootstrapped) return user

  if (!isDatabaseConfigured()) {
    throw createError({ statusCode: 503, message: 'DATABASE_NOT_CONFIGURED' })
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
    throw createError({ statusCode: 403, message: 'ADMIN_REQUIRED' })
  }

  return user
}
