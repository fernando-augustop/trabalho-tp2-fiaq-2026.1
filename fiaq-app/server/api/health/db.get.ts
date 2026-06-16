import { getSql, isDatabaseConfigured } from '../../db/index'

export default defineEventHandler(async (event) => {
  if (!isDatabaseConfigured()) {
    setResponseStatus(event, 503)
    return {
      ok: false,
      configured: false,
      message: 'DATABASE_URL não configurada'
    }
  }

  const start = Date.now()
  try {
    const sql = getSql()
    await sql`SELECT 1`
    return {
      ok: true,
      configured: true,
      latency_ms: Date.now() - start
    }
  } catch {
    setResponseStatus(event, 503)
    return {
      ok: false,
      configured: true,
      latency_ms: Date.now() - start,
      message: 'Banco de dados indisponível'
    }
  }
})
