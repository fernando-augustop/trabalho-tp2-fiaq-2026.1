interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const { body, ...requestOptions } = options
  const init: RequestInit = {
    ...requestOptions,
    headers
  }

  if (body !== undefined) {
    headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  const response = await fetch(url, init)
  const contentType = response.headers.get('Content-Type') || ''
  const payload = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : await response.text().catch(() => '')

  if (!response.ok) {
    const message = payload && typeof payload === 'object' && 'message' in payload
      ? String(payload.message)
      : typeof payload === 'string' && payload
        ? payload
        : `HTTP ${response.status}`

    throw new Error(message)
  }

  return payload as T
}
