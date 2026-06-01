<template>
  <div class="shrink-0">
    <div class="flex w-full rounded-lg overflow-hidden shadow-md border border-gray-200 bg-white">
      <input
        v-model="text"
        type="text"
        placeholder="Digite sua pergunta..."
        :disabled="disabled"
        class="flex-1 bg-white text-[#1a2e5a] placeholder-gray-400 px-5 py-3.5 text-sm outline-none disabled:opacity-50"
        @keydown.enter="handleSend"
      >
      <button
        :disabled="disabled || !text.trim()"
        class="bg-[#1a2e5a] text-white font-bold px-6 py-3.5 text-sm hover:bg-[#243d75] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        @click="handleSend"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          viewBox="0 0 24 24"
        >
          <path
            d="M22 2L11 13"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
          <path
            d="M22 2L15 22 11 13 2 9l20-7z"
            stroke="currentColor"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Enviar
      </button>
    </div>
    <p class="text-center text-[10px] text-gray-400 mt-2">
      Assistente em fase experimental. Pode cometer erros.
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ disabled: boolean }>()

const emit = defineEmits<{
  send: [text: string]
}>()

const text = ref('')

function handleSend() {
  const trimmed = text.value.trim()
  if (!trimmed) return
  emit('send', trimmed)
  text.value = ''
}
</script>
