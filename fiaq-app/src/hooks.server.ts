import type { Handle } from '@sveltejs/kit'
import { loadServerEnv } from '$lib/server/env'
import { bootstrapRag } from '../server/plugins/00.bootstrap-rag'

let bootstrapPromise: Promise<void> | null = null

function ensureRagBootstrap() {
  bootstrapPromise ??= bootstrapRag().catch((error) => {
    bootstrapPromise = null
    console.error('[RAG] Bootstrap falhou:', error)
  })

  return bootstrapPromise
}

export const handle: Handle = async ({ event, resolve }) => {
  loadServerEnv()

  if (event.url.pathname.startsWith('/api/')) {
    await ensureRagBootstrap()
  }

  return resolve(event)
}
