export function getPublicConfig() {
  return {
    supabaseUrl: String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, ''),
    supabaseAnonKey: String(import.meta.env.VITE_SUPABASE_ANON_KEY || '')
  }
}
