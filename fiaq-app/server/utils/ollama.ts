const OLLAMA_URL = 'http://localhost:11434'
const CHAT_MODEL = 'qwen2.5:7b'
const EMBED_MODEL = 'nomic-embed-text'

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function ollamaChat(messages: OllamaMessage[]): Promise<string> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: false })
  })

  if (!res.ok) throw new Error(`Ollama chat error: ${res.status}`)

  const data = await res.json()
  return data.message.content
}

export async function ollamaChatStream(messages: OllamaMessage[]): Promise<ReadableStream<string>> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // keep_alive mantém o modelo carregado na GPU entre mensagens (evita recarregar).
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true, keep_alive: '30m' })
  })

  if (!res.ok) throw new Error(`Ollama stream error: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  return new ReadableStream<string>({
    async pull(controller) {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          controller.close()
          return
        }
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')

        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const json = JSON.parse(trimmed)

            if (json.done === false && json.message?.content) {
              controller.enqueue(json.message.content)
              return
            }
          } catch {
          }
        }
      }
    }
  })
}

export async function embed(text: string): Promise<number[]> {
  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
  })

  if (!res.ok) throw new Error(`Ollama embed error: ${res.status}`)

  const data = await res.json()
  return data.embedding
}
