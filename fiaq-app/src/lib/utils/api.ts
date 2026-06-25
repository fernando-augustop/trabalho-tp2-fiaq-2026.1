interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

function isRawBodyInit(body: unknown): body is BodyInit {
  if (typeof body === 'string') return true
  if (body instanceof URLSearchParams) return true
  if (body instanceof FormData) return true
  if (body instanceof Blob) return true
  if (body instanceof ArrayBuffer) return true
  if (ArrayBuffer.isView(body)) return true
  if (typeof ReadableStream !== 'undefined' && body instanceof ReadableStream) return true
  return false
}

export async function apiFetch<T>(url: string, options: ApiFetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers)
  const { body, ...requestOptions } = options
  const init: RequestInit = {
    ...requestOptions,
    headers
  }

  if (body !== undefined) {
    if (isRawBodyInit(body)) {
      init.body = body
    } else {
      headers.set('Content-Type', headers.get('Content-Type') || 'application/json')
      init.body = JSON.stringify(body)
    }
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
