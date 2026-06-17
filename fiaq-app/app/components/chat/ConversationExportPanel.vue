<template>
  <section
    v-if="canExport"
    ref="panelEl"
    class="rounded-lg border border-slate-200 bg-white px-3 py-3 shadow-sm ring-1 ring-white/70 sm:px-4"
  >
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="flex min-w-0 items-center gap-2 text-[#1a2e5a]">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-100 text-green-700">
          <UIcon
            name="i-lucide-download"
            class="h-4 w-4"
          />
        </span>
        <div class="min-w-0">
          <p class="text-sm font-bold">
            Salvar conversa
          </p>
          <p class="text-xs text-slate-500">
            {{ messages.length }} {{ messages.length === 1 ? 'mensagem' : 'mensagens' }}
          </p>
        </div>
      </div>

      <div class="flex flex-wrap items-center justify-end gap-2">
        <button
          v-for="option in primaryExportOptions"
          :key="option.format"
          type="button"
          :disabled="disabled || busy"
          :title="option.title"
          class="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#1a2e5a] bg-[#1a2e5a] px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#243d75] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
          @click="handleExport(option.format)"
        >
          <UIcon
            :name="option.icon"
            class="h-4 w-4"
          />
          {{ option.label }}
        </button>

        <div class="relative">
          <button
            type="button"
            :disabled="disabled || busy"
            :aria-expanded="showExportMenu"
            aria-haspopup="menu"
            title="Mais formatos"
            class="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#1a2e5a] shadow-sm transition-colors hover:border-[#1a2e5a] hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            @click.stop="showExportMenu = !showExportMenu"
            @keydown.escape="showExportMenu = false"
          >
            <UIcon
              name="i-lucide-ellipsis"
              class="h-4 w-4"
            />
            Mais
          </button>

          <div
            v-if="showExportMenu"
            role="menu"
            class="absolute bottom-full right-0 z-20 mb-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5"
          >
            <button
              v-for="option in secondaryExportOptions"
              :key="option.format"
              type="button"
              role="menuitem"
              class="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-[#1a2e5a] focus:bg-slate-100 focus:outline-none"
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
    </div>

    <p
      v-if="status"
      class="mt-2 text-right text-xs font-medium"
      :class="statusKind === 'error' ? 'text-red-600' : 'text-slate-500'"
    >
      {{ status }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Message } from '~/composables/useFiaqChat'
import {
  exportConversation,
  type ConversationExportFormat
} from '~/utils/conversationExport'

const props = defineProps<{
  messages: Message[]
  disabled: boolean
}>()

const panelEl = ref<HTMLElement | null>(null)
const status = ref('')
const statusKind = ref<'info' | 'error'>('info')
const busy = ref(false)
const showExportMenu = ref(false)

const canExport = computed(() => props.messages.some(message => message.content.trim()))

const primaryExportOptions: Array<{
  format: ConversationExportFormat
  label: string
  title: string
  icon: string
}> = [
  { format: 'pdf', label: 'PDF', title: 'Exportar como PDF', icon: 'i-lucide-file-down' },
  { format: 'xls', label: 'Excel', title: 'Exportar para Excel', icon: 'i-lucide-table' }
]

const secondaryExportOptions: Array<{
  format: ConversationExportFormat
  label: string
  title: string
  icon: string
}> = [
  { format: 'md', label: 'Markdown', title: 'Exportar como Markdown', icon: 'i-lucide-file-code' },
  { format: 'json', label: 'JSON', title: 'Exportar conversa temporária', icon: 'i-lucide-file-json' },
  { format: 'txt', label: 'Texto', title: 'Exportar como texto', icon: 'i-lucide-file-text' }
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

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node) || panelEl.value?.contains(target)) return
  showExportMenu.value = false
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>
