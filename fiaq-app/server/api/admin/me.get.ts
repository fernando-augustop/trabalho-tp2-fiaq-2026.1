import { getSupabaseAuthConfig, requireAdmin } from '../../utils/adminAuth'

export default defineEventHandler(async (event) => {
  const admin = await requireAdmin(event)
  const config = getSupabaseAuthConfig()

  return {
    email: admin.email,
    authConfigured: Boolean(config.url && config.anonKey),
    invitesConfigured: Boolean(config.url && config.serviceRoleKey)
  }
})
