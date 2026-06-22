<template>
  <a
    v-if="hasUrl"
    :href="source.url"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Abrir fonte oficial: ${cleanTitle}`"
    class="group flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-[#1a2e5a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#00a155] hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
  >
    <span class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[#00a155] ring-1 ring-emerald-100 transition-colors group-hover:bg-[#00a155] group-hover:text-white">
      <UIcon
        :name="source.kind === 'web' ? 'i-lucide-globe-2' : 'i-lucide-link'"
        class="h-4 w-4"
      />
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-[15px] font-semibold leading-5">
        {{ cleanTitle }}
      </span>
      <span class="mt-1 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
        <span
          v-if="source.kind === 'web'"
          class="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-emerald-700"
        >
          web
        </span>
        <span class="truncate">{{ sourceHost }}</span>
        <UIcon
          name="i-lucide-external-link"
          class="h-3.5 w-3.5 shrink-0 text-slate-400 transition-colors group-hover:text-[#1a2e5a]"
        />
      </span>
    </span>
  </a>

  <div
    v-else
    class="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left text-[#1a2e5a] shadow-sm"
  >
    <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-slate-500 ring-1 ring-slate-200">
      <UIcon
        name="i-lucide-file-text"
        class="h-4 w-4"
      />
    </span>
    <span class="min-w-0">
      <span class="block truncate text-sm font-semibold leading-5">
        {{ cleanTitle }}
      </span>
      <span class="text-xs font-medium text-slate-500">Fonte sem link cadastrado</span>
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
    return 'Fonte oficial'
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
