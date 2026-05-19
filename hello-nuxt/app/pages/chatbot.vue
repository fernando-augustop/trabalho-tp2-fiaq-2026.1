<template>
  <div class="min-h-screen bg-[#f4f4f4] font-sans flex flex-col">

    <nav class="bg-[#1a2e5a] px-10 py-4 flex items-center justify-between shrink-0">
      <NuxtLink to="/" class="text-white text-5xl font-black tracking-tight">
        <span class="text-white">f</span><span class="text-green-700">IA</span><span class="text-white">q</span>
      </NuxtLink>
      <div class="flex gap-8 text-white text-sm font-medium">
        <a href="#" class="hover:text-green-400 transition-colors">FAQ</a>
        <NuxtLink to="/" class="hover:text-green-400 transition-colors">Categorias</NuxtLink>
        <a href="#" class="hover:text-green-400 transition-colors">Contato</a>
      </div>
    </nav>

    <div class="bg-[#1a2e5a] px-10 pt-4 pb-6 text-center shrink-0">
      <div class="flex items-center justify-center gap-3">
        <svg class="w-7 h-7 text-green-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
          <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
          <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
          <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
          <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
          <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
          <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
          <path d="M5 10.5H3.5M18.5 10.5H20" stroke="currentColor" stroke-linecap="round"/>
        </svg>

        <h1 class="text-3xl font-extrabold text-white">
          Assistente Virtual
        </h1>
      </div>
    </div>

    <div class="h-px bg-gray-300 mx-10 shrink-0" />

    <!-- Chat area -->
    <div class="flex-1 flex flex-col max-w-3xl w-full mx-auto px-4 py-6 gap-4 overflow-hidden">

      <!-- Messages -->
      <div ref="messagesEl" class="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">

        <!-- Welcome message -->
        <div v-if="messages.length === 0" class="flex flex-col items-center justify-center h-full gap-4 text-center py-12">
          <div class="w-16 h-16 bg-[#1a2e5a] rounded-2xl flex items-center justify-center shadow-md">
            <svg class="w-9 h-9 text-green-400" fill="none" stroke="currentColor" stroke-width="1.6" viewBox="0 0 24 24">
              <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
              <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
              <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
              <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
              <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
              <path d="M5 10.5H3.5M18.5 10.5H20" stroke="currentColor" stroke-linecap="round"/>
            </svg>
          </div>
          <div>
            <p class="font-bold text-[#1a2e5a] text-lg">Olá! Como posso ajudar?</p>
            <p class="text-gray-400 text-sm mt-1">Pergunte sobre matrícula, TCC, estágio, extensão e muito mais.</p>
          </div>
          <!-- Suggestion chips -->
          <div class="flex flex-wrap gap-2 justify-center mt-2">
            <button
              v-for="suggestion in suggestions"
              :key="suggestion"
              @click="sendSuggestion(suggestion)"
              class="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-[#1a2e5a] font-medium hover:border-[#1a2e5a] hover:bg-blue-50 transition-all duration-200 shadow-sm"
            >
              {{ suggestion }}
            </button>
          </div>
        </div>

        <!-- Message bubbles -->
        <template v-for="msg in messages" :key="msg.id">

          <!-- User message -->
          <div v-if="msg.role === 'user'" class="flex justify-end">
            <div class="bg-[#1a2e5a] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[75%] text-sm leading-relaxed shadow-sm">
              {{ msg.content }}
            </div>
          </div>

          <!-- Assistant message -->
          <div v-else class="flex justify-start gap-3">
            <div class="w-8 h-8 bg-[#1a2e5a] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
              <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
                <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
                <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
                <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
                <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
                <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
                <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
              </svg>
            </div>
            <div class="bg-white border border-gray-200 text-[#1a2e5a] rounded-2xl rounded-bl-sm px-5 py-3 max-w-[75%] text-sm leading-relaxed shadow-sm">
              {{ msg.content }}
            </div>
          </div>

        </template>

        <!-- Loading animation -->
        <div v-if="loading" class="flex justify-start gap-3">
          <div class="w-8 h-8 bg-[#1a2e5a] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
            <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
              <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
              <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
              <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
              <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
              <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
              <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
            </svg>
          </div>
          <div class="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-5 py-4 shadow-sm flex items-center gap-1.5">
            <span class="w-2 h-2 bg-[#1a2e5a] rounded-full animate-bounce" style="animation-delay: 0ms" />
            <span class="w-2 h-2 bg-[#1a2e5a] rounded-full animate-bounce" style="animation-delay: 150ms" />
            <span class="w-2 h-2 bg-[#1a2e5a] rounded-full animate-bounce" style="animation-delay: 300ms" />
          </div>
        </div>

      </div>

      <!-- Input bar -->
      <div class="shrink-0">
        <div class="flex w-full rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
          <input
            v-model="input"
            @keydown.enter="sendMessage"
            type="text"
            placeholder="Digite sua pergunta..."
            :disabled="loading"
            class="flex-1 bg-white text-[#1a2e5a] placeholder-gray-400 px-5 py-3.5 text-sm outline-none disabled:opacity-50"
          />
          <button
            @click="sendMessage"
            :disabled="loading || !input.trim()"
            class="bg-[#1a2e5a] text-white font-bold px-6 py-3.5 text-sm hover:bg-[#243d75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M22 2L11 13" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Enviar
          </button>
        </div>
        <p class="text-center text-[10px] text-gray-400 mt-2">Assistente em fase experimental. Pode cometer erros.</p>
      </div>

    </div>

  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const messages = ref([])
const input = ref('')
const loading = ref(false)
const messagesEl = ref(null)

const suggestions = [
  'Como solicitar aproveitamento de disciplina?',
  'Como funciona o TCC?',
  'Quais são os requisitos para estágio?',
  'Como trancar uma matrícula?',
]

let msgId = 0

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

async function sendSuggestion(text) {
  input.value = text
  await sendMessage()
}

async function sendMessage() {
  const text = input.value.trim()
  if (!text || loading.value) return

  messages.value.push({ id: ++msgId, role: 'user', content: text })
  input.value = ''
  loading.value = true
  await scrollToBottom()

  try {
    // TODO: replace with your actual Ollama/API call
    // const res = await fetch('/api/chat', { method: 'POST', body: JSON.stringify({ message: text }) })
    // const data = await res.json()
    // messages.value.push({ id: ++msgId, role: 'assistant', content: data.reply })

    // Placeholder simulated response
    await new Promise(r => setTimeout(r, 1800))
    messages.value.push({
      id: ++msgId,
      role: 'assistant',
      content: 'Esta funcionalidade ainda está em desenvolvimento. Em breve você poderá tirar suas dúvidas aqui!'
    })
  } catch (e) {
    messages.value.push({
      id: ++msgId,
      role: 'assistant',
      content: 'Ocorreu um erro ao processar sua mensagem. Tente novamente.'
    })
  } finally {
    loading.value = false
    await scrollToBottom()
  }
}
</script>

<style scoped>
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}
.animate-bounce {
  animation: bounce 0.8s ease-in-out infinite;
}
</style>
