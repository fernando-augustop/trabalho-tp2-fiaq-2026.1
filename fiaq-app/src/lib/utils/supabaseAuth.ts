interface AuthUser {
  id: string
  email: string
}

export interface AdminSession {
  accessToken: string
  refreshToken: string
  expiresAt: number
  user: AuthUser
}

interface SupabaseAuthConfig {
  url: string
  anonKey: string
}

interface TokenResponse {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    id?: string
    email?: string
  }
}

const STORAGE_KEY = 'fiaq:admin-session:v1'

function config(): SupabaseAuthConfig {
  const publicConfig = getPublicConfig()
  return {
    url: String(publicConfig.supabaseUrl || '').replace(/\/+$/, ''),
    anonKey: String(publicConfig.supabaseAnonKey || '')
  }
}

function normalizeSession(payload: TokenResponse): AdminSession {
  const accessToken = String(payload.access_token || '')
  const refreshToken = String(payload.refresh_token || '')
  const userId = String(payload.user?.id || '')
  const email = String(payload.user?.email || '').trim().toLowerCase()

  if (!accessToken || !refreshToken || !userId || !email) {
    throw new Error('AUTH_INVALID_RESPONSE')
  }

  return {
    accessToken,
    refreshToken,
    expiresAt: Date.now() + Math.max(Number(payload.expires_in || 3600) - 60, 60) * 1000,
    user: { id: userId, email }
  }
}

async function authFetch(path: string, options: RequestInit = {}) {
  const { url, anonKey } = config()
  if (!url || !anonKey) throw new Error('AUTH_NOT_CONFIGURED')

  return fetch(`${url}/auth/v1${path}`, {
    ...options,
    headers: {
      'apikey': anonKey,
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
}

export function loadAdminSession(): AdminSession | null {
  if (typeof window === "undefined") return null

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null

    const parsed = JSON.parse(raw) as AdminSession
    if (!parsed.accessToken || !parsed.refreshToken || !parsed.user?.email) return null
    return parsed
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function saveAdminSession(session: AdminSession): void {
  if (typeof window !== "undefined") localStorage.setItem(STORAGE_KEY, JSON.stringify(session))
}

export function clearAdminSession(): void {
  if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY)
}

export async function signInAdmin(email: string, password: string): Promise<AdminSession> {
  const response = await authFetch('/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(payload.error_description || payload.message || 'LOGIN_FAILED'))

  const session = normalizeSession(payload)
  saveAdminSession(session)
  return session
}

export async function refreshAdminSession(session: AdminSession): Promise<AdminSession> {
  if (Date.now() < session.expiresAt) return session

  const response = await authFetch('/token?grant_type=refresh_token', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: session.refreshToken })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(payload.error_description || payload.message || 'REFRESH_FAILED'))

  const nextSession = normalizeSession(payload)
  saveAdminSession(nextSession)
  return nextSession
}

export function readInviteSessionFromHash(): AdminSession | null {
  if (typeof window === "undefined" || !window.location.hash) return null

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''))
  const type = params.get('type')
  if (type !== 'invite') return null

  const payload: TokenResponse = {
    access_token: params.get('access_token') || undefined,
    refresh_token: params.get('refresh_token') || undefined,
    expires_in: Number(params.get('expires_in') || 3600),
    user: {
      id: params.get('user_id') || 'invited-user',
      email: params.get('email') || ''
    }
  }

  if (!payload.user?.email) {
    const decoded = decodeJwtPayload(payload.access_token || '')
    payload.user = {
      id: String(decoded.sub || 'invited-user'),
      email: String(decoded.email || '')
    }
  }

  const session = normalizeSession(payload)
  window.history.replaceState(null, '', window.location.pathname)
  return session
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split('.')[1]
    if (!payload) return {}
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
    const padding = (4 - normalized.length % 4) % 4
    return JSON.parse(atob(normalized.padEnd(normalized.length + padding, '=')))
  } catch {
    return {}
  }
}

export async function updateAdminPassword(session: AdminSession, password: string): Promise<void> {
  const response = await authFetch('/user', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${session.accessToken}` },
    body: JSON.stringify({ password })
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(String(payload.error_description || payload.message || 'PASSWORD_UPDATE_FAILED'))
}

export async function signOutAdmin(session: AdminSession | null): Promise<void> {
  if (session?.accessToken) {
    await authFetch('/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.accessToken}` }
    }).catch(() => {})
  }

  clearAdminSession()
}
import { getPublicConfig } from '$lib/config/public'
