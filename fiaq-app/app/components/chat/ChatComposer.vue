<template>
  <div class="shrink-0">
    <div class="flex w-full items-end gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-md ring-1 ring-white/70">
      <textarea
        ref="textareaEl"
        v-model="text"
        rows="1"
        placeholder="Digite sua pergunta..."
        :disabled="disabled"
        class="max-h-36 min-h-11 flex-1 resize-none bg-transparent px-3 py-3 text-sm leading-5 text-[#1a2e5a] outline-none placeholder:text-slate-400 disabled:opacity-50"
        @input="resize"
        @keydown="handleKeydown"
      />
      <button
        :disabled="disabled || !text.trim()"
        title="Enviar pergunta"
        class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1a2e5a] text-white transition-colors hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-40"
        @click="handleSend"
      >
        <UIcon
          name="i-lucide-send"
          class="h-4 w-4"
        />
      </button>
    </div>
    <p class="mt-2 text-center text-[10px] text-gray-400">
      Assistente em fase experimental. Confira informações importantes nas fontes.
    </p>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref } from 'vue'

defineProps<{ disabled: boolean }>()

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')
const textareaEl = ref<HTMLTextAreaElement | null>(null)

function resize() {
  const el = textareaEl.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 144)}px`
}

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('send', trimmed)
  text.value = ''
  nextTick(resize)
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.altKey || event.metaKey || event.ctrlKey) return
  event.preventDefault()
  handleSend()
}
</script>
