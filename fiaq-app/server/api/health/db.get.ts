import sql from '../../db/index'

export default defineEventHandler(async () => {
  const start = Date.now()
  await sql`SELECT 1`
  return {
    ok: true,
    latency_ms: Date.now() - start,
  }
})
