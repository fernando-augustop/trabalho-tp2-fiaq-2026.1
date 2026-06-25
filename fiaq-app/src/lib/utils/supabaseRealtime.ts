import {
  createClient,
  type RealtimeChannel,
  type RealtimePostgresChangesPayload
} from '@supabase/supabase-js'
import type { AdminSession } from '$lib/utils/supabaseAuth'

export type AdminCurationRealtimeStatus
  = | 'connecting'
    | 'connected'
    | 'closed'
    | 'timed_out'
    | 'error'

export interface AdminCurationRealtimeRecord {
  id?: number
  pergunta?: string
  resposta?: string
  fontes_usadas?: unknown
  motivo_busca_web?: string
  status?: string
  dthr_criacao?: string
  dthr_atualizacao?: string
  [key: string]: unknown
}

export type AdminCurationRealtimePayload = RealtimePostgresChangesPayload<AdminCurationRealtimeRecord>

interface AdminCurationRealtimeOptions {
  url: string
  anonKey: string
  getSession: () => AdminSession | null
  onChange: (payload: AdminCurationRealtimePayload) => void
  onStatus: (status: AdminCurationRealtimeStatus, error?: Error) => void
}

export interface AdminCurationRealtimeSubscription {
  refreshAuth: () => Promise<void>
  unsubscribe: () => Promise<void>
}

export function subscribeAdminCurationRealtime(options: AdminCurationRealtimeOptions): AdminCurationRealtimeSubscription {
  const client = createClient(options.url, options.anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    accessToken: async () => options.getSession()?.accessToken ?? null,
    realtime: {
      params: { eventsPerSecond: 6 }
    }
  })

  let closed = false
  let channel: RealtimeChannel | null = null

  options.onStatus('connecting')

  channel = client
    .channel(`fiaq-admin-curadoria:${options.getSession()?.user.id || 'admin'}`)
    .on<AdminCurationRealtimeRecord>(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'web_resposta_candidata' },
      payload => options.onChange(payload)
    )

  void client.realtime.setAuth(options.getSession()?.accessToken ?? null).finally(() => {
    if (closed || !channel) return

    channel.subscribe((status, error) => {
      if (closed) return

      if (status === 'SUBSCRIBED') {
        options.onStatus('connected')
        return
      }

      if (status === 'TIMED_OUT') {
        options.onStatus('timed_out', error)
        return
      }

      if (status === 'CHANNEL_ERROR') {
        options.onStatus('error', error)
        return
      }

      if (status === 'CLOSED') {
        options.onStatus('closed', error)
      }
    })
  })

  return {
    refreshAuth: async () => {
      await client.realtime.setAuth(options.getSession()?.accessToken ?? null)
    },
    unsubscribe: async () => {
      closed = true
      options.onStatus('closed')
      if (channel) await client.removeChannel(channel).catch(() => 'error')
    }
  }
}
