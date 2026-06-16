<template>
  <div class="relative min-h-0 flex-1">
    <div
      ref="messagesEl"
      class="fiaq-chat-scroll flex h-full flex-col gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white/70 px-3 py-4 shadow-sm ring-1 ring-white/60 sm:px-5"
      @scroll="handleScroll"
    >
      <div
        v-if="messages.length === 0"
        class="flex h-full flex-col items-center justify-center gap-4 py-12 text-center"
      >
        <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a2e5a] text-green-300 shadow-md">
          <UIcon
            name="i-lucide-bot"
            class="h-8 w-8"
          />
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
            class="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#1a2e5a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
        <ChatMessageBubble :message="msg" />
      </template>
      <ChatTypingIndicator v-if="showTyping" />
    </div>

    <button
      v-if="showJumpToBottom"
      type="button"
      title="Ir para o fim da conversa"
      class="absolute bottom-4 left-1/2 inline-flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#1a2e5a] px-4 py-2 text-xs font-bold text-white shadow-lg ring-1 ring-white/20 transition-all hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
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
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import type { Message } from '~/composables/useFiaqChat'

const props = defineProps<{
  messages: Message[]
  loading: boolean
}>()

const showTyping = computed(() => {
  if (props.loading) return true
  const last = props.messages[props.messages.length - 1]
  return !!(last && last.role === 'assistant' && last.streaming && !last.content?.trim())
})

defineEmits<{
  suggest: [text: string]
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
  const el = messagesEl.value
  if (!el) return 0
  return el.scrollHeight - el.scrollTop - el.clientHeight
}

function handleScroll() {
  isNearBottom.value = measureBottomDistance() < 120
}

async function scrollToBottom(behavior: ScrollBehavior = 'auto') {
  await nextTick()
  if (messagesEl.value) {
    messagesEl.value.scrollTo({ top: messagesEl.value.scrollHeight, behavior })
    isNearBottom.value = true
  }
}

onMounted(() => {
  scrollToBottom('auto')
})

watch(
  () => props.messages.length,
  () => {
    scrollToBottom(props.messages.length > 1 ? 'smooth' : 'auto')
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

<style scoped>
.fiaq-chat-scroll {
  scrollbar-width: thin;
  scrollbar-color: #94a3b8 transparent;
}

.fiaq-chat-scroll::-webkit-scrollbar {
  width: 10px;
}

.fiaq-chat-scroll::-webkit-scrollbar-thumb {
  background: #94a3b8;
  border: 3px solid transparent;
  border-radius: 999px;
  background-clip: content-box;
}
</style>
