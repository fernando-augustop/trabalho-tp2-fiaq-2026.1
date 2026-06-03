<template>
  <a
    v-if="hasUrl"
    :href="source.url"
    target="_blank"
    rel="noopener noreferrer"
    :title="`Abrir fonte oficial: ${cleanTitle}`"
    class="group flex min-w-0 items-start gap-3 rounded-lg border border-blue-200 bg-blue-50/75 px-3 py-2 text-left text-[#1a2e5a] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[#1a2e5a] hover:bg-white hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400"
  >
    <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white text-[#1a2e5a] ring-1 ring-blue-100 transition-colors group-hover:bg-[#1a2e5a] group-hover:text-green-400">
      <UIcon
        name="i-lucide-link"
        class="h-4 w-4"
      />
    </span>

    <span class="min-w-0 flex-1">
      <span class="block truncate text-sm font-semibold leading-5">
        {{ cleanTitle }}
      </span>
      <span class="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs font-medium text-slate-500">
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
    class="flex min-w-0 items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-[#1a2e5a]"
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
