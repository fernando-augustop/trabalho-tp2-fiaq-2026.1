function jsonHeaders(headers?: HeadersInit): Headers {
  const nextHeaders = new Headers(headers)
  if (!nextHeaders.has('Content-Type')) {
    nextHeaders.set('Content-Type', 'application/json; charset=utf-8')
  }
  return nextHeaders
}

function isSafeApiStatus(status: number): boolean {
  return Number.isInteger(status) && status >= 400 && status <= 599
}

function isSafeApiMessage(message: string): boolean {
  return /^[A-Z0-9_:-]{3,80}$/.test(message)
}

export function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    ...init,
    headers: jsonHeaders(init?.headers)
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

    if (isSafeApiStatus(status) && isSafeApiMessage(message)) {
      return apiError(status, message)
    }
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
