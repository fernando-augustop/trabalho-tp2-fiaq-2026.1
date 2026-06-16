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

    <div class="flex max-w-[88%] flex-col gap-2 sm:max-w-[78%]">
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

      <div
        v-if="!message.streaming"
        class="flex items-center gap-2 px-1"
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import type { Message } from '~/composables/useFiaqChat'
import { renderMarkdown } from '~/utils/markdown'

const props = defineProps<{ message: Message }>()
const copyStatus = ref<'idle' | 'copied' | 'error'>('idle')
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
  return 'Copiar resposta'
})

const copyIcon = computed(() => {
  if (copyStatus.value === 'copied') return 'i-lucide-check'
  if (copyStatus.value === 'error') return 'i-lucide-circle-alert'
  return 'i-lucide-copy'
})

const copyLabel = computed(() => {
  if (copyStatus.value === 'copied') return 'Copiado'
  if (copyStatus.value === 'error') return 'Erro'
  return 'Copiar'
})

function clearCopyResetTimeout() {
  if (copyResetTimeout === null) return
  window.clearTimeout(copyResetTimeout)
  copyResetTimeout = null
}

function scheduleCopyReset() {
  clearCopyResetTimeout()
  copyResetTimeout = window.setTimeout(() => {
    copyStatus.value = 'idle'
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
    scheduleCopyReset()
  } catch {
    copyStatus.value = fallbackCopy(text) ? 'copied' : 'error'
    scheduleCopyReset()
  }
}

const plainCopy = computed(() => stripLinks(props.message.content ?? '').trim())

onBeforeUnmount(clearCopyResetTimeout)
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
