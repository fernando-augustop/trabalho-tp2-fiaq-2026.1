import type { RequestHandler } from './$types'
import { getSupabaseAuthConfig, requireAdmin } from '$lib/server/admin-auth'
import { json, unknownApiError } from '$lib/server/http'

export const GET: RequestHandler = async (event) => {
  try {
    const admin = await requireAdmin(event)
    const config = getSupabaseAuthConfig()

    return json({
      email: admin.email,
      authConfigured: Boolean(config.url && config.anonKey),
      invitesConfigured: Boolean(config.url && config.serviceRoleKey)
    })
  } catch (error) {
    return unknownApiError(error)
  }
}
