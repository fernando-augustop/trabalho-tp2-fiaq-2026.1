<template>
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div class="flex items-center gap-2">
      <button
        type="button"
        :disabled="disabled"
        title="Importar conversa temporária"
        class="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
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

    <div class="flex flex-wrap items-center justify-end gap-2">
      <button
        v-for="option in exportOptions"
        :key="option.format"
        type="button"
        :disabled="disabled || !canExport"
        :title="option.title"
        class="inline-flex h-9 min-w-14 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleExport(option.format)"
      >
        <UIcon
          :name="option.icon"
          class="h-4 w-4"
        />
        {{ option.label }}
      </button>
    </div>

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
import {
  exportConversation,
  readConversationFile,
  type ConversationExportFormat
} from '~/utils/conversationExport'

const props = defineProps<{
  messages: Message[]
  disabled: boolean
}>()

const emit = defineEmits<{
  import: [messages: MessageDraft[]]
}>()

const fileInput = ref<HTMLInputElement | null>(null)
const status = ref('')
const statusKind = ref<'info' | 'error'>('info')

const canExport = computed(() => props.messages.some(message => message.content.trim()))

const exportOptions: Array<{
  format: ConversationExportFormat
  label: string
  title: string
  icon: string
}> = [
  { format: 'json', label: 'JSON', title: 'Exportar conversa temporária', icon: 'i-lucide-file-json' },
  { format: 'txt', label: 'TXT', title: 'Exportar como texto', icon: 'i-lucide-file-text' },
  { format: 'md', label: 'MD', title: 'Exportar como Markdown', icon: 'i-lucide-file-code' },
  { format: 'pdf', label: 'PDF', title: 'Exportar como PDF', icon: 'i-lucide-file-down' }
]

async function handleExport(format: ConversationExportFormat) {
  status.value = ''

  try {
    await exportConversation(props.messages, format)
    statusKind.value = 'info'
    status.value = 'Exportado.'
  } catch {
    statusKind.value = 'error'
    status.value = 'Não foi possível exportar.'
  }
}

async function handleImport(event: Event) {
  status.value = ''
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  try {
    const importedMessages = await readConversationFile(file)
    const shouldReplace = !canExport.value || window.confirm('Substituir a conversa atual pela conversa importada?')
    if (!shouldReplace) return

    emit('import', importedMessages)
    statusKind.value = 'info'
    status.value = 'Conversa importada.'
  } catch {
    statusKind.value = 'error'
    status.value = 'Arquivo inválido.'
  } finally {
    input.value = ''
  }
}
</script>
