// ─── Configuração de providers ──────────────────────────────────────────────
// Por padrão tudo roda local via Ollama. Para usar o OpenRouter, defina no .env:
//   OPENROUTER_API_KEY=sk-or-...
//   CHAT_PROVIDER=openrouter
//   EMBED_PROVIDER=openrouter   (opcional — ver ressalva sobre embeddings)
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434'
const CHAT_MODEL = process.env.OLLAMA_CHAT_MODEL || 'qwen2.5:7b'
const EMBED_MODEL = process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || ''
const OPENROUTER_CHAT_MODEL = process.env.OPENROUTER_CHAT_MODEL || 'openrouter/owl-alpha'
const OPENROUTER_EMBED_MODEL = process.env.OPENROUTER_EMBED_MODEL || 'nvidia/llama-nemotron-embed-vl-1b-v2:free'

const CHAT_PROVIDER = (process.env.CHAT_PROVIDER || 'ollama').toLowerCase()
const EMBED_PROVIDER = (process.env.EMBED_PROVIDER || 'ollama').toLowerCase()

// URL pública do app — usada no header HTTP-Referer do OpenRouter (atribuição).
// Na Vercel usa VERCEL_URL automaticamente; localmente cai no localhost.
const APP_URL = process.env.APP_URL
  || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')

// Identifica o modelo de embedding ativo — usado para gravar/consultar o RAG
// no banco e validar o fallback JSON (modelos diferentes são incompatíveis).
export const embedInfo = {
  provider: EMBED_PROVIDER,
  model: EMBED_PROVIDER === 'openrouter' ? OPENROUTER_EMBED_MODEL : EMBED_MODEL
}

// Cabeçalhos exigidos pelo OpenRouter (Referer/Title são opcionais mas recomendados).
function openRouterHeaders(): Record<string, string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OPENROUTER_API_KEY não definido no .env')
  }
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': APP_URL,
    'X-Title': 'fIAq'
  }
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
}

// ─── Chat (não-streaming) ─────────────────────────────────────────────────────
export async function chat(messages: ChatMessage[]): Promise<string> {
  if (CHAT_PROVIDER === 'openrouter') {
    const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
      method: 'POST',
      headers: openRouterHeaders(),
      body: JSON.stringify({ model: OPENROUTER_CHAT_MODEL, messages, stream: false })
    })
    if (!res.ok) throw new Error(`OpenRouter chat error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    return data.choices?.[0]?.message?.content ?? ''
  }

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: CHAT_MODEL, messages, stream: false })
  })

  if (!res.ok) throw new Error(`Ollama chat error: ${res.status}`)

  const data = await res.json()
  return data?.message?.content ?? ''
}

// ─── Chat (streaming) ─────────────────────────────────────────────────────────
export async function chatStream(messages: ChatMessage[]): Promise<ReadableStream<string>> {
  if (CHAT_PROVIDER === 'openrouter') {
    return openRouterChatStream(messages)
  }

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
        let enqueued = false

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue

          try {
            const json = JSON.parse(trimmed)

            if (json.done === false && json.message?.content) {
              controller.enqueue(json.message.content)
              enqueued = true
            }
          } catch {
            // linha parcial/incompleta no buffer — ignora e aguarda a próxima
          }
        }

        if (enqueued) return
      }
    }
  })
}

// Streaming no formato OpenAI/SSE usado pelo OpenRouter:
//   data: {"choices":[{"delta":{"content":"..."}}]}\n\n
//   data: [DONE]
async function openRouterChatStream(messages: ChatMessage[]): Promise<ReadableStream<string>> {
  const res = await fetch(`${OPENROUTER_URL}/chat/completions`, {
    method: 'POST',
    headers: openRouterHeaders(),
    body: JSON.stringify({ model: OPENROUTER_CHAT_MODEL, messages, stream: true })
  })

  if (!res.ok) throw new Error(`OpenRouter stream error: ${res.status} ${await res.text()}`)
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
        let enqueued = false

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue

          const payload = trimmed.slice(5).trim()
          if (payload === '[DONE]') {
            controller.close()
            return
          }

          try {
            const json = JSON.parse(payload)
            const content = json.choices?.[0]?.delta?.content

            if (content) {
              controller.enqueue(content)
              enqueued = true
            }
          } catch {
            // chunk SSE parcial — ignora e aguarda completar no próximo read
          }
        }

        if (enqueued) return
      }
    }
  })
}

// ─── Embeddings ───────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

// O tier free do OpenRouter às vezes devolve respostas transitórias sem o vetor
// (ou 429). Tentamos algumas vezes com backoff antes de desistir.
export async function embed(text: string): Promise<number[]> {
  const attempts = EMBED_PROVIDER === 'openrouter' ? 4 : 1
  let lastErr: unknown

  for (let i = 0; i < attempts; i++) {
    try {
      return await embedOnce(text)
    } catch (e) {
      lastErr = e
      if (i < attempts - 1) await sleep(800 * (i + 1))
    }
  }
  throw lastErr
}

async function embedOnce(text: string): Promise<number[]> {
  if (EMBED_PROVIDER === 'openrouter') {
    const res = await fetch(`${OPENROUTER_URL}/embeddings`, {
      method: 'POST',
      headers: openRouterHeaders(),
      body: JSON.stringify({ model: OPENROUTER_EMBED_MODEL, input: text })
    })
    if (!res.ok) throw new Error(`OpenRouter embed error: ${res.status} ${await res.text()}`)
    const data = await res.json()
    const vector = data.data?.[0]?.embedding
    if (!Array.isArray(vector)) throw new Error('OpenRouter embed: resposta sem embedding')
    return vector
  }

  const res = await fetch(`${OLLAMA_URL}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBED_MODEL, prompt: text })
  })

  if (!res.ok) throw new Error(`Ollama embed error: ${res.status}`)

  const data = await res.json()
  return data.embedding
}
