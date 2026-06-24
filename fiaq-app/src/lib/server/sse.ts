export interface SseWriter {
  send: (data: object) => void
  close: () => void
  error: (error: unknown) => void
  signal: AbortSignal
}

export function eventStream(work: (writer: SseWriter) => Promise<void> | void): Response {
  const encoder = new TextEncoder()
  const abort = new AbortController()
  let closed = false

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const writer: SseWriter = {
        signal: abort.signal,
        send(data) {
          if (closed) return
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        },
        close() {
          if (closed) return
          closed = true
          controller.close()
        },
        error(error) {
          if (closed) return
          closed = true
          controller.error(error)
        }
      }

      Promise.resolve(work(writer))
        .catch(error => writer.error(error))
        .finally(() => writer.close())
    },
    cancel() {
      closed = true
      abort.abort()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  })
}
