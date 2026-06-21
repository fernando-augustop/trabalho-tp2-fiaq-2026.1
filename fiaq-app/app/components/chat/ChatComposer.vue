<template>
  <div class="shrink-0">
    <div class="group flex w-full items-end gap-2 rounded-[1.35rem] border border-slate-200 bg-white/95 p-2.5 shadow-[0_16px_44px_rgba(15,23,42,0.12)] ring-1 ring-white/70 transition-all focus-within:border-[#00a155] focus-within:ring-4 focus-within:ring-[#00a155]/15">
      <span class="mb-2.5 hidden h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-[#1a2e5a] transition-colors group-focus-within:bg-emerald-50 group-focus-within:text-[#00a155] sm:flex">
        <UIcon
          name="i-lucide-message-circle"
          class="h-5 w-5"
        />
      </span>
      <textarea
        ref="textareaEl"
        v-model="text"
        rows="1"
        placeholder="Digite sua pergunta..."
        :disabled="disabled"
        class="max-h-44 min-h-14 flex-1 resize-none bg-transparent px-2 py-3.5 text-base leading-7 text-[#142854] outline-none placeholder:text-slate-400 disabled:opacity-50 sm:text-lg"
        @input="resize"
        @keydown="handleKeydown"
      />
      <button
        :disabled="disabled || !text.trim()"
        title="Enviar pergunta"
        class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#00a155] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#079052] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:translate-y-0 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
        @click="handleSend"
      >
        <UIcon
          name="i-lucide-send"
          class="h-5 w-5"
        />
      </button>
    </div>
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
  el.style.height = `${Math.min(el.scrollHeight, 176)}px`
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
