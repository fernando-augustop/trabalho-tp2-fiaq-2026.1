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
        <div class="flex items-center justify-center">
          <img
            src="/sarueBot.png"
            alt="Saruê, assistente virtual do fIAq"
            class="h-20 w-20 object-contain"
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
      <ChatTypingIndicator
        v-if="typingMessage"
        :message="typingMessage"
      />
      <div
        ref="bottomSentinel"
        class="h-1"
        aria-hidden="true"
      />
    </div>

    <button
      v-if="showJumpToBottom"
      type="button"
      title="Ir para o fim da conversa"
      class="fixed bottom-28 left-1/2 z-40 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1a2e5a] px-4 py-2 text-sm font-bold text-white shadow-lg ring-1 ring-white/20 transition-all hover:-translate-y-0.5 hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 sm:bottom-32"
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

const typingMessage = computed(() => {
  const last = props.messages[props.messages.length - 1]
  return last && last.role === 'assistant' && last.streaming && !last.content?.trim()
    ? last
    : null
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
const bottomSentinel = ref<HTMLElement | null>(null)
const isNearBottom = ref(true)
const showJumpToBottom = computed(() => props.messages.length > 0 && !isNearBottom.value)
const shouldFollowStream = ref(true)
let scrollFrame: number | null = null
let programmaticScrollUntil = 0

function measureBottomDistance() {
  if (!import.meta.client) return 0
  const doc = document.documentElement
  return doc.scrollHeight - window.scrollY - window.innerHeight
}

function handleScroll() {
  const nearBottom = measureBottomDistance() < 320
  isNearBottom.value = nearBottom

  if (nearBottom) {
    shouldFollowStream.value = true
    return
  }

  if (Date.now() > programmaticScrollUntil) {
    shouldFollowStream.value = false
  }
}

async function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  await nextTick()
  programmaticScrollUntil = Date.now() + 280
  ;(bottomSentinel.value ?? messagesEl.value)?.scrollIntoView({ block: 'end', behavior })
  isNearBottom.value = true
}

function queueFollowScroll() {
  if (!import.meta.client || !shouldFollowStream.value || scrollFrame !== null) return

  scrollFrame = window.requestAnimationFrame(() => {
    scrollFrame = null
    if (shouldFollowStream.value) void scrollToBottom('auto')
  })
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
  if (scrollFrame !== null) window.cancelAnimationFrame(scrollFrame)
})

watch(
  () => props.messages.length,
  () => {
    const last = props.messages[props.messages.length - 1]
    if (!last) return

    if (last.role === 'user') {
      shouldFollowStream.value = true
      void scrollToBottom('smooth')
      return
    }

    if (last.streaming && shouldFollowStream.value) {
      void scrollToBottom(props.messages.length > 1 ? 'smooth' : 'auto')
    }
  }
)

watch(
  () => props.loading,
  () => {
    if (props.loading && isNearBottom.value) {
      shouldFollowStream.value = true
      void scrollToBottom('smooth')
    }
  }
)

// Durante o streaming, acompanhe a resposta apenas se o usuário ainda estiver no fim.
// Se ele rolar para cima, o botão "Última resposta" assume esse controle.
watch(
  () => props.messages[props.messages.length - 1]?.content,
  () => {
    queueFollowScroll()
  }
)
</script>
