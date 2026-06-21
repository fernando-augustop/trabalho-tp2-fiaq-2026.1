<template>
  <div class="relative">
    <div
      ref="messagesEl"
      class="fiaq-chat-stream mx-auto flex min-h-[calc(100dvh-18rem)] w-full max-w-7xl flex-col gap-6 px-4 pb-44 pt-6 sm:px-6 lg:px-8"
    >
      <div
        v-if="messages.length === 0"
        class="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <div class="items-center justify-center">
          <img
            src="/sarueBot.png"
            alt="Assistente"
            class="h-12 w-16"
          >
        </div>
        <div>
          <p class="text-lg font-bold text-[#1a2e5a]">
            Olá! Como posso ajudar?
          </p>
          <p class="mt-1 text-sm text-gray-500">
            Pergunte sobre matrícula, TCC, estágio, extensão e muito mais.
          </p>
        </div>
        <div class="mt-2 flex max-w-2xl flex-wrap justify-center gap-2">
          <button
            v-for="suggestion in suggestions"
            :key="suggestion"
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-[#1a2e5a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
            @click="$emit('suggest', suggestion)"
          >
            {{ suggestion }}
          </button>
        </div>
      </div>

      <template
        v-for="msg in messages"
        :key="msg.id"
      >
        <ChatMessageBubble
          :message="msg"
          :all-messages="messages"
          :feedback-disabled="loading"
          @feedback="(messageId, rating) => $emit('feedback', messageId, rating)"
        />
      </template>
      <ChatTypingIndicator v-if="showTyping" />
      <div
        class="h-1"
        aria-hidden="true"
      />
    </div>

    <button
      v-if="showJumpToBottom"
      type="button"
      title="Ir para o fim da conversa"
      class="fixed bottom-40 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1a2e5a] px-4 py-2 text-sm font-bold text-white shadow-lg ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:bottom-36"
      @click="scrollToBottom('smooth')"
    >
      <UIcon
        name="i-lucide-arrow-down"
        class="h-4 w-4"
      />
      Última resposta
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { Message } from '~/composables/useFiaqChat'

const props = defineProps<{
  messages: Message[]
  loading: boolean
}>()

const showTyping = computed(() => {
  const last = props.messages[props.messages.length - 1]
  return !!(last && last.role === 'assistant' && last.streaming && !last.content?.trim())
})

defineEmits<{
  suggest: [text: string]
  feedback: [messageId: number, rating: 'helpful' | 'unhelpful']
}>()

const suggestions = [
  'Quais são as etapas da matrícula?',
  'Como funciona o estágio obrigatório?',
  'Como encontro um orientador de Projeto Final?',
  'Posso migrar de estrutura curricular?'
]

const messagesEl = ref<HTMLElement | null>(null)
const isNearBottom = ref(true)
const showJumpToBottom = computed(() => props.messages.length > 0 && !isNearBottom.value)

function measureBottomDistance() {
  if (!import.meta.client) return 0
  const doc = document.documentElement
  return doc.scrollHeight - window.scrollY - window.innerHeight
}

function handleScroll() {
  isNearBottom.value = measureBottomDistance() < 280
}

async function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  await nextTick()
  window.scrollTo({ top: document.documentElement.scrollHeight, behavior })
  isNearBottom.value = true
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  window.addEventListener('resize', handleScroll)
  handleScroll()
  if (props.loading) scrollToBottom('auto')
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('resize', handleScroll)
})

watch(
  () => props.messages.length,
  () => {
    const last = props.messages[props.messages.length - 1]
    if (props.loading || last?.streaming) {
      scrollToBottom(props.messages.length > 1 ? 'smooth' : 'auto')
    }
  }
)

watch(
  () => props.loading,
  () => {
    if (isNearBottom.value) scrollToBottom('smooth')
  }
)

// Scroll on every token during streaming by watching the last message's content
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    if (isNearBottom.value) scrollToBottom('auto')
  }
)
</script>
