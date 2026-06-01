<template>
  <!-- User bubble -->
  <div v-if="message.role === 'user'" class="flex justify-end">
    <div class="bg-[#1a2e5a] text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-[75%] text-sm leading-relaxed shadow-sm">
      {{ message.content }}
    </div>
  </div>

  <!-- Assistant bubble (só renderiza quando já há conteúdo; enquanto vazio, o
       TypingIndicator cobre a espera para não mostrar uma bolha vazia + cursor) -->
  <div v-else-if="showBody" class="flex justify-start gap-3">
    <div class="w-8 h-8 bg-[#1a2e5a] rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
      <svg class="w-4 h-4 text-green-400" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24">
        <rect x="5" y="7" width="14" height="10" rx="2.5" stroke="currentColor"/>
        <circle cx="9" cy="11" r="1.2" fill="currentColor" stroke="none"/>
        <circle cx="15" cy="11" r="1.2" fill="currentColor" stroke="none"/>
        <path d="M9 14.5h6" stroke="currentColor" stroke-linecap="round"/>
        <path d="M12 7V4" stroke="currentColor" stroke-linecap="round"/>
        <circle cx="12" cy="3.5" r="0.8" fill="currentColor" stroke="none"/>
      </svg>
    </div>

    <div class="flex flex-col gap-2 max-w-[75%]">
      <!-- Message content -->
      <div class="bg-white border border-gray-200 text-[#1a2e5a] rounded-2xl rounded-bl-sm px-5 py-3 text-sm leading-relaxed shadow-sm">
        <div class="fiaq-prose" v-html="renderedContent" />
        <span v-if="message.streaming" class="inline-block w-1.5 h-3.5 bg-[#1a2e5a] ml-0.5 align-middle animate-pulse" />
      </div>

      <!-- Sources -->
      <div v-if="message.sources && message.sources.length > 0" class="flex flex-wrap gap-2 px-1">
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
import { computed } from 'vue'
import { marked } from 'marked'
import type { Message } from '~/composables/useFiaqChat'

const props = defineProps<{ message: Message }>()

// Só mostra a bolha do assistente quando há texto (ou quando o stream terminou).
const showBody = computed(() => (props.message.content?.trim().length ?? 0) > 0 || !props.message.streaming)

marked.setOptions({ breaks: true, gfm: true })

// Remove links/URLs do texto do assistente — os links oficiais e verificados
// são exibidos nos chips de Fonte abaixo. Isso evita URLs inventadas pelo modelo.
function stripLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((?:[^)]*)\)/g, '$1') // [texto](url) -> texto
    .replace(/<https?:\/\/[^>]+>/gi, '')          // <http://...>
    .replace(/\bhttps?:\/\/\S+/gi, '')            // urls cruas
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+([.,;:!?])/g, '$1')
}

// Renderiza o Markdown da resposta do assistente em HTML (sem links no corpo).
const renderedContent = computed(() => {
  const clean = stripLinks(props.message.content ?? '')
  return marked.parse(clean, { async: false }) as string
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
