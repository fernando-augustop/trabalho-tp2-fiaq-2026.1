export function getPublicConfig() {
  return {
    supabaseUrl: String(import.meta.env.VITE_SUPABASE_URL || import.meta.env.NUXT_PUBLIC_SUPABASE_URL || '').replace(/\/+$/, ''),
    supabaseAnonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NUXT_PUBLIC_SUPABASE_ANON_KEY || '')
  }
}
