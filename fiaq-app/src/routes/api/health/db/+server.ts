import type { RequestHandler } from './$types'
import { getSql, isDatabaseConfigured } from '../../../../../server/db'
import { json } from '$lib/server/http'

export const GET: RequestHandler = async () => {
  if (!isDatabaseConfigured()) {
    return json({
      ok: false,
      configured: false,
      message: 'DATABASE_URL não configurada'
    }, { status: 503 })
  }

  const start = Date.now()
  try {
    const sql = getSql()
    await sql`SELECT 1`
    return json({
      ok: true,
      configured: true,
      latency_ms: Date.now() - start
    })
  } catch {
    return json({
      ok: false,
      configured: true,
      latency_ms: Date.now() - start,
      message: 'Banco de dados indisponível'
    }, { status: 503 })
  }
}
