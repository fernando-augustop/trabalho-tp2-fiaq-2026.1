<template>
  <div ref="messagesEl" class="flex-1 overflow-y-auto flex flex-col gap-4 pr-1">

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
      <div class="flex flex-wrap gap-2 justify-center mt-2">
        <button
          v-for="suggestion in suggestions"
          :key="suggestion"
          @click="$emit('suggest', suggestion)"
          class="bg-white border border-gray-200 rounded-full px-4 py-2 text-xs text-[#1a2e5a] font-medium hover:border-[#1a2e5a] hover:bg-blue-50 transition-all duration-200 shadow-sm"
        >
          {{ suggestion }}
        </button>
      </div>
    </div>

    <template v-for="msg in messages" :key="msg.id">
      <ChatMessageBubble :message="msg" />
    </template>

    <ChatTypingIndicator v-if="showTyping" />

  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import type { Message } from '~/composables/useFiaqChat'

const props = defineProps<{
  messages: Message[]
  loading: boolean
}>()

// Mostra os 3 pontinhos enquanto espera (carregando OU resposta em stream ainda vazia).
const showTyping = computed(() => {
  if (props.loading) return true
  const last = props.messages[props.messages.length - 1]
  return !!(last && last.role === 'assistant' && last.streaming && !last.content?.trim())
})

defineEmits<{
  suggest: [text: string]
}>()

const suggestions = [
  'Como solicitar aproveitamento de disciplina?',
  'Como funciona o TCC?',
  'Quais são os requisitos para estágio?',
  'Como trancar uma matrícula?',
]

const messagesEl = ref<HTMLElement | null>(null)

async function scrollToBottom() {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTop = messagesEl.value.scrollHeight
  }
}

// Scroll whenever a new message arrives or loading starts
watch(() => [props.messages.length, props.loading], scrollToBottom)
</script>
