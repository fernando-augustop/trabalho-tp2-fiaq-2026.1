export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...(init?.headers || {})
    }
  })
}

export function apiError(status: number, message: string) {
  return json({ status, message }, { status })
}

export function unknownApiError(error: unknown) {
  if (error && typeof error === 'object') {
    const maybe = error as { status?: unknown, statusCode?: unknown, message?: unknown }
    const status = Number(maybe.status || maybe.statusCode || 500)
    const message = String(maybe.message || 'INTERNAL_ERROR')
    return apiError(Number.isFinite(status) ? status : 500, message)
  }

  return apiError(500, 'INTERNAL_ERROR')
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return await request.json() as T
  } catch {
    return null
  }
}
