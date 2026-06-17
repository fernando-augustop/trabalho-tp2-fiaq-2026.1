<template>
  <!-- eslint-disable vue/no-v-html -->
  <!-- User bubble -->
  <div
    v-if="message.role === 'user'"
    class="flex justify-end"
  >
    <div class="max-w-[88%] rounded-2xl rounded-br-sm bg-[#1a2e5a] px-5 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[75%]">
      {{ message.content }}
    </div>
  </div>

  <!-- Assistant bubble (só renderiza quando já há conteúdo; enquanto vazio, o
       TypingIndicator cobre a espera para não mostrar uma bolha vazia + cursor) -->
  <div
    v-else-if="showBody"
    class="flex justify-start gap-3"
  >
    <div class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1a2e5a] text-green-300 shadow-sm">
      <UIcon
        name="i-lucide-bot"
        class="h-4 w-4"
      />
    </div>

    <div class="flex w-full max-w-[min(56rem,92vw)] flex-col gap-2">
      <!-- Message content -->
      <div class="rounded-2xl rounded-bl-sm border border-gray-200 bg-white px-5 py-3 text-sm leading-relaxed text-[#1a2e5a] shadow-sm">
        <div
          class="fiaq-prose"
          v-html="renderedContent"
        />
        <span
          v-if="message.streaming"
          class="inline-block w-1.5 h-3.5 bg-[#1a2e5a] ml-0.5 align-middle animate-pulse"
        />
      </div>

      <!-- Sources -->
      <div
        v-if="message.sources && message.sources.length > 0"
        class="grid gap-2 px-1"
      >
        <p class="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
          <UIcon
            name="i-lucide-book-open"
            class="h-3.5 w-3.5 text-green-600"
          />
          Fontes consultadas
        </p>
        <ChatSourceChip
          v-for="source in message.sources"
          :key="source.id"
          :source="source"
        />
      </div>

      <div
        v-if="!message.streaming"
        ref="actionsEl"
        class="flex flex-wrap items-center gap-2 px-1 pt-1"
      >
        <button
          type="button"
          :title="copyTitle"
          class="inline-flex h-8 items-center gap-1.5 rounded-lg border bg-white px-2.5 text-[11px] font-semibold shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
          :class="copyStatus === 'error'
            ? 'border-red-200 text-red-600 hover:border-red-300'
            : 'border-slate-200 text-slate-600 hover:border-[#1a2e5a] hover:text-[#1a2e5a]'"
          @click="copyMessage"
        >
          <UIcon
            :name="copyIcon"
            class="h-3.5 w-3.5"
          />
          {{ copyLabel }}
        </button>

        <div class="relative">
          <button
            type="button"
            :disabled="exportBusy"
            :aria-expanded="showExportMenu"
            aria-haspopup="menu"
            title="Baixar conversa"
            class="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-[#1a2e5a] hover:text-[#1a2e5a] focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
            @click.stop="showExportMenu = !showExportMenu"
            @keydown.escape="showExportMenu = false"
          >
            <UIcon
              name="i-lucide-download"
              class="h-3.5 w-3.5"
            />
            Baixar
            <UIcon
              name="i-lucide-chevron-down"
              class="h-3 w-3"
            />
          </button>

          <div
            v-if="showExportMenu"
            role="menu"
            class="absolute bottom-full left-0 z-30 mb-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-xl ring-1 ring-slate-900/5"
          >
            <button
              v-for="option in exportOptions"
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

        <span
          v-if="actionStatus"
          class="text-[11px] font-medium"
          :class="actionStatusKind === 'error' ? 'text-red-600' : 'text-slate-500'"
        >
          {{ actionStatus }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Message } from '~/composables/useFiaqChat'
import { renderMarkdown } from '~/utils/markdown'
import {
  exportConversation,
  type ConversationExportFormat
} from '~/utils/conversationExport'

const props = defineProps<{
  message: Message
  allMessages: Message[]
}>()
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
const actionStatus = ref('')
const actionStatusKind = ref<'info' | 'error'>('info')
const exportBusy = ref(false)
const showExportMenu = ref(false)
const actionsEl = ref<HTMLElement | null>(null)
let copyResetTimeout: number | null = null

// Só mostra a bolha do assistente quando há texto (ou quando o stream terminou).
const showBody = computed(() => (props.message.content?.trim().length ?? 0) > 0 || !props.message.streaming)

// Remove links/URLs do texto do assistente — os links oficiais e verificados
// são exibidos nos chips de Fonte abaixo. Isso evita URLs inventadas pelo modelo.
function stripLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1') // [texto](url) -> texto
    .replace(/<https?:\/\/[^>]+>/gi, '') // <http://...>
    .replace(/\bhttps?:\/\/\S+/gi, '') // urls cruas
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

// Renderiza o Markdown da resposta do assistente em HTML (sem links no corpo).
const renderedContent = computed(() => {
  const clean = stripLinks(props.message.content ?? '')
  return renderMarkdown(clean)
})

const copyTitle = computed(() => {
  if (copyStatus.value === 'copied') return 'Copiado'
  if (copyStatus.value === 'error') return 'Não foi possível copiar'
  return 'Copiar mensagem'
})

const copyIcon = computed(() => {
  if (copyStatus.value === 'copied') return 'i-lucide-check'
  if (copyStatus.value === 'error') return 'i-lucide-circle-alert'
  return 'i-lucide-copy'
})

const copyLabel = computed(() => {
  if (copyStatus.value === 'copied') return 'Copiado'
  if (copyStatus.value === 'error') return 'Erro'
  return 'Copiar mensagem'
})

const exportOptions: Array<{
  format: ConversationExportFormat
  label: string
  icon: string
}> = [
  { format: 'pdf', label: 'PDF', icon: 'i-lucide-file-down' },
  { format: 'xls', label: 'Excel', icon: 'i-lucide-table' },
  { format: 'md', label: 'Markdown', icon: 'i-lucide-file-code' },
  { format: 'json', label: 'JSON', icon: 'i-lucide-file-json' },
  { format: 'txt', label: 'Texto', icon: 'i-lucide-file-text' }
]

function clearCopyResetTimeout() {
  if (copyResetTimeout === null) return
  window.clearTimeout(copyResetTimeout)
  copyResetTimeout = null
}

function scheduleCopyReset() {
  clearCopyResetTimeout()
  copyResetTimeout = window.setTimeout(() => {
    copyStatus.value = 'idle'
    actionStatus.value = ''
    copyResetTimeout = null
  }, 1600)
}

function fallbackCopy(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

async function copyMessage() {
  const text = plainCopy.value
  if (!text) return

  clearCopyResetTimeout()

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else if (!fallbackCopy(text)) {
      throw new Error('COPY_FAILED')
    }
    copyStatus.value = 'copied'
    actionStatus.value = 'Copiado.'
    actionStatusKind.value = 'info'
    scheduleCopyReset()
  } catch {
    copyStatus.value = fallbackCopy(text) ? 'copied' : 'error'
    actionStatus.value = copyStatus.value === 'copied' ? 'Copiado.' : 'Não foi possível copiar.'
    actionStatusKind.value = copyStatus.value === 'copied' ? 'info' : 'error'
    scheduleCopyReset()
  }
}

async function handleExport(format: ConversationExportFormat) {
  if (exportBusy.value) return

  showExportMenu.value = false
  actionStatus.value = ''
  exportBusy.value = true

  try {
    await exportConversation(props.allMessages, format)
    actionStatus.value = 'Baixado.'
    actionStatusKind.value = 'info'
  } catch {
    actionStatus.value = 'Não foi possível baixar.'
    actionStatusKind.value = 'error'
  } finally {
    exportBusy.value = false
  }
}

function handleDocumentClick(event: MouseEvent) {
  const target = event.target
  if (!(target instanceof Node) || actionsEl.value?.contains(target)) return
  showExportMenu.value = false
}

const plainCopy = computed(() => stripLinks(props.message.content ?? '').trim())

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  clearCopyResetTimeout()
})
</script>

<style scoped>
.fiaq-prose :deep(p) { margin: 0 0 0.5rem; }
.fiaq-prose :deep(p:last-child) { margin-bottom: 0; }
.fiaq-prose :deep(a) { color: #2563eb; text-decoration: underline; word-break: break-word; }
.fiaq-prose :deep(ul),
.fiaq-prose :deep(ol) { margin: 0.25rem 0 0.5rem; padding-left: 1.25rem; }
.fiaq-prose :deep(ul) { list-style: disc; }
.fiaq-prose :deep(ol) { list-style: decimal; }
.fiaq-prose :deep(li) { margin: 0.15rem 0; }
.fiaq-prose :deep(strong) { font-weight: 700; }
.fiaq-prose :deep(code) {
  background: #f1f5f9; padding: 0.05rem 0.3rem; border-radius: 0.25rem;
  font-size: 0.85em;
}
.fiaq-prose :deep(blockquote) {
  border-left: 3px solid #cbd5e1; padding-left: 0.75rem;
  margin: 0.25rem 0; color: #475569;
}
.fiaq-prose :deep(h1),
.fiaq-prose :deep(h2),
.fiaq-prose :deep(h3) { font-weight: 700; margin: 0.4rem 0 0.25rem; }
</style>
