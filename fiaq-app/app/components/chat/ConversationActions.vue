<template>
  <div class="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2 shadow-sm ring-1 ring-white/70">
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <span
        class="inline-flex h-9 items-center gap-2 rounded-lg bg-slate-100 px-3 text-xs font-bold text-slate-600"
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
        class="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
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

    <button
      type="button"
      :disabled="disabled || busy || !canClear"
      aria-label="Limpar conversa"
      title="Limpar conversa"
      class="inline-flex h-9 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      @click="handleClear"
    >
      <UIcon
        name="i-lucide-trash-2"
        class="h-4 w-4"
      />
    </button>

    <p
      v-if="status"
      class="basis-full text-right text-xs font-medium"
      :class="statusKind === 'error' ? 'text-red-600' : 'text-slate-500'"
    >
      {{ status }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
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

const canClear = computed(() => props.messages.some(message => message.content.trim()))

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
    statusKind.value = 'info'
    status.value = 'Conversa importada.'
  } catch {
    statusKind.value = 'error'
    status.value = 'Arquivo inválido.'
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
  statusKind.value = 'info'
  status.value = 'Conversa limpa.'
}
</script>
