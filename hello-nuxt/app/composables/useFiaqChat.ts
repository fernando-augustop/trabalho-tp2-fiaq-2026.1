import { ref } from 'vue'

export type MessageRole = 'user' | 'assistant'

export interface Message {
  id: number
  role: MessageRole
  content: string
}

let msgId = 0

export function useFiaqChat() {
  const messages = ref<Message[]>([])
  const loading = ref(false)

  async function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed || loading.value) return

    messages.value.push({ id: ++msgId, role: 'user', content: trimmed })
    loading.value = true

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.value.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const data = await res.json()
      messages.value.push({ id: ++msgId, role: 'assistant', content: data.reply })

      await new Promise(r => setTimeout(r, 1800))
      messages.value.push({
        id: ++msgId,
        role: 'assistant',
        content: 'Esta funcionalidade ainda está em desenvolvimento. Em breve você poderá tirar suas dúvidas aqui!'
      })
    } catch {
      messages.value.push({
        id: ++msgId,
        role: 'assistant',
        content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.'
      })
    } finally {
      loading.value = false
    }
  }

  return { messages, loading, sendMessage }
}
