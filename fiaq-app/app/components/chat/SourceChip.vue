<template>
  <a
    v-if="hasUrl"
    :href="source.url"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Abrir fonte oficial: ${cleanTitle}`"
    class="group flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[#1a2e5a] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-colors duration-200 hover:border-[#00a155] hover:bg-emerald-50/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
  >
    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-emerald-50 text-[#00a155] ring-1 ring-emerald-100">
      <UIcon
        :name="source.kind === 'web' ? 'i-lucide-globe-2' : 'i-lucide-database'"
        class="h-3.5 w-3.5"
      />
    </span>

    <span
      class="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-black uppercase"
      :class="source.kind === 'web'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'
        : 'bg-blue-50 text-[#1a2e5a] ring-1 ring-blue-100'"
    >
      {{ source.kind === 'web' ? 'web' : 'rag' }}
    </span>

    <span class="min-w-0 flex-1 truncate text-sm font-semibold leading-5">
      {{ cleanTitle }}
    </span>

    <span class="hidden min-w-0 shrink-0 items-center gap-1.5 text-xs font-medium text-slate-500 sm:flex">
      <span class="max-w-40 truncate">{{ sourceHost }}</span>
      <UIcon
        name="i-lucide-external-link"
        class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-[#1a2e5a]"
      />
    </span>
  </a>

  <div
    v-else
    class="flex min-h-10 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left text-[#1a2e5a] shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
  >
    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[#1a2e5a]">
      <UIcon
        name="i-lucide-database"
        class="h-3.5 w-3.5"
      />
    </span>
    <span class="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-black uppercase text-[#1a2e5a] ring-1 ring-blue-100">
      rag
    </span>
    <span class="min-w-0 flex-1 truncate text-sm font-semibold leading-5">
      {{ cleanTitle }}
    </span>
    <span class="hidden shrink-0 text-xs font-medium text-slate-400 sm:inline">
      fonte sem link
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Source } from '~/composables/useFiaqChat'

const props = defineProps<{ source: Source }>()

const hasUrl = computed(() => /^https?:\/\//i.test(props.source.url ?? ''))

const cleanTitle = computed(() => {
  const title = decodeEntities(props.source.titulo || 'Fonte oficial')
    .replace(/\s+/g, ' ')
    .trim()

  return title || 'Fonte oficial'
})

const sourceHost = computed(() => {
  try {
    return new URL(props.source.url).hostname.replace(/^www\./, '')
  } catch {
    return 'base fIAq'
  }
})

function decodeEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}
</script>
