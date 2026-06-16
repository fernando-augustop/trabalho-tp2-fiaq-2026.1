import { ref } from 'vue'

export type MessageRole = 'user' | 'assistant'

export interface Source {
  id: string
  titulo: string
  url: string
}

export interface Message {
  id: number
  role: MessageRole
  content: string
  streaming?: boolean
  sources?: Source[]
}

export type MessageDraft = Omit<Message, 'id'> & { id?: number }

let msgId = 0

export function useFiaqChat() {
  const messages = ref<Message[]>([])
  const loading = ref(false)

  function updateLastAssistantMessage(patch: Partial<Message>) {
    const idx = messages.value.length - 1
    if (idx >= 0 && messages.value[idx]?.role === 'assistant') {
      messages.value[idx] = { ...messages.value[idx], ...patch } as Message
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    messages.value.push({ id: ++msgId, role: 'user', content: trimmed })
    loading.value = true

    messages.value.push({ id: ++msgId, role: 'assistant', content: '', streaming: true })

    // Snapshot the history to send (exclude the empty assistant message)
    const history = messages.value
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history })
      })

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

      loading.value = false

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let accumulatedContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue

          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'token') {
              accumulatedContent += event.content
              updateLastAssistantMessage({ content: accumulatedContent })
            }

            if (event.type === 'sources') {
              updateLastAssistantMessage({ sources: event.items })
            }

            if (event.type === 'done') {
              updateLastAssistantMessage({ streaming: false })
            }

            if (event.type === 'error') {
              updateLastAssistantMessage({
                content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
                streaming: false
              })
            }
          } catch {
            // evento SSE parcial/malformado — ignora esta linha
          }
        }
      }
    } catch {
      updateLastAssistantMessage({
        content: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
        streaming: false
      })
    } finally {
      updateLastAssistantMessage({ streaming: false })
      loading.value = false
    }
  }

  function replaceMessages(nextMessages: MessageDraft[]) {
    const normalized = nextMessages
      .map((message): Message | null => {
        const content = String(message.content ?? '').trim()
        if (!content) return null

        const sources = (message.sources ?? [])
          .filter((source) => {
            const titulo = String(source.titulo || '').trim()
            const url = String(source.url || '').trim()
            return Boolean(titulo || url)
          })
          .map(source => ({
            id: String(source.id || source.url || source.titulo || 'fonte'),
            titulo: String(source.titulo || 'Fonte oficial').trim() || 'Fonte oficial',
            url: String(source.url || '').trim()
          }))

        return {
          id: ++msgId,
          role: message.role === 'assistant' ? 'assistant' : 'user',
          content,
          streaming: false,
          sources: sources.length ? sources : undefined
        }
      })
      .filter((message): message is Message => Boolean(message))

    messages.value = normalized
  }

  return { messages, loading, sendMessage, replaceMessages }
}
