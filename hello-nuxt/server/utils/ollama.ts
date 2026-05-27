const OLLAMA_URL = 'http://localhost:11434'
const CHAT_MODEL = 'phi3:mini'
const EMBED_MODEL = 'nomic-embed-text'

export interface OllamaMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// Non-streaming chat — used for testing
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

// Streaming chat — used by the real endpoint
export async function ollamaChatStream(messages: OllamaMessage[]): Promise<ReadableStream<string>> {
  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: true })
  })

  if (!res.ok) throw new Error(`Ollama stream error: ${res.status}`)
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  return new ReadableStream<string>({
    async pull(controller) {
      const { done, value } = await reader.read()
      if (done) {
        controller.close()
        return
      }

      // Ollama streams one JSON object per line
      const lines = decoder.decode(value).split('\n').filter(Boolean)
      for (const line of lines) {
        try {
          const json = JSON.parse(line)
          if (json.message?.content) {
            controller.enqueue(json.message.content)
          }
        } catch {
          // skip malformed lines
        }
      }
    }
  })
}

// Generate embedding vector for a string
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
