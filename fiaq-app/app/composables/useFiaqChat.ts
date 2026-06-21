import { onMounted, ref, watch } from 'vue'

export type MessageRole = 'user' | 'assistant'

export interface Source {
  id: string
  titulo: string
  url: string
  kind?: 'rag' | 'web' | 'official'
  description?: string
}

export interface Message {
  id: number
  role: MessageRole
  content: string
  streaming?: boolean
  sources?: Source[]
  feedback?: 'helpful' | 'unhelpful'
  webEnhanced?: boolean
}

export type MessageDraft = Omit<Message, 'id'> & { id?: number }

let msgId = 0
const STORAGE_KEY = 'fiaq:temporary-conversation:v1'

function normalizeMessages(nextMessages: MessageDraft[]): Message[] {
  return nextMessages
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
          url: String(source.url || '').trim(),
          kind: (source.kind === 'web' || source.kind === 'official' ? source.kind : 'rag') as Source['kind'],
          description: String(source.description || '').trim() || undefined
        }))

      return {
        id: ++msgId,
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content,
        streaming: false,
        sources: sources.length ? sources : undefined,
        feedback: message.feedback === 'helpful' || message.feedback === 'unhelpful' ? message.feedback : undefined,
        webEnhanced: Boolean(message.webEnhanced)
      }
    })
    .filter((message): message is Message => Boolean(message))
}

export function useFiaqChat() {
  const messages = ref<Message[]>([])
  const loading = ref(false)

  onMounted(() => {
    const saved = sessionStorage.getItem(STORAGE_KEY)
    if (!saved) return

    try {
      const parsed = JSON.parse(saved)
      const rawMessages = Array.isArray(parsed) ? parsed : parsed?.messages
      if (Array.isArray(rawMessages)) messages.value = normalizeMessages(rawMessages)
    } catch {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  })

  if (import.meta.client) {
    watch(
      messages,
      (nextMessages) => {
        const stableMessages = nextMessages
          .filter(message => message.content.trim())
          .map(message => ({
            role: message.role,
            content: message.content,
            sources: message.sources,
            feedback: message.feedback,
            webEnhanced: message.webEnhanced
          }))

        if (!stableMessages.length) {
          sessionStorage.removeItem(STORAGE_KEY)
          return
        }

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          app: 'fiaq',
          kind: 'temporary-conversation',
          version: 1,
          messages: stableMessages
        }))
      },
      { deep: true }
    )
  }

  function updateAssistantMessage(messageId: number, patch: Partial<Message>) {
    const idx = messages.value.findIndex(message => message.id === messageId && message.role === 'assistant')
    if (idx >= 0) {
      messages.value[idx] = { ...messages.value[idx], ...patch } as Message
    }
  }

  async function streamAssistant(endpoint: string, payload: object, assistantId: number) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })

    if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`)

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
            updateAssistantMessage(assistantId, { content: accumulatedContent })
          }

          if (event.type === 'sources') {
            updateAssistantMessage(assistantId, { sources: event.items })
          }

          if (event.type === 'done') {
            updateAssistantMessage(assistantId, { streaming: false })
            loading.value = false
          }

          if (event.type === 'error') {
            updateAssistantMessage(assistantId, {
              content: accumulatedContent || 'Ocorreu um erro ao processar sua mensagem. Tente novamente.',
              streaming: false
            })
            loading.value = false
          }
        } catch {
          // evento SSE parcial/malformado — ignora esta linha
        }
      }
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    messages.value.push({ id: ++msgId, role: 'user', content: trimmed })
    loading.value = true

    const assistantId = ++msgId
    messages.value.push({ id: assistantId, role: 'assistant', content: '', streaming: true })

    // Snapshot the history to send (exclude the empty assistant message)
    const history = messages.value
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await streamAssistant('/api/chat', { messages: history }, assistantId)
    } catch {
      updateAssistantMessage(assistantId, {
        content: 'Ocorreu um erro ao enviar sua mensagem. Tente novamente.',
        streaming: false
      })
    } finally {
      updateAssistantMessage(assistantId, { streaming: false })
      loading.value = false
    }
  }

  function findUserQuestionBefore(assistantId: number): Message | null {
    const assistantIndex = messages.value.findIndex(message => message.id === assistantId)
    if (assistantIndex <= 0) return null

    for (let idx = assistantIndex - 1; idx >= 0; idx--) {
      const message = messages.value[idx]
      if (message?.role === 'user') return message
    }

    return null
  }

  async function persistFeedback(
    question: Message,
    answer: Message,
    rating: 'helpful' | 'unhelpful',
    webSearchRequested: boolean
  ) {
    try {
      await fetch('/api/chat/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: question.content,
          answer: answer.content,
          rating,
          sources: answer.sources ?? [],
          webSearchRequested
        })
      })
    } catch {
      // Feedback é auxiliar: falha de persistência não deve travar a conversa.
    }
  }

  async function requestWebAnswer(question: Message, previousAnswer: Message) {
    if (loading.value) return

    loading.value = true
    const assistantId = ++msgId
    messages.value.push({
      id: assistantId,
      role: 'assistant',
      content: '',
      streaming: true,
      webEnhanced: true
    })

    const history = messages.value
      .slice(0, -1)
      .map(m => ({ role: m.role, content: m.content }))

    try {
      await streamAssistant('/api/chat/web', {
        question: question.content,
        previousAnswer: previousAnswer.content,
        messages: history
      }, assistantId)
    } catch {
      updateAssistantMessage(assistantId, {
        content: 'Não consegui buscar fontes adicionais agora. Tente novamente em alguns instantes.',
        streaming: false
      })
    } finally {
      updateAssistantMessage(assistantId, { streaming: false })
      loading.value = false
    }
  }

  async function rateMessage(messageId: number, rating: 'helpful' | 'unhelpful') {
    if (loading.value) return

    const answer = messages.value.find(message => message.id === messageId && message.role === 'assistant')
    if (!answer || answer.streaming || !answer.content.trim()) return

    const question = findUserQuestionBefore(messageId)
    if (!question) return

    updateAssistantMessage(messageId, { feedback: rating })
    await persistFeedback(question, answer, rating, rating === 'unhelpful')

    if (rating === 'unhelpful' && !answer.webEnhanced) {
      await requestWebAnswer(question, answer)
    }
  }

  function replaceMessages(nextMessages: MessageDraft[]) {
    messages.value = normalizeMessages(nextMessages)
  }

  function clearMessages() {
    messages.value = []
    sessionStorage.removeItem(STORAGE_KEY)
  }

  return { messages, loading, sendMessage, rateMessage, replaceMessages, clearMessages }
}
