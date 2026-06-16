<template>
  <div
    ref="actionsEl"
    class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/85 px-3 py-2 shadow-sm ring-1 ring-white/70"
  >
    <div class="flex min-w-0 flex-wrap items-center gap-2">
      <span class="inline-flex h-9 items-center gap-2 rounded-xl bg-slate-100 px-3 text-xs font-bold text-slate-600">
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
        class="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
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
      <button
        type="button"
        :disabled="disabled || busy || !canExport"
        title="Limpar conversa"
        class="inline-flex h-9 items-center justify-center rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleClear"
      >
        <UIcon
          name="i-lucide-trash-2"
          class="h-4 w-4"
        />
      </button>
    </div>

    <div class="flex flex-wrap items-center justify-end gap-2">
      <button
        type="button"
        :disabled="disabled || busy || !canExport"
        title="Exportar conversa como PDF"
        class="inline-flex h-9 min-w-14 items-center justify-center gap-1.5 rounded-xl border border-[#1a2e5a] bg-[#1a2e5a] px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
        @click="handleExport('pdf')"
      >
        <UIcon
          name="i-lucide-file-down"
          class="h-4 w-4"
        />
        PDF
      </button>

      <div class="relative">
        <button
          type="button"
          :disabled="disabled || busy || !canExport"
          :aria-expanded="showExportMenu"
          aria-haspopup="menu"
          title="Mais formatos de exportação"
          class="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click.stop="showExportMenu = !showExportMenu"
          @keydown.escape="showExportMenu = false"
        >
          <UIcon
            name="i-lucide-download"
            class="h-4 w-4"
          />
          Exportar
          <UIcon
            name="i-lucide-chevron-down"
            class="h-3.5 w-3.5"
          />
        </button>

        <div
          v-if="showExportMenu"
          role="menu"
          class="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5"
        >
          <button
            v-for="option in secondaryExportOptions"
            :key="option.format"
            type="button"
            role="menuitem"
            class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#1a2e5a] focus:bg-slate-100 focus:outline-none"
            @click="handleExport(option.format)"
          >
            <UIcon
              :name="option.icon"
              class="h-4 w-4"
            />
            {{ option.label }}
          </button>
        </div>
      </div>
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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
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
  clear: []
}>()

const actionsEl = ref<HTMLElement | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const status = ref('')
const statusKind = ref<'info' | 'error'>('info')
const busy = ref(false)
const showExportMenu = ref(false)

const canExport = computed(() => props.messages.some(message => message.content.trim()))

const secondaryExportOptions: Array<{
  format: ConversationExportFormat
  label: string
  title: string
  icon: string
}> = [
  { format: 'md', label: 'Markdown', title: 'Exportar como Markdown', icon: 'i-lucide-file-code' },
  { format: 'txt', label: 'Texto', title: 'Exportar como texto', icon: 'i-lucide-file-text' },
  { format: 'json', label: 'JSON', title: 'Exportar conversa temporária', icon: 'i-lucide-file-json' }
]

async function handleExport(format: ConversationExportFormat) {
  if (busy.value) return

  showExportMenu.value = false
  status.value = ''
  busy.value = true

  try {
    await exportConversation(props.messages, format)
    statusKind.value = 'info'
    status.value = 'Exportado.'
  } catch {
    statusKind.value = 'error'
    status.value = 'Não foi possível exportar.'
  } finally {
    busy.value = false
  }
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
    busy.value = false
  }
}

function handleClear() {
  if (!canExport.value) return
  showExportMenu.value = false
  const confirmed = window.confirm('Limpar a conversa atual?')
  if (!confirmed) return

  emit('clear')
  statusKind.value = 'info'
  status.value = 'Conversa limpa.'
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node) || actionsEl.value?.contains(target)) return
  showExportMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
