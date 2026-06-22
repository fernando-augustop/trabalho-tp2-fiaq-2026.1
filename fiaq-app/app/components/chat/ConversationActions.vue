<template>
  <div class="flex min-h-16 flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-3 py-2.5 shadow-sm ring-1 ring-white/70">
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <span
        class="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-100 px-3.5 text-sm font-bold text-slate-600"
        title="Mensagens"
      >
        <UIcon
          name="i-lucide-messages-square"
          class="h-4 w-4 text-[#1a2e5a]"
        />
        {{ messages.length }}
      </span>

      <button
        type="button"
        :disabled="disabled || busy"
        title="Importar conversa temporária"
        class="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 text-sm font-semibold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
        @click="fileInput?.click()"
      >
        <UIcon
          name="i-lucide-upload"
          class="h-4 w-4"
        />
        Importar
      </button>

      <input
        ref="fileInput"
        type="file"
        class="hidden"
        accept="application/json,.json"
        @change="handleImport"
      >
    </div>

    <div class="ml-auto flex min-w-0 items-center gap-2">
      <Transition name="fiaq-status">
        <span
          v-if="status"
          class="inline-flex max-w-[14rem] truncate rounded-full px-3 py-1 text-sm font-medium"
          :class="statusKind === 'error'
            ? 'bg-red-50 text-red-700 ring-1 ring-red-100'
            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'"
        >
          {{ status }}
        </span>
      </Transition>

      <button
        type="button"
        :disabled="disabled || busy || !canClear"
        aria-label="Limpar conversa"
        title="Limpar conversa"
        class="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleClear"
      >
        <UIcon
          name="i-lucide-trash-2"
          class="h-4 w-4"
        />
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { Message, MessageDraft } from '~/composables/useFiaqChat'
import { readConversationFile } from '~/utils/conversationExport'

const props = defineProps<{
  messages: Message[]
  disabled: boolean
}>()

const emit = defineEmits<{
  import: [messages: MessageDraft[]]
  clear: []
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const status = ref('')
const statusKind = ref<'info' | 'error'>('info')
const busy = ref(false)
let statusTimeout: number | null = null

const canClear = computed(() => props.messages.some(message => message.content.trim()))

function showStatus(message: string, kind: 'info' | 'error' = 'info') {
  status.value = message
  statusKind.value = kind

  if (statusTimeout !== null) window.clearTimeout(statusTimeout)
  statusTimeout = window.setTimeout(() => {
    status.value = ''
    statusTimeout = null
  }, 2200)
}

async function handleImport(event: Event) {
  const input = event.target as HTMLInputElement
  if (busy.value) {
    input.value = ''
    return
  }

  status.value = ''
  const file = input.files?.[0]
  if (!file) return

  busy.value = true
  try {
    const importedMessages = await readConversationFile(file)
    const shouldReplace = !canClear.value || window.confirm('Substituir a conversa atual pela conversa importada?')
    if (!shouldReplace) return

    emit('import', importedMessages)
    showStatus('Conversa importada.')
  } catch {
    showStatus('Arquivo inválido.', 'error')
  } finally {
    input.value = ''
    busy.value = false
  }
}

function handleClear() {
  if (!canClear.value) return
  const confirmed = window.confirm('Limpar a conversa atual?')
  if (!confirmed) return

  emit('clear')
  showStatus('Conversa limpa.')
}

onBeforeUnmount(() => {
  if (statusTimeout !== null) window.clearTimeout(statusTimeout)
})
</script>

<style scoped>
.fiaq-status-enter-active,
.fiaq-status-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.fiaq-status-enter-from,
.fiaq-status-leave-to {
  opacity: 0;
  transform: translateX(0.35rem);
}
</style>
